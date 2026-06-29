import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, ArrowLeft, Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

const SUPABASE_URL = 'https://swgisbcfmtzrbevsqtwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2lzYmNmbXR6cmJldnNxdHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjgxNzQsImV4cCI6MjA4NDk0NDE3NH0.IEk5RfQw5kYOXbaNycV5_xkP5j106AKfwy4zYX6Oqjk';

const getRelayScript = () => `"""
RL Broadcast Relay V3 (Python) — oficjalne RL Stats API (lokalny TCP/JSON stream)

Zrodlo danych: Rocket League Stats API (TAGame.MatchStatsExporter_TA), port 49123.
Skrypt laczy sie z lokalnym TCP streamem RL i parsuje strumien JSON-ow.

ARCHITEKTURA (v3):
  TCP (49123) -> stan w pamieci (state_lock).
  WS  (49300) = PRIMARY live channel dla overlayu na TEJ samej maszynie.
                Wysyla pelne ramki v3: match + players + camera + series + teams,
                30-60 Hz, plus keepalive nawet gdy RL nie pcha UpdateState.
  HTTP (49301) = control plane. Dashboard wysyla nadpisy serii / drużyn
                 przez relay-http.ts; relay wpina je do kolejnych ramek WS.
  Supabase    = opcjonalny fallback. SUPABASE_LIVE_WRITES=False (default) ->
                relay nie spamuje bazy w trakcie meczu. Overlay zywi sie WS-em.
                Gdy potrzebny remote overlay (OBS na innej maszynie), ustaw
                SUPABASE_LIVE_WRITES=True ponizej — wraca zachowanie v2.4
                (zapisy match_metadata / players_live / active_camera).

Overlay /v2/overlay parsuje obie formy ramki: stary {t, players} i nowy
{v:3, match, players, camera, series, teams}. Upgrade v2.4 -> v3 bez koordynacji.

Dziala w meczach competitive online, meczach z botami oraz w replayach z Match History.

INSTALACJA:
  1) Python 3.10+
  2) pip install supabase requests websockets
  3) Wlacz w grze plik DefaultStatsAPI.ini (patrz /relay w aplikacji).
  4) python relay.py

Plik wygenerowany na stronie /relay — nie musisz nic edytowac.
"""

import asyncio
import json
import socket
import signal
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional, Set

try:
    from supabase import create_client, Client  # type: ignore
except Exception as e:
    raise SystemExit(
        "Brakuje pakietu 'supabase'. Uruchom: pip install supabase requests\\n"
        f"Szczegol: {e}"
    )

try:
    import requests  # type: ignore
except Exception as e:
    raise SystemExit(
        "Brakuje pakietu 'requests'. Uruchom: pip install requests\\n"
        f"Szczegol: {e}"
    )

# === KONFIGURACJA (wstrzykiwana przez Lovable) ===
SUPABASE_URL = '${SUPABASE_URL}'
SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}'
RL_HOST = "127.0.0.1"
RL_PORT = 49123

# === ARCHITECTURE v3: WS = PRIMARY, Supabase = OPCJONALNY ===
# Domyslnie relay NIE pisze do Supabase w trakcie meczu — overlay /v2/overlay
# na tej samej maszynie czyta WSZYSTKO z WS (match + players + camera + series
# + teams). Ustaw True jesli potrzebujesz remote overlayu (OBS na innej maszynie)
# lub historycznych zapisow w bazie.
SUPABASE_LIVE_WRITES = False

WRITE_INTERVAL_S = 0.025     # tempo workera DB (~40 Hz). Uzywane tylko gdy
                             # SUPABASE_LIVE_WRITES=True.
PRUNE_INTERVAL_S = 2.0       # co ile worker sprzata players_live
HEARTBEAT_S = 5.0
LOCAL_TICK_S = 0.1
NO_DATA_WARN_S = 10.0
RECONNECT_DELAY_S = 3.0
RECV_CHUNK = 65536
RECV_SO_RCVBUF = 1 << 20     # 1 MiB — zapas na bufor TCP

# Safety cap: max liczba wierszy graczy flushowanych w ciagu 1 s. Chroni przed
# zalaniem Supabase przy nietypowych warunkach. 200/s = bardzo z gora przy 6 graczach.
MAX_PLAYER_ROWS_PER_S = 200

# === LOKALNY WEBSOCKET (v3) — pelne ramki live ===
# Tylko localhost. Overlay na tej samej maszynie laczy sie i dostaje pelny
# stan meczu (match/players/camera/series/teams) z opoznieniem ~10-30 ms.
WS_HOST = "127.0.0.1"
WS_PORT = 49300
WS_MAX_BROADCASTS_PER_S = 60                    # gorny limit zmian-driven
WS_BROADCAST_MIN_INTERVAL_S = 1.0 / WS_MAX_BROADCASTS_PER_S
WS_FULL_FRAME_HZ = 30                           # keepalive cadence
WS_FULL_FRAME_MIN_INTERVAL_S = 1.0 / WS_FULL_FRAME_HZ

# === LOKALNY HTTP CONTROL PLANE (v3) ===
# Dashboard / relay-http.ts wysylaja tu POST /series i POST /teams.
# Tylko localhost — bind 127.0.0.1, brak autoryzacji.
HTTP_HOST = "127.0.0.1"
HTTP_PORT = 49301

sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# === STAN ===
state_lock = threading.Lock()

last_event_at = 0.0
last_state_update_at = 0.0

current_match_guid: Optional[str] = None
pending_camera: Optional[str] = None
last_pushed_camera: Optional[str] = None  # by uniknac zbednych upsertow

# Lokalny zegar (interpolacja miedzy snapami z gry)
local_time_seconds: float = 300.0
is_overtime: bool = False
clock_running: bool = False
in_replay: bool = False  # bReplay z Game lub goal-replay window
blue_score: int = 0
orange_score: int = 0

# Snapshot graczy: { player_name -> row dict }. Worker DB go flushuje.
players_snapshot: Dict[str, Dict[str, Any]] = {}
# Ostatnio wyslane do bazy wiersze per-gracz — sluza do change-detection,
# zeby nie generowac zbednych UPDATE'ow Realtime gdy gracz sie nie zmienil.
last_pushed_players: Dict[str, Dict[str, Any]] = {}

# Czy aktualnie trwa mecz (sterowane WYLACZNIE eventami z RL Stats API).
# True  <- MatchCreated / MatchInitialized
# False <- MatchEnded / MatchDestroyed (lub graceful shutdown bota)
match_active: bool = False
shutting_down: bool = False

# Flagi 'dirty' dla workera DB
dirty_match: bool = False
dirty_camera: bool = False
clear_requested: bool = False  # nowy mecz -> wyczysc players_live

# === EVENT CHANNEL (MatchEnded / MatchDestroyed) ===
# Sygnalizujemy te eventy do bazy NIEZALEZNIE od SUPABASE_LIVE_WRITES,
# bo overlay/operator chca natychmiast inkrementowac serie lub ja zresetowac.
# local_event_seq inicjalizowany przy starcie z aktualnej wartosci w match_metadata.
local_event_seq: int = 0

# === OVERRIDES Z HTTP (v3) ===
override_lock = threading.Lock()
override_teams: Dict[str, str] = {"blue_name": "", "orange_name": ""}
override_series: Dict[str, Any] = {
    "type": "bo3", "blue": 0, "orange": 0,
    "blue_name": "", "orange_name": "",
}
http_clients_ok = True

# === POSTGAME (Faza 1) ===
# Akumulator zbierany w trakcie meczu (kopiuje pola API z UpdateState).
# Finalizowany RAZ na MatchEnded/PodiumStart -> last_postgame trzymany w pamieci
# do nastepnej finalizacji. ZERO zapisow do Supabase, ZERO heurystyk (pady/boost
# /supersonic/kickoff to Faza 2).
current_accum: Optional["MatchStatsAccumulator"] = None
last_postgame: Optional[Dict[str, Any]] = None
postgame_finalized: bool = False

# === POSTGAME (Faza 2) ===
# Liczniki czasowe potrzebne do heurystyk grantow padow + kickoff goals.
# Wszystkie pod state_lock.
last_kickoff_at: float = 0.0   # RoundStarted / GoalReplayEnd
last_goal_at: float = 0.0      # GoalScored
prev_overtime: bool = False
ot_started_at: float = 0.0
last_tick_at: float = 0.0      # ostatni UpdateState (do dt)

stats = {
    "events": 0, "events_delta": 0,
    "match_writes": 0, "match_writes_delta": 0,
    "player_writes": 0, "player_writes_delta": 0,
    "camera_writes": 0, "camera_writes_delta": 0,
    "db_errors": 0, "db_errors_delta": 0,
    "players_seen": 0,
    "mode": "waiting",  # waiting / live / replay / podium
    # Diagnostyka przepustowosci upstream (RL Stats API -> bot).
    "update_state_delta": 0,         # ile UpdateState w okresie HB
    "player_changes_delta": 0,       # ile faktycznych zmian wierszy w okresie HB
    "flushes_delta": 0,              # ile tickow workera faktycznie cos upsertowalo
    "player_writes_skipped_delta": 0,  # ile wierszy pominieto z powodu cap'a
    "ws_sends_delta": 0,             # ile broadcastow WS w okresie HB
    "ws_full_frames_delta": 0,       # ile pelnych ramek v3 wyslanych
    "http_requests_delta": 0,        # ile requestow HTTP control plane
}

# === WS GLOBALS ===
ws_clients: Set[Any] = set()
ws_loop: Optional[asyncio.AbstractEventLoop] = None
last_ws_send_ts: float = 0.0
ws_enabled: bool = False


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def fmt_timer(seconds: float) -> str:
    s = max(0, int(round(seconds)))
    return f"{s // 60}:{s % 60:02d}"


# === POSTGAME ACCUMULATOR (Faza 2) ===
# Trzyma ostatnie wartosci API per gracz + metryki czasowe (boost / supersonic /
# pad pickups) liczone tick po ticku oraz drużynowe kickoff goals (≤10 s od
# RoundStarted/GoalReplayEnd). Ranking par po Player.Score. Klasa nie robi I/O.
class MatchStatsAccumulator:
    def __init__(self) -> None:
        self.players: Dict[str, Dict[str, Any]] = {}
        self.team_kickoff_goals: Dict[int, int] = {0: 0, 1: 0}

    def reset(self) -> None:
        self.players.clear()
        self.team_kickoff_goals = {0: 0, 1: 0}

    def _ensure(self, name: str) -> Dict[str, Any]:
        p = self.players.get(name)
        if p is None:
            p = {
                "team_num": 0,
                "score": 0, "goals": 0, "assists": 0,
                "saves": 0, "shots": 0, "demos": 0,
                # Faza 2 — robocze
                "pad_pickups": 0,
                "supersonic_seconds": 0.0,
                "boost_sum": 0.0,
                "boost_samples": 0,
                "time_at_100_seconds": 0.0,
                "prev_boost": None,  # type: Optional[int]
            }
            self.players[name] = p
        return p

    def reset_prev_boost(self, name: str) -> None:
        p = self.players.get(name)
        if p is not None:
            p["prev_boost"] = None

    def on_player_row(self, row: Dict[str, Any]) -> None:
        """Faza 1: kopia pol API z UpdateState (last-write-wins). Bez heurystyk."""
        name = row.get("player_name")
        if not name:
            return
        p = self._ensure(name)
        p["team_num"] = int(row.get("team_num", 0) or 0)
        p["score"] = int(row.get("score", 0) or 0)
        p["goals"] = int(row.get("goals", 0) or 0)
        p["assists"] = int(row.get("assists", 0) or 0)
        p["saves"] = int(row.get("saves", 0) or 0)
        p["shots"] = int(row.get("shots", 0) or 0)
        p["demos"] = int(row.get("demos", 0) or 0)

    def set_baseline_boost(self, name: str, boost: int) -> None:
        """Poza aktywnym meczem / w replayu: tylko aktualizuj prev_boost,
        zeby pierwszy delta po wznowieniu nie wybuchnal."""
        p = self._ensure(name)
        p["prev_boost"] = int(boost)

    def on_boost_tick(
        self,
        player_name: str,
        team_num: int,
        boost: int,
        is_supersonic: bool,
        dt: float,
        now: float,
        last_goal_at_val: float = 0.0,
        last_kickoff_at_val: float = 0.0,
        ot_started_at_val: float = 0.0,
    ) -> None:
        """Faza 2: liczone TYLKO gdy match_active and not in_replay i gracz
        ma realne pole Boost (spectator). Bez tych warunkow caller nie wola tej
        metody — dzieki temu bez spectatora avg_boost/supersonic/time@100 = null."""
        if not player_name:
            return
        p = self._ensure(player_name)
        p["team_num"] = int(team_num or 0)
        b = int(boost or 0)
        # Boost samples / time at 100.
        p["boost_sum"] += b
        p["boost_samples"] += 1
        if b >= 100:
            p["time_at_100_seconds"] += dt
        # Supersonic.
        if is_supersonic:
            p["supersonic_seconds"] += dt
        # Pady — heurystyka grantow.
        prev = p.get("prev_boost")
        if prev is not None:
            delta = b - int(prev)
            grant = False
            if 32 <= delta <= 34:
                grant = True  # respawn
            elif last_goal_at_val and (now - last_goal_at_val) <= 3.0:
                grant = True  # post-goal
            elif last_kickoff_at_val and (now - last_kickoff_at_val) <= 2.0:
                grant = True  # kickoff
            elif ot_started_at_val and (now - ot_started_at_val) <= 2.0:
                grant = True  # start OT
            if not grant and delta > 0:
                p["pad_pickups"] += 1
        p["prev_boost"] = b

    def _rank_side(self, team_num: int) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for name, data in self.players.items():
            if int(data.get("team_num", 0) or 0) != team_num:
                continue
            row = dict(data)
            row["player_name"] = name
            rows.append(row)
        rows.sort(key=lambda r: (
            -int(r.get("score", 0) or 0),
            -int(r.get("goals", 0) or 0),
            -int(r.get("assists", 0) or 0),
            -int(r.get("saves", 0) or 0),
            -int(r.get("shots", 0) or 0),
            -int(r.get("demos", 0) or 0),
            str(r.get("player_name") or ""),
        ))
        for i, r in enumerate(rows, start=1):
            r["rank"] = i
        return rows

    @staticmethod
    def _player_payload(row: Dict[str, Any]) -> Dict[str, Any]:
        samples = int(row.get("boost_samples", 0) or 0)
        boost_seen = samples > 0
        if boost_seen:
            avg_boost = round(float(row.get("boost_sum", 0.0) or 0.0) / samples, 1)
            supersonic_seconds: Optional[float] = round(
                float(row.get("supersonic_seconds", 0.0) or 0.0), 1
            )
            time_at_100 = round(float(row.get("time_at_100_seconds", 0.0) or 0.0), 1)
            pad_pickups: Optional[int] = int(row.get("pad_pickups", 0) or 0)
        else:
            avg_boost = None
            supersonic_seconds = None
            time_at_100 = None
            pad_pickups = None
        return {
            "player_name": str(row.get("player_name") or ""),
            "team_num": int(row.get("team_num", 0) or 0),
            "rank": int(row.get("rank", 0) or 0),
            "score": int(row.get("score", 0) or 0),
            "goals": int(row.get("goals", 0) or 0),
            "assists": int(row.get("assists", 0) or 0),
            "saves": int(row.get("saves", 0) or 0),
            "shots": int(row.get("shots", 0) or 0),
            "demos": int(row.get("demos", 0) or 0),
            "pad_pickups": pad_pickups,
            "supersonic_seconds": supersonic_seconds,
            "avg_boost": avg_boost,
            "time_at_100_seconds": time_at_100,
        }

    def finalize(
        self,
        blue_score_val: int,
        orange_score_val: int,
        team_names: Dict[str, str],
        match_guid: Optional[str],
    ) -> Dict[str, Any]:
        blue_ranked = self._rank_side(0)
        orange_ranked = self._rank_side(1)
        n_blue, n_orange = len(blue_ranked), len(orange_ranked)
        if n_blue != n_orange:
            print(
                f"[POSTGAME] WARN: asymetria skladow blue={n_blue} orange={n_orange} "
                f"-> pary tylko do min()."
            )
        pair_count = min(n_blue, n_orange)
        pairs: List[Dict[str, Any]] = []
        for k in range(pair_count):
            pairs.append({
                "rank": k + 1,
                "blue": self._player_payload(blue_ranked[k]),
                "orange": self._player_payload(orange_ranked[k]),
            })
        team_blue_saves = sum(int(p["blue"]["saves"] or 0) for p in pairs)
        team_blue_demos = sum(int(p["blue"]["demos"] or 0) for p in pairs)
        team_orange_saves = sum(int(p["orange"]["saves"] or 0) for p in pairs)
        team_orange_demos = sum(int(p["orange"]["demos"] or 0) for p in pairs)

        def _team_pads(side: str) -> int:
            return sum(int(p[side].get("pad_pickups") or 0) for p in pairs)

        def _team_avg_boost(side: str) -> Optional[float]:
            vals = [p[side].get("avg_boost") for p in pairs
                    if p[side].get("avg_boost") is not None]
            if not vals:
                return None
            return round(sum(float(v) for v in vals) / len(vals), 1)

        team_blue_pads = _team_pads("blue")
        team_orange_pads = _team_pads("orange")
        team_blue_avg = _team_avg_boost("blue")
        team_orange_avg = _team_avg_boost("orange")
        kg_blue = int(self.team_kickoff_goals.get(0, 0) or 0)
        kg_orange = int(self.team_kickoff_goals.get(1, 0) or 0)

        return {
            "phase": 2,
            "match_guid": match_guid,
            "finalized_at": _now_iso(),
            "blue_score": int(blue_score_val),
            "orange_score": int(orange_score_val),
            "team_names": {
                "blue": str(team_names.get("blue") or "Blue"),
                "orange": str(team_names.get("orange") or "Orange"),
            },
            "team": {
                "blue": {
                    "kickoff_goals_10s": kg_blue,
                    "saves": team_blue_saves,
                    "demos": team_blue_demos,
                    "avg_boost": team_blue_avg,
                    "pad_pickups": team_blue_pads,
                },
                "orange": {
                    "kickoff_goals_10s": kg_orange,
                    "saves": team_orange_saves,
                    "demos": team_orange_demos,
                    "avg_boost": team_orange_avg,
                    "pad_pickups": team_orange_pads,
                },
            },
            "pairs": pairs,
        }


# === ZAPISY DO DB ===
# UWAGA: te funkcje wywoluje TYLKO db_worker_loop, nigdy watek TCP.

def _db_err(where: str, e: Exception) -> None:
    stats["db_errors"] += 1
    stats["db_errors_delta"] += 1
    print(f"[ERR] {where}: {e}")


def db_upsert_match(payload: Dict[str, Any]) -> None:
    try:
        sb.table("match_metadata").upsert(payload, on_conflict="id").execute()
        stats["match_writes"] += 1
        stats["match_writes_delta"] += 1
    except Exception as e:
        _db_err("match_metadata upsert", e)


def db_emit_match_event(event_name: str, winner_team_num: Optional[int]) -> None:
    """Zapis kanalu zdarzen do match_metadata (singleton id=1). Wolane synchroniczne
    bezposrednio z handle_event — to rzadkie one-shoty (MatchEnded / MatchDestroyed),
    wiec nie potrzebujemy workera. Zawsze inkrementujemy local_event_seq, dzieki
    czemu front widzi zmiane nawet przy powtorzonym evencie."""
    global local_event_seq
    local_event_seq += 1
    payload = {
        "id": 1,
        "last_event": event_name,
        "last_event_seq": int(local_event_seq),
        "last_winner_team_num": winner_team_num,
        "last_event_at": _now_iso(),
    }
    try:
        sb.table("match_metadata").upsert(payload, on_conflict="id").execute()
        print(f"[EVENT] {event_name} winner={winner_team_num} seq={local_event_seq}")
    except Exception as e:
        _db_err(f"match_metadata event {event_name}", e)


def db_upsert_players(rows: List[Dict[str, Any]]) -> None:
    if not rows:
        return
    try:
        sb.table("players_live").upsert(rows, on_conflict="player_name").execute()
        stats["player_writes"] += len(rows)
        stats["player_writes_delta"] += len(rows)
    except Exception as e:
        _db_err("players_live upsert", e)


def db_upsert_camera(target: Optional[str]) -> None:
    try:
        sb.table("active_camera").upsert(
            {"id": 1, "target_name": target}, on_conflict="id"
        ).execute()
        stats["camera_writes"] += 1
        stats["camera_writes_delta"] += 1
    except Exception as e:
        _db_err("active_camera upsert", e)


def db_prune_players(current_names: List[str]) -> None:
    """Kasuje z players_live wpisy, ktorych nie ma w aktualnym snapie. Wykonywane
    rzadko (PRUNE_INTERVAL_S) i tylko z workera DB."""
    try:
        existing = sb.table("players_live").select("player_name").execute()
        rows = getattr(existing, "data", None) or []
        current_set = set(current_names)
        stale = [r["player_name"] for r in rows if r.get("player_name") not in current_set]
        if not stale:
            return
        try:
            sb.table("players_live").delete().in_("player_name", stale).execute()
            print(f"[PRUNE] usunieto stare wpisy ({len(stale)})")
        except Exception:
            # Fallback jesli wersja klienta nie ma .in_ na delete
            for name in stale:
                try:
                    sb.table("players_live").delete().eq("player_name", name).execute()
                except Exception as e:
                    _db_err(f"players_live prune ({name})", e)
    except Exception as e:
        _db_err("players_live prune", e)


def db_clear_all_players() -> None:
    try:
        existing = sb.table("players_live").select("player_name").execute()
        rows = getattr(existing, "data", None) or []
        names = [r.get("player_name") for r in rows if r.get("player_name")]
        if not names:
            return
        try:
            sb.table("players_live").delete().in_("player_name", names).execute()
        except Exception:
            for name in names:
                try:
                    sb.table("players_live").delete().eq("player_name", name).execute()
                except Exception as e:
                    _db_err(f"players_live clear ({name})", e)
        print(f"[RESET] wyczyszczono players_live ({len(names)} wpisow)")
    except Exception as e:
        _db_err("players_live clear", e)


# === HANDLERY EVENTOW ===
def _maybe_decode_json(value: Any, max_depth: int = 5) -> Any:
    """Rozpakowuje wartosci, ktore RL Stats API potrafi przyslac jako string/bytes
    z zakodowanym JSON-em w srodku (czasem nawet wielokrotnie). Zwraca wartosc
    natywna, jesli mozliwe; w przeciwnym wypadku oryginal."""
    cur = value
    for _ in range(max_depth):
        if isinstance(cur, (bytes, bytearray)):
            try:
                cur = cur.decode("utf-8", errors="replace")
            except Exception:
                return cur
        if isinstance(cur, str):
            s = cur.strip()
            if not s or s[0] not in "{[\\"":
                return cur
            try:
                cur = json.loads(s)
            except Exception:
                return cur
            continue
        return cur
    return cur


def _coerce_dict(v: Any) -> Dict[str, Any]:
    v = _maybe_decode_json(v)
    return v if isinstance(v, dict) else {}


def _coerce_list(v: Any) -> List[Any]:
    v = _maybe_decode_json(v)
    return v if isinstance(v, list) else []


_dbg_printed = 0


def _reset_for_new_match(guid: Optional[str]) -> None:
    """Pelny reset stanu per-mecz. Wolane z MatchCreated/MatchInitialized oraz
    z handle_update_state gdy GUID zmieni sie bez explicit eventu. Caller musi
    juz trzymac state_lock."""
    global current_match_guid, blue_score, orange_score, local_time_seconds
    global is_overtime, in_replay, clock_running, match_active
    global clear_requested, dirty_match, current_accum, postgame_finalized
    global last_kickoff_at, last_goal_at, prev_overtime, ot_started_at
    if guid:
        current_match_guid = guid
    blue_score = 0
    orange_score = 0
    local_time_seconds = 300.0
    is_overtime = False
    in_replay = False
    clock_running = False
    stats["mode"] = "live"
    # Nowy mecz / replay -> zlec workerowi DB wyczyszczenie players_live.
    players_snapshot.clear()
    last_pushed_players.clear()
    if SUPABASE_LIVE_WRITES:
        clear_requested = True
    match_active = True
    if SUPABASE_LIVE_WRITES:
        dirty_match = True
    # Postgame Faza 2: nowy akumulator, NIE czyscimy last_postgame
    # (operator widzi poprzedni mecz az do nowej finalizacji).
    current_accum = MatchStatsAccumulator()
    postgame_finalized = False
    last_kickoff_at = time.time()
    last_goal_at = 0.0
    prev_overtime = False
    ot_started_at = 0.0


def handle_update_state(data: Dict[str, Any]) -> None:
    global current_match_guid, local_time_seconds, is_overtime
    global blue_score, orange_score, in_replay, last_state_update_at
    global pending_camera, dirty_match, dirty_camera
    global prev_overtime, ot_started_at, last_tick_at
    global clock_running, clear_requested, match_active
    global current_accum, postgame_finalized
    global last_kickoff_at, last_goal_at

    last_state_update_at = time.time()
    stats["update_state_delta"] += 1

    guid = data.get("MatchGuid")
    if guid:
        # Wykryj zmiane GUID BEZ MatchCreated/MatchInitialized (np. relay polaczyl
        # sie w trakcie nowego serwera, albo gra wystartowala kolejny mecz cicho).
        # Traktujemy to jak nowy mecz: pelny reset stanu per-mecz.
        if current_match_guid is not None and guid != current_match_guid:
            print(f"[MATCH] GUID change via UpdateState: {current_match_guid} -> {guid} — reset.")
            _reset_for_new_match(guid)
        else:
            current_match_guid = guid

    game = _coerce_dict(data.get("Game"))
    teams = _coerce_list(game.get("Teams"))
    if len(teams) > 0:
        blue_score = int(_coerce_dict(teams[0]).get("Score", 0) or 0)
    if len(teams) > 1:
        orange_score = int(_coerce_dict(teams[1]).get("Score", 0) or 0)

    ts = game.get("TimeSeconds")
    if ts is not None:
        try:
            local_time_seconds = float(ts)
        except Exception:
            pass
    new_is_overtime = bool(game.get("bOvertime", False))
    in_replay = bool(game.get("bReplay", False))
    now_ts = time.time()
    if new_is_overtime and not prev_overtime:
        ot_started_at = now_ts
    prev_overtime = new_is_overtime
    is_overtime = new_is_overtime

    if SUPABASE_LIVE_WRITES:
        dirty_match = True

    # Kamera aktywna -> zapisz w stanie, worker DB sflushuje
    if game.get("bHasTarget"):
        pending_camera = _coerce_dict(game.get("Target")).get("Name") or None
    else:
        pending_camera = None
    if SUPABASE_LIVE_WRITES:
        dirty_camera = True

    # Gracze -> tylko aktualizacja snapshotu w pamieci
    players = _coerce_list(data.get("Players"))
    stats["players_seen"] = len(players)
    new_snap: Dict[str, Dict[str, Any]] = {}
    for raw in players:
        p = _coerce_dict(raw)
        if not p:
            continue
        name = p.get("Name")
        if not name:
            continue
        new_snap[name] = {
            "player_name": name,
            "team_num": int(p.get("TeamNum", 0) or 0),
            "boost": int(p.get("Boost", 0) or 0),          # SPECTATOR-only
            "speed": float(p.get("Speed", 0) or 0),         # SPECTATOR-only
            "goals": int(p.get("Goals", 0) or 0),
            "assists": int(p.get("Assists", 0) or 0),
            "saves": int(p.get("Saves", 0) or 0),
            "shots": int(p.get("Shots", 0) or 0),
            "demos": int(p.get("Demos", 0) or 0),
            "score": int(p.get("Score", 0) or 0),           # Postgame ranking
            "is_demolished": bool(p.get("bDemolished", False)),
            "is_supersonic": bool(p.get("bSupersonic", False)),
            "_has_boost": ("Boost" in p),                   # SPECTATOR only
        }
    if new_snap:
        players_snapshot.clear()
        players_snapshot.update(new_snap)
        # Per-gracz change-detection (tylko do metryki HB; faktyczna decyzja
        # o flushu zapada w db_workerze, ktory porownuje snapshot z
        # last_pushed_players i robi BATCH upsert wszystkich zmienionych).
        for name, row in new_snap.items():
            if last_pushed_players.get(name) != row:
                stats["player_changes_delta"] += 1
        # Postgame accumulator (Faza 2): kopiuje wartosci API + heurystyki
        # czasowe (pady/boost/supersonic). dt clamp do 0.5 s aby pauzy/lagi
        # nie zawyzaly time_at_100/supersonic.
        global current_accum
        if current_accum is None:
            current_accum = MatchStatsAccumulator()
        if last_tick_at > 0:
            dt = min(max(now_ts - last_tick_at, 0.0), 0.5)
        else:
            dt = 1.0 / 120.0
        # Prune prev_boost dla graczy ktorzy zniknęli ze snapu (np. po MatchCreated).
        snap_names = set(new_snap.keys())
        for known in list(current_accum.players.keys()):
            if known not in snap_names:
                current_accum.reset_prev_boost(known)
        for row in new_snap.values():
            # Faza 1: pola API.
            current_accum.on_player_row(row)
            # Faza 2: boost/supersonic/pady — tylko jesli gracz ma realne
            # pole Boost (spectator) i mecz jest aktywny poza replayem.
            if row.get("_has_boost"):
                pname = row.get("player_name") or ""
                if match_active and not in_replay:
                    current_accum.on_boost_tick(
                        player_name=pname,
                        team_num=int(row.get("team_num", 0) or 0),
                        boost=int(row.get("boost", 0) or 0),
                        is_supersonic=bool(row.get("is_supersonic", False)),
                        dt=dt,
                        now=now_ts,
                        last_goal_at_val=last_goal_at,
                        last_kickoff_at_val=last_kickoff_at,
                        ot_started_at_val=ot_started_at,
                    )
                else:
                    # Poza aktywnym meczem / w replayu: tylko baseline.
                    current_accum.set_baseline_boost(pname, int(row.get("boost", 0) or 0))
        last_tick_at = now_ts
        # WS broadcast: pelna ramka v3 (match + players + camera + series + teams).
        _maybe_broadcast_ws(force=False)


def _build_frame_v3() -> str:
    """Buduje pelna ramke v3. Wolane pod state_lock."""
    now_iso = _now_iso()
    match_obj = {
        "id": 1,
        "match_guid": current_match_guid,
        "timer": fmt_timer(local_time_seconds),
        "time_seconds": int(round(max(0, local_time_seconds))),
        "blue_score": int(blue_score),
        "orange_score": int(orange_score),
        "is_overtime": bool(is_overtime),
        "is_active": bool(match_active),
        "updated_at": now_iso,
    }
    players_arr: List[Dict[str, Any]] = []
    for name, row in players_snapshot.items():
        players_arr.append({
            "player_name": name,
            "team_num": int(row.get("team_num", 0) or 0),
            "boost": int(row.get("boost", 0) or 0),
            "speed": float(row.get("speed", 0) or 0),
            "goals": int(row.get("goals", 0) or 0),
            "assists": int(row.get("assists", 0) or 0),
            "saves": int(row.get("saves", 0) or 0),
            "shots": int(row.get("shots", 0) or 0),
            "demos": int(row.get("demos", 0) or 0),
            "is_demolished": bool(row.get("is_demolished", False)),
            "is_supersonic": bool(row.get("is_supersonic", False)),
            "mmr": None,
            "updated_at": now_iso,
        })
    camera_obj = {"target_name": pending_camera} if pending_camera else None
    with override_lock:
        series_obj = dict(override_series)
        teams_obj = dict(override_teams)
    frame: Dict[str, Any] = {
        "v": 3,
        "t": time.time(),
        "match": match_obj,
        "players": players_arr,
        "camera": camera_obj,
        "series": series_obj,
        "teams": teams_obj,
    }
    if last_postgame is not None:
        frame["postgame"] = last_postgame
    return json.dumps(frame)


def _maybe_broadcast_ws(force: bool = False) -> None:
    """Wysyla pelna ramke v3 na wszystkich klientow WS. force=True ignoruje throttle.
    UWAGA: musi byc wolane pod state_lock (czyta snapshot + match state)."""
    global last_ws_send_ts
    if not ws_enabled or ws_loop is None or not ws_clients:
        return
    now = time.time()
    if not force and (now - last_ws_send_ts) < WS_BROADCAST_MIN_INTERVAL_S:
        return
    last_ws_send_ts = now
    msg = _build_frame_v3()
    clients = list(ws_clients)
    loop = ws_loop
    for ws in clients:
        try:
            asyncio.run_coroutine_threadsafe(ws.send(msg), loop)
        except Exception:
            pass
    stats["ws_sends_delta"] += 1
    stats["ws_full_frames_delta"] += 1


def handle_clock_updated(data: Dict[str, Any]) -> None:
    global local_time_seconds, is_overtime, last_state_update_at, dirty_match
    last_state_update_at = time.time()
    ts = data.get("TimeSeconds")
    if ts is not None:
        try:
            local_time_seconds = float(ts)
        except Exception:
            return
    is_overtime = bool(data.get("bOvertime", is_overtime))
    if SUPABASE_LIVE_WRITES:
        dirty_match = True


def handle_event(evt: Dict[str, Any]) -> None:
    global current_match_guid, clock_running, in_replay, _dbg_printed
    global current_accum, last_postgame, postgame_finalized
    global blue_score, orange_score, local_time_seconds, is_overtime
    global dirty_match, clear_requested, match_active
    global last_kickoff_at, last_goal_at, prev_overtime, ot_started_at

    name = evt.get("Event") or evt.get("event") or ""
    raw_data = evt.get("Data")
    if raw_data is None:
        raw_data = evt.get("data")
    data = _coerce_dict(raw_data)

    if _dbg_printed < 3:
        _dbg_printed += 1
        print(f"[DBG] event='{name}' data_type={type(raw_data).__name__} keys={list(data.keys())[:8]}")

    if name == "UpdateState":
        handle_update_state(data)
        return

    if name == "ClockUpdatedSeconds":
        handle_clock_updated(data)
        return

    if name == "GoalScored":
        scorer_dict = _coerce_dict(data.get("Scorer"))
        scorer = scorer_dict.get("Name", "?")
        now = time.time()
        last_goal_at = now
        scorer_team = -1
        try:
            scorer_team = int(scorer_dict.get("TeamNum", -1))
        except Exception:
            scorer_team = -1
        if (current_accum is not None
                and scorer_team in (0, 1)
                and last_kickoff_at > 0
                and (now - last_kickoff_at) <= 10.0):
            current_accum.team_kickoff_goals[scorer_team] = \
                current_accum.team_kickoff_goals.get(scorer_team, 0) + 1
            print(
                f"[POSTGAME] kickoff goal team={scorer_team} "
                f"dt={now - last_kickoff_at:.2f}s scorer={scorer}"
            )
        else:
            print(f"[GOAL] {scorer}")
        return

    if name == "GoalReplayStart":
        in_replay = True
        clock_running = False
        return

    if name in ("GoalReplayEnd", "GoalReplayWillEnd"):
        in_replay = False
        clock_running = True
        last_kickoff_at = time.time()
        return

    if name == "RoundStarted":
        clock_running = True
        last_kickoff_at = time.time()
        return

    if name == "CountdownBegin":
        clock_running = False
        return

    if name in ("MatchCreated", "MatchInitialized"):
        guid = data.get("MatchGuid")
        _reset_for_new_match(guid)
        return

    if name in ("MatchEnded", "MatchDestroyed", "PodiumStart"):
        clock_running = False
        if name == "PodiumStart":
            stats["mode"] = "podium"
        if name in ("MatchEnded", "MatchDestroyed"):
            match_active = False
            if SUPABASE_LIVE_WRITES:
                dirty_match = True
        # Event channel — niezalezne od SUPABASE_LIVE_WRITES. Front uzywa
        # tego do auto-inkrementacji wyniku serii BO oraz resetu po wyjsciu
        # z serwera. WinnerTeamNum: 0 = blue, 1 = orange, None = brak / remis.
        if name == "MatchEnded":
            w_raw = data.get("WinnerTeamNum")
            try:
                winner_num = int(w_raw) if w_raw is not None else None
                if winner_num not in (0, 1):
                    winner_num = None
            except Exception:
                winner_num = None
            db_emit_match_event("MatchEnded", winner_num)
        elif name == "MatchDestroyed":
            db_emit_match_event("MatchDestroyed", None)
        # Postgame Faza 1: finalize raz na mecz (MatchEnded lub PodiumStart
        # jako fallback). MatchDestroyed nie finalizuje — zostawia poprzedni
        # last_postgame nietkniety.
        if name in ("MatchEnded", "PodiumStart") and not postgame_finalized and current_accum is not None:
            with override_lock:
                team_names = {
                    "blue": override_teams.get("blue_name") or "Blue",
                    "orange": override_teams.get("orange_name") or "Orange",
                }
            try:
                last_postgame = current_accum.finalize(
                    blue_score, orange_score, team_names, current_match_guid,
                )
                postgame_finalized = True
                print(
                    f"[POSTGAME] finalize: {last_postgame['blue_score']}-"
                    f"{last_postgame['orange_score']} pairs={len(last_postgame['pairs'])} "
                    f"trigger={name}"
                )
                _maybe_broadcast_ws(force=True)
            except Exception as e:
                print(f"[POSTGAME] finalize ERROR: {e}")
        return

    if name == "MatchPaused":
        clock_running = False
        return

    if name == "MatchUnpaused":
        clock_running = True
        return

    if name == "ReplayCreated":
        stats["mode"] = "replay"
        print("[INFO] Wykryto replay z Match History.")
        return

    # BallHit, CrossbarHit, StatfeedEvent — ignorujemy na razie


# === LOKALNY ZEGAR ===
def clock_loop() -> None:
    global local_time_seconds, clock_running, dirty_match
    while True:
        time.sleep(LOCAL_TICK_S)
        with state_lock:
            if not clock_running or in_replay:
                continue
            if is_overtime:
                local_time_seconds += LOCAL_TICK_S
            else:
                local_time_seconds = max(0.0, local_time_seconds - LOCAL_TICK_S)
            # v3: gdy live_writes=off, NIE flippujemy dirty_match co 0.1 s —
            # i tak nic z tego nie poleci do DB. Zegar w WS budowany jest
            # ad-hoc z aktualnego local_time_seconds.
            if SUPABASE_LIVE_WRITES:
                dirty_match = True


# === WORKER DB (jedyne miejsce z I/O do Supabase) ===
def db_worker_loop() -> None:
    global dirty_match, dirty_camera, clear_requested
    global pending_camera, last_pushed_camera
    last_prune = 0.0
    # Okno sekundowe na cap MAX_PLAYER_ROWS_PER_S.
    cap_window_start = time.time()
    cap_window_rows = 0
    while True:
        time.sleep(WRITE_INTERVAL_S)

        if not SUPABASE_LIVE_WRITES:
            # v3 default: zero zapisow. Czyscimy flagi, zeby nie kumulowaly sie
            # bez celu (w razie gdyby user przelaczyl flag w trakcie).
            with state_lock:
                dirty_match = False
                dirty_camera = False
                clear_requested = False
            continue

        # Sekcja krytyczna: tylko zrzut stanu + wyczyszczenie flag.
        with state_lock:
            do_clear = clear_requested
            clear_requested = False

            send_match = dirty_match
            dirty_match = False
            match_payload = {
                "id": 1,
                "blue_score": int(blue_score),
                "orange_score": int(orange_score),
                "time_seconds": int(round(max(0, local_time_seconds))),
                "timer": fmt_timer(local_time_seconds),
                "is_overtime": bool(is_overtime),
                "match_guid": current_match_guid,
                "is_active": bool(match_active),
            } if send_match else None

            send_camera = dirty_camera
            dirty_camera = False
            cam_target = pending_camera

            # Batch: kopia snapshotu pod lockiem, decyzja o flushu poza lockiem.
            snap_copy: Dict[str, Dict[str, Any]] = {n: dict(r) for n, r in players_snapshot.items()}
            current_names = list(players_snapshot.keys())

        # Poza lockiem: wszystkie HTTP-y do Supabase.
        if do_clear:
            db_clear_all_players()
            last_pushed_players.clear()

        if match_payload is not None:
            db_upsert_match(match_payload)

        if send_camera and cam_target != last_pushed_camera:
            db_upsert_camera(cam_target)
            last_pushed_camera = cam_target

        # Batch flush wszystkich graczy ze zmienionym wierszem.
        rows_to_push: List[Dict[str, Any]] = []
        for name, row in snap_copy.items():
            if last_pushed_players.get(name) != row:
                rows_to_push.append(row)

        if rows_to_push:
            now_ts = time.time()
            if now_ts - cap_window_start >= 1.0:
                cap_window_start = now_ts
                cap_window_rows = 0
            allowed = max(0, MAX_PLAYER_ROWS_PER_S - cap_window_rows)
            if allowed <= 0:
                stats["player_writes_skipped_delta"] += len(rows_to_push)
            else:
                if len(rows_to_push) > allowed:
                    stats["player_writes_skipped_delta"] += len(rows_to_push) - allowed
                    rows_to_push = rows_to_push[:allowed]
                db_upsert_players(rows_to_push)
                cap_window_rows += len(rows_to_push)
                stats["flushes_delta"] += 1
                for row in rows_to_push:
                    last_pushed_players[row["player_name"]] = dict(row)

        # Sprzatanie zalegych wpisow — rzadko.
        now = time.time()
        if current_names and (now - last_prune) >= PRUNE_INTERVAL_S:
            last_prune = now
            db_prune_players(current_names)


# === HEARTBEAT ===
def heartbeat_loop() -> None:
    while True:
        time.sleep(HEARTBEAT_S)
        # Broadcast RELAY_PING do Supabase Realtime — odbiera <RelayStatus />
        # w aplikacji (kanal rl_broadcast_room). Pozwala dashboardowi pokazac
        # ze relay zyje, nawet gdy nie ma jeszcze danych z RL.
        try:
            requests.post(
                f"{SUPABASE_URL}/realtime/v1/api/broadcast",
                headers={
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                },
                json={
                    "messages": [{
                        "topic": "rl_broadcast_room",
                        "event": "RELAY_PING",
                        "payload": {"timestamp": int(time.time() * 1000)},
                        "private": False,
                    }]
                },
                timeout=2.0,
            )
        except Exception as _ping_err:
            # nie blokujemy heartbeatu, jak nie ma sieci to overlay sam zczerwienieje
            pass
        with state_lock:
            mode = stats["mode"]
            no_data_for = (time.time() - last_event_at) if last_event_at else None
            warn = ""
            if last_event_at == 0 or (no_data_for is not None and no_data_for > NO_DATA_WARN_S):
                warn = " | [WARN] brak danych z RL — sprawdz DefaultStatsAPI.ini i restart RL"
            live_writes = "on" if SUPABASE_LIVE_WRITES else "off"
            http_ok = "ok" if http_clients_ok else "err"
            postgame_available = last_postgame is not None
            postgame_phase_val = (
                int(last_postgame.get("phase", 0) or 0) if postgame_available else 0
            )
            postgame_phase_str = str(postgame_phase_val) if postgame_available else "-"
            last_guid_str = (last_postgame.get("match_guid") or "-") if last_postgame else "-"
            last_guid_short = str(last_guid_str)[:8] if last_guid_str else "-"
            print(
                f"[HB] mode={mode} "
                f"live_writes={live_writes} http={http_ok} "
                f"events=+{stats['events_delta']} (total {stats['events']}) "
                f"| upstream: UpdateState/s={stats['update_state_delta'] / HEARTBEAT_S:.1f} "
                f"changes/s={stats['player_changes_delta'] / HEARTBEAT_S:.1f} "
                f"| players_seen={stats['players_seen']} "
                f"| DB: match=+{stats['match_writes_delta']} "
                f"player_rows/s={stats['player_writes_delta'] / HEARTBEAT_S:.1f} "
                f"flushes/s={stats['flushes_delta'] / HEARTBEAT_S:.1f} "
                f"skipped/s={stats['player_writes_skipped_delta'] / HEARTBEAT_S:.1f} "
                f"camera=+{stats['camera_writes_delta']} "
                f"errors=+{stats['db_errors_delta']}"
                f" | WS: clients={len(ws_clients)} "
                f"full_frames/s={stats['ws_full_frames_delta'] / HEARTBEAT_S:.1f} "
                f"| HTTP: req=+{stats['http_requests_delta']}"
                f" | postgame_available={postgame_available} "
                f"postgame_phase={postgame_phase_str} last_guid={last_guid_short}"
                f"{warn}"
            )
            stats["events_delta"] = 0
            stats["match_writes_delta"] = 0
            stats["player_writes_delta"] = 0
            stats["camera_writes_delta"] = 0
            stats["db_errors_delta"] = 0
            stats["update_state_delta"] = 0
            stats["player_changes_delta"] = 0
            stats["flushes_delta"] = 0
            stats["player_writes_skipped_delta"] = 0
            stats["ws_sends_delta"] = 0
            stats["ws_full_frames_delta"] = 0
            stats["http_requests_delta"] = 0


# === LOKALNY SERWER WEBSOCKET (v2.4) ===
def ws_server_loop() -> None:
    """Daemon thread: wystawia ws://127.0.0.1:49300 i utrzymuje set klientow.
    Broadcast wykonywany jest z watku TCP przez asyncio.run_coroutine_threadsafe."""
    global ws_loop, ws_enabled
    try:
        import websockets  # type: ignore
    except Exception as e:
        print(
            "[WS] Pakiet 'websockets' niedostepny — boost local feed wylaczony.\\n"
            "     Zainstaluj: pip install websockets\\n"
            f"     Szczegol: {e}"
        )
        return

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def handler(ws, *_args, **_kwargs):
        ws_clients.add(ws)
        peer = getattr(ws, "remote_address", None)
        print(f"[WS] Klient podlaczony {peer} (total={len(ws_clients)})")
        try:
            await ws.wait_closed()
        except Exception:
            pass
        finally:
            ws_clients.discard(ws)
            print(f"[WS] Klient rozlaczony {peer} (total={len(ws_clients)})")

    async def _start():
        return await websockets.serve(handler, WS_HOST, WS_PORT, ping_interval=20)

    try:
        loop.run_until_complete(_start())
    except OSError as e:
        print(f"[WS] Nie udalo sie otworzyc ws://{WS_HOST}:{WS_PORT}: {e}")
        return
    except Exception as e:
        print(f"[WS] Blad startu serwera WS: {e}")
        return

    ws_loop = loop
    ws_enabled = True
    print(f"[WS] Lokalny boost feed dziala na ws://{WS_HOST}:{WS_PORT} (tylko localhost).")
    try:
        loop.run_forever()
    except Exception as e:
        print(f"[WS] Loop crash: {e}")


# === KEEPALIVE WS (v3) ===
# Wysyla pelna ramke co WS_FULL_FRAME_MIN_INTERVAL_S nawet gdy RL nie pcha
# UpdateState (menu / miedzy rundami / waiting screen). Overlay musi widziec
# aktualny series/teams/match_active.
def ws_keepalive_loop() -> None:
    while True:
        time.sleep(WS_FULL_FRAME_MIN_INTERVAL_S)
        if not ws_enabled or not ws_clients:
            continue
        with state_lock:
            _maybe_broadcast_ws(force=False)


# === LOKALNY HTTP CONTROL PLANE (v3) ===
# Dashboard / src/lib/relay-http.ts wysyla tu:
#   POST /series  {type, blue, orange, blue_name?, orange_name?}
#   POST /teams   {blue_name, orange_name}
class _OverrideHandler(BaseHTTPRequestHandler):
    def _set_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _ok(self, payload: Optional[Dict[str, Any]] = None) -> None:
        body = json.dumps(payload or {"ok": True}).encode("utf-8")
        self.send_response(200)
        self._set_cors()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> Dict[str, Any]:
        try:
            ln = int(self.headers.get("Content-Length", "0") or "0")
            if ln <= 0:
                return {}
            raw = self.rfile.read(ln)
            data = json.loads(raw.decode("utf-8", errors="replace"))
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):  # noqa: N802
        global http_clients_ok
        stats["http_requests_delta"] += 1
        try:
            if self.path == "/postgame":
                with state_lock:
                    pg = last_postgame
                if pg is None:
                    body_obj: Dict[str, Any] = {"available": False, "phase": 2}
                else:
                    body_obj = pg
                body = json.dumps(body_obj).encode("utf-8")
                self.send_response(200)
                self._set_cors()
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                http_clients_ok = True
                return
            self.send_response(404)
            self._set_cors()
            self.end_headers()
        except Exception as e:
            http_clients_ok = False
            print(f"[HTTP] Blad obslugi GET {self.path}: {e}")
            try:
                self.send_response(500)
                self._set_cors()
                self.end_headers()
            except Exception:
                pass

    def do_POST(self):  # noqa: N802
        global http_clients_ok
        stats["http_requests_delta"] += 1
        body = self._read_json()
        try:
            if self.path == "/series":
                with override_lock:
                    override_series["type"] = str(body.get("type", override_series.get("type", "bo3")) or "bo3")
                    override_series["blue"] = int(body.get("blue", 0) or 0)
                    override_series["orange"] = int(body.get("orange", 0) or 0)
                    bn = body.get("blue_name")
                    on = body.get("orange_name")
                    if bn is not None and str(bn) != "":
                        override_series["blue_name"] = str(bn)
                    if on is not None and str(on) != "":
                        override_series["orange_name"] = str(on)
                http_clients_ok = True
                self._ok({"ok": True, "series": override_series})
                return
            if self.path == "/teams":
                with override_lock:
                    override_teams["blue_name"] = str(body.get("blue_name", "") or "")
                    override_teams["orange_name"] = str(body.get("orange_name", "") or "")
                    # Propaguj do serii, jesli pusto.
                    if not override_series.get("blue_name"):
                        override_series["blue_name"] = override_teams["blue_name"]
                    if not override_series.get("orange_name"):
                        override_series["orange_name"] = override_teams["orange_name"]
                http_clients_ok = True
                self._ok({"ok": True, "teams": override_teams})
                return
            self.send_response(404)
            self._set_cors()
            self.end_headers()
        except Exception as e:
            http_clients_ok = False
            print(f"[HTTP] Blad obslugi {self.path}: {e}")
            self.send_response(500)
            self._set_cors()
            self.end_headers()

    def log_message(self, format, *args):  # noqa: A002
        return  # cisza w terminalu — HB pokazuje licznik


def http_server_loop() -> None:
    global http_clients_ok
    try:
        srv = ThreadingHTTPServer((HTTP_HOST, HTTP_PORT), _OverrideHandler)
    except OSError as e:
        print(f"[HTTP] Nie udalo sie zbindowac http://{HTTP_HOST}:{HTTP_PORT}: {e}")
        http_clients_ok = False
        return
    print(
        f"[HTTP] Control plane na http://{HTTP_HOST}:{HTTP_PORT} "
        f"(POST /series, /teams, GET /postgame)."
    )
    try:
        srv.serve_forever()
    except Exception as e:
        print(f"[HTTP] serve_forever crash: {e}")
        http_clients_ok = False


# === RAW DEBUG: surowy dump boost/speed graczy ===
# Drukuje co 1 s wartosci boost wszystkich graczy WPROST ze snapshotu, omijajac
# change-detection. Pozwala zobaczyc, czy RL Stats API faktycznie zwraca rozne
# wartosci, czy tez bombarduje nas tym samym snapshotem 120 razy/s.
RAW_DEBUG_INTERVAL_S = 1.0

def raw_debug_loop() -> None:
    while True:
        time.sleep(RAW_DEBUG_INTERVAL_S)
        with state_lock:
            if not players_snapshot:
                continue
            parts = []
            for name, row in players_snapshot.items():
                short = name[:10]
                parts.append(f"{short}:b={row.get('boost')},s={row.get('speed'):.0f}")
            line = " | ".join(parts)
        print(f"[DBG-RAW] {line}")


# === TCP STREAM (lokalny RL Stats API) ===
_decoder = json.JSONDecoder()


def _process_payload(evt: Any) -> None:
    global last_event_at
    # RL czasem wysyla JSON-e zakodowane jako string (double-encoded).
    for _ in range(3):
        if isinstance(evt, (bytes, bytearray)):
            try:
                evt = evt.decode("utf-8", errors="replace")
            except Exception:
                return
        if isinstance(evt, str):
            try:
                evt = json.loads(evt)
            except Exception:
                return
        else:
            break
    if not isinstance(evt, dict):
        return
    # Caly handler pod lockiem — handle_event tylko mutuje stan w pamieci,
    # NIGDY nie wykonuje I/O do Supabase. Lock chroni snapshot + flagi.
    try:
        with state_lock:
            stats["events"] += 1
            stats["events_delta"] += 1
            last_event_at = time.time()
            handle_event(evt)
    except Exception as e:
        print(f"[ERR] handle_event: {e}")


def _drain_buffer(buf: str) -> str:
    """Wyciaga z bufora kolejne kompletne JSON-y (raw_decode tolerujace whitespace)."""
    while True:
        s = buf.lstrip()
        if not s:
            return ""
        try:
            obj, end = _decoder.raw_decode(s)
        except json.JSONDecodeError:
            return s  # niekompletny / czesciowy obiekt — czekamy na kolejne dane
        _process_payload(obj)
        buf = s[end:]


def tcp_loop() -> None:
    print(f"[RL] Klient lokalnego TCP streamu RL Stats API ({RL_HOST}:{RL_PORT}).")
    backoff = 2.0
    BACKOFF_MAX = 30.0
    while True:
        sock: Optional[socket.socket] = None
        try:
            print(f"[RL] Laczenie z {RL_HOST}:{RL_PORT} ...")
            sock = socket.create_connection((RL_HOST, RL_PORT), timeout=5.0)
            sock.settimeout(None)
            try:
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, RECV_SO_RCVBUF)
            except Exception:
                pass
            print(f"[RL] Polaczono z RL Stats API na {RL_HOST}:{RL_PORT}.")
            backoff = 2.0  # reset po udanym polaczeniu
            buf = ""
            while True:
                chunk = sock.recv(RECV_CHUNK)
                if not chunk:
                    print("[RL] Strumien zamkniety przez gre.")
                    break
                try:
                    buf += chunk.decode("utf-8", errors="replace")
                except Exception:
                    continue
                buf = _drain_buffer(buf)
        except ConnectionRefusedError:
            print(
                "[RL] Polaczenie odrzucone. Sprawdz:\\n"
                "     - TAGame/Config/DefaultStatsAPI.ini ma PacketSendRate>0 i Port=49123\\n"
                "     - Rocket League jest uruchomiony i bylo restartowane po edycji ini\\n"
                "     - jestes w meczu / replayu (przed startem rozgrywki port moze byc nieaktywny)"
            )
        except socket.timeout:
            print("[RL] Timeout polaczenia.")
        except OSError as e:
            print(f"[RL] Blad gniazda: {e}")
        except Exception as e:
            print(f"[RL] Wyjatek: {e}")
        finally:
            if sock is not None:
                try:
                    sock.close()
                except Exception:
                    pass
        # Exponential backoff: 2s, 4s, 8s, 16s, 30s (cap). Zerowany po udanym connect.
        print(f"[RL] Reconnect za {backoff:.0f}s ...")
        time.sleep(backoff)
        backoff = min(backoff * 2.0, BACKOFF_MAX)


# === GRACEFUL SHUTDOWN ===
def _shutdown_flush() -> None:
    """Best-effort: zapisz is_active=false zanim proces zniknie."""
    global shutting_down, match_active
    if shutting_down:
        return
    shutting_down = True
    if not SUPABASE_LIVE_WRITES:
        # v3: brak zapisow live -> brak shutdown flush. Overlay i tak zauwazy
        # ze WS umilkl (1500 ms) i ukryje sie przez useOverlayVisibility.
        return
    try:
        with state_lock:
            payload = {
                "id": 1,
                "blue_score": int(blue_score),
                "orange_score": int(orange_score),
                "time_seconds": int(round(max(0, local_time_seconds))),
                "timer": fmt_timer(local_time_seconds),
                "is_overtime": bool(is_overtime),
                "match_guid": current_match_guid,
                "is_active": False,
            }
            match_active = False
        try:
            sb.table("match_metadata").upsert(payload, on_conflict="id").execute()
            print("[SHUTDOWN] Zapisano is_active=false do match_metadata.")
        except Exception as e:
            print(f"[SHUTDOWN] Nie udalo sie zapisac is_active=false: {e}")
    except Exception as e:
        print(f"[SHUTDOWN] Wyjatek przy flushu: {e}")


def _signal_handler(signum, _frame) -> None:
    print(f"[SHUTDOWN] Otrzymano sygnal {signum}, koncze prace...")
    _shutdown_flush()
    sys.exit(0)


def main() -> None:
    print("== RL Broadcast Relay V3 (Python) ==")
    print(f"   Stats API: tcp://{RL_HOST}:{RL_PORT} (lokalny JSON stream)")
    print(f"   WS feed:   ws://{WS_HOST}:{WS_PORT} (pelne ramki v3, tylko localhost)")
    print(f"   HTTP ctrl: http://{HTTP_HOST}:{HTTP_PORT} (POST /series, /teams)")
    live = "ON" if SUPABASE_LIVE_WRITES else "OFF (default v3 — overlay zywi sie WS-em)"
    print(f"   Supabase:  {SUPABASE_URL}  | live writes: {live}")
    print("   Tryby: mecz online, mecz z botami, replay z Match History.")
    print("   (Boost/speed widoczny tylko w spectatorze lub na wlasnej druzynie.)\\n")

    # Zsynchronizuj lokalny licznik zdarzen z aktualnym stanem bazy, zeby
    # restart relayu nie cofnal last_event_seq i nie wyzwolil ponownie
    # ostatniego zdarzenia w przegladarce.
    global local_event_seq
    try:
        res = sb.table("match_metadata").select("last_event_seq").eq("id", 1).maybe_single().execute()
        cur = (res.data or {}).get("last_event_seq") if res else None
        local_event_seq = int(cur or 0)
        print(f"   Event seq: start={local_event_seq}")
    except Exception as e:
        print(f"   Event seq: start=0 (nie udalo sie odczytac: {e})")

    import atexit
    atexit.register(_shutdown_flush)
    try:
        signal.signal(signal.SIGINT, _signal_handler)
        signal.signal(signal.SIGTERM, _signal_handler)
    except Exception:
        pass

    threading.Thread(target=heartbeat_loop, daemon=True).start()
    threading.Thread(target=clock_loop, daemon=True).start()
    threading.Thread(target=db_worker_loop, daemon=True).start()
    threading.Thread(target=raw_debug_loop, daemon=True).start()
    threading.Thread(target=ws_server_loop, daemon=True).start()
    threading.Thread(target=ws_keepalive_loop, daemon=True).start()
    threading.Thread(target=http_server_loop, daemon=True).start()
    tcp_loop()


if __name__ == "__main__":
    main()
`;

export default function Relay() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const relayScript = getRelayScript();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(relayScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([relayScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relay.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/creator')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Gamepad2 className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Relay Script (Overlay V3)</h1>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Skopiowano!' : 'Kopiuj'}
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Pobierz relay.py
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-200">
          <strong>Nowa wersja skryptu wymagana</strong> — relay wykrywa teraz
          zmiane <code className="bg-secondary px-1 rounded">MatchGuid</code> w
          {' '}<code className="bg-secondary px-1 rounded">UpdateState</code> i resetuje stan
          per-mecz nawet bez <code className="bg-secondary px-1 rounded">MatchCreated</code>
          {' '}(naprawia brak detekcji kolejnego meczu bez F5). Dodatkowo: exponential backoff
          przy reconnectcie do RL Stats API (2s→4s→…→30s) oraz propagacja
          {' '}<code className="bg-secondary px-1 rounded">MatchEnded</code>/<code className="bg-secondary px-1 rounded">MatchDestroyed</code>
          {' '}do bazy. Pobierz <code className="bg-secondary px-1 rounded">relay.py</code> ponownie i zrestartuj proces.
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel lg:col-span-1">
            <CardHeader>
              <CardTitle>Instrukcja instalacji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">1. Wymagania</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Python 3.10+</li>
                  <li>Rocket League z aktywnym Stats API (port 49123)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">2. Wlacz Stats API w grze</h3>
                <p className="text-sm text-muted-foreground">
                  Utworz lub edytuj plik <code className="bg-secondary px-1 rounded">DefaultStatsAPI.ini</code>
                  {' '}w katalogu <code className="bg-secondary px-1 rounded">TAGame/Config/</code> z trescia:
                </p>
                <pre className="bg-secondary/60 p-2 rounded text-xs">{`[TAGame.MatchStatsExporter_TA]
Port=49123
PacketSendRate=30`}</pre>
                <p className="text-sm text-muted-foreground">Zrestartuj Rocket League po zmianie.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">3. Uruchomienie relay</h3>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Pobierz plik <code className="bg-secondary px-1 rounded">relay.py</code></li>
                  <li>Zainstaluj zaleznosci: <code className="bg-secondary px-1 rounded">pip install supabase requests websockets</code></li>
                  <li>Uruchom: <code className="bg-secondary px-1 rounded">python relay.py</code></li>
                </ol>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Dziala w trzech trybach</strong>
                  <br />
                  Mecze online (competitive), mecze z botami / custom offline oraz replaye z Match History. Skrypt laczy sie z oficjalnym RL Stats API jako lokalny TCP stream (port 49123). Boost i speed sa widoczne tylko gdy spectatujesz lub gracz jest na Twojej druzynie (ograniczenie API).
                </p>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>Gotowe do uzycia</strong>
                  <br />
                  Skrypt ma juz wpisane SUPABASE_URL i klucz - nie musisz nic edytowac.
                </p>
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">
                  <strong>Wazna aktualizacja (v3)</strong>
                  <br />
                  Pobierz najnowszy <code className="bg-secondary px-1 rounded">relay.py</code>. v3 wystawia <strong>trzy</strong> lokalne kanaly:
                  WebSocket <code className="bg-secondary px-1 rounded">ws://127.0.0.1:49300</code> z <strong>pelnymi ramkami</strong>
                  (match + players + camera + series + teams, 30-60 Hz) oraz HTTP control plane <code className="bg-secondary px-1 rounded">http://127.0.0.1:49301</code>
                  (Dashboard wysyla tu nadpisy serii i drużyn; <code className="bg-secondary px-1 rounded">GET /postgame</code> zwraca podsumowanie ostatniego meczu — Faza 2: kickoff goals, pady, supersonic, sredni boost). Domyslnie <code className="bg-secondary px-1 rounded">SUPABASE_LIVE_WRITES=False</code> —
                  relay <strong>nie pisze do bazy</strong> w trakcie meczu, overlay <code className="bg-secondary px-1 rounded">/v2/overlay</code> na tej samej maszynie zywi sie WS-em.
                  Jesli potrzebujesz remote overlayu (OBS na innej maszynie) ustaw w pliku <code className="bg-secondary px-1 rounded">SUPABASE_LIVE_WRITES = True</code> — wraca zachowanie v2.4.
                  W terminalu HB pokazuje <code className="bg-secondary px-1 rounded">live_writes=on|off</code>, <code className="bg-secondary px-1 rounded">WS: full_frames/s</code> i licznik HTTP.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel lg:col-span-2">
            <CardHeader>
              <CardTitle>relay.py</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-secondary/50 p-4 rounded-lg overflow-auto max-h-[600px] text-xs font-mono">
                {relayScript}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
