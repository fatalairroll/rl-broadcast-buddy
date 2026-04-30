import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, ArrowLeft, Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

const SUPABASE_URL = 'https://swgisbcfmtzrbevsqtwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2lzYmNmbXR6cmJldnNxdHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjgxNzQsImV4cCI6MjA4NDk0NDE3NH0.IEk5RfQw5kYOXbaNycV5_xkP5j106AKfwy4zYX6Oqjk';

const getRelayScript = () => `"""
RL Broadcast Relay V2 (Python)
Most pomiedzy oficjalnym Rocket League Stats API (TAGame.MatchStatsExporter_TA, port 49123)
a baza Lovable Cloud (Supabase) zasilajaca Overlay V2 (/v2/overlay).

INSTALACJA:
  1) Zainstaluj Python 3.10+
  2) pip install supabase requests
  3) Wlacz w grze plik:
        %LOCALAPPDATA%\\\\..\\\\Roaming\\\\TAGame\\\\Config\\\\DefaultStatsAPI.ini  (Steam)
        ...\\\\Epic Games\\\\rocketleague\\\\TAGame\\\\Config\\\\DefaultStatsAPI.ini (Epic)
     z trescia:
        [TAGame.MatchStatsExporter_TA]
        Port=49123
        PacketSendRate=30
  4) Uruchom: python relay.py

TRYB TESTOWY DLA BOTOW:
  Jezeli RL nie wysyla listy graczy (mecz z botami / offline spectate),
  relay AUTOMATYCZNIE wstawia czterech testowych zawodnikow (BLUE 1/2, ORANGE 1/2)
  z symulowanym boostem/speedem oraz przelaczana co 4s kamera aktywnego gracza.
  Dzieki temu mozesz testowac caly Overlay V2 nie wchodzac do prawdziwego meczu online.
  W prawdziwym meczu online dane testowe sa automatycznie zastepowane realnymi.

Plik wygenerowany ze strony Relay - nie musisz nic edytowac.
"""

import json
import math
import random
import socket
import threading
import time
from typing import Any, Dict, List, Optional

try:
    from supabase import create_client, Client  # type: ignore
except Exception as e:
    raise SystemExit(
        "Brakuje pakietu 'supabase'. Uruchom: pip install supabase requests\\n"
        f"Szczegol: {e}"
    )

# === KONFIGURACJA (automatycznie uzupelniona przez Lovable) ===
SUPABASE_URL = '${SUPABASE_URL}'
SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}'
RL_HOST = "127.0.0.1"
RL_PORT = 49123

# Throttle zapisow do bazy (sekundy miedzy upsertami danego rodzaju)
WRITE_INTERVAL_S = 0.25  # ~4 zapisy/s
HEARTBEAT_S = 5.0
DUMMY_CAMERA_CYCLE_S = 4.0
DUMMY_TIMEOUT_S = 2.0  # po ilu sekundach bez prawdziwych graczy wlaczamy tryb testowy

DUMMY_PLAYERS = [
    {"player_name": "BLUE BOT 1",   "team_num": 0},
    {"player_name": "BLUE BOT 2",   "team_num": 0},
    {"player_name": "ORANGE BOT 1", "team_num": 1},
    {"player_name": "ORANGE BOT 2", "team_num": 1},
]

# === STAN ===
sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

state_lock = threading.Lock()
last_match_write = 0.0
last_players_write = 0.0
last_camera_write = 0.0
last_real_players_at = 0.0
current_match_guid: Optional[str] = None
last_active_camera: Optional[str] = None

stats = {
    "events": 0, "bytes": 0,
    "events_delta": 0, "bytes_delta": 0,
    "match_writes": 0, "player_writes": 0, "camera_writes": 0,
    "match_writes_delta": 0, "player_writes_delta": 0, "camera_writes_delta": 0,
    "players_seen": 0,
    "dummy_mode": False,
}


def fmt_timer(seconds: float) -> str:
    s = max(0, int(round(seconds)))
    return f"{s // 60}:{s % 60:02d}"


def upsert_match(blue: int, orange: int, time_seconds: float, is_ot: bool, guid: Optional[str]) -> None:
    global last_match_write
    now = time.time()
    if now - last_match_write < WRITE_INTERVAL_S:
        return
    last_match_write = now
    payload = {
        "id": 1,
        "blue_score": int(blue),
        "orange_score": int(orange),
        "time_seconds": int(round(time_seconds)),
        "timer": fmt_timer(time_seconds),
        "is_overtime": bool(is_ot),
        "match_guid": guid,
    }
    try:
        sb.table("match_metadata").upsert(payload, on_conflict="id").execute()
        stats["match_writes"] += 1
        stats["match_writes_delta"] += 1
    except Exception as e:
        print(f"[ERR] match_metadata upsert: {e}")


def upsert_players(rows: List[Dict[str, Any]]) -> None:
    global last_players_write
    if not rows:
        return
    now = time.time()
    if now - last_players_write < WRITE_INTERVAL_S:
        return
    last_players_write = now
    try:
        sb.table("players_live").upsert(rows, on_conflict="player_name").execute()
        stats["player_writes"] += len(rows)
        stats["player_writes_delta"] += len(rows)
    except Exception as e:
        print(f"[ERR] players_live upsert: {e}")


def upsert_camera(target: Optional[str]) -> None:
    global last_camera_write, last_active_camera
    if target == last_active_camera:
        return
    now = time.time()
    if now - last_camera_write < WRITE_INTERVAL_S:
        return
    last_camera_write = now
    last_active_camera = target
    try:
        sb.table("active_camera").upsert(
            {"id": 1, "target_name": target}, on_conflict="id"
        ).execute()
        stats["camera_writes"] += 1
        stats["camera_writes_delta"] += 1
    except Exception as e:
        print(f"[ERR] active_camera upsert: {e}")


# === PARSOWANIE EVENTOW Z RL STATS API ===
# Format: kazda wiadomosc to JSON z polami { "event": "...", "data": {...} }
# Eventy ktore obsluguje:
#   - UpdateState (Game.Teams[].Score, Game.TimeSeconds, bOvertime, Players[])
#   - ClockUpdatedSeconds (delta_time)
#   - MatchCreated / MatchDestroyed (MatchGuid reset)

def handle_event(evt: Dict[str, Any]) -> None:
    global current_match_guid, last_real_players_at
    name = evt.get("event") or evt.get("Event") or ""
    data = evt.get("data") or evt.get("Data") or {}

    if name == "UpdateState":
        game = data.get("Game") or {}
        teams = game.get("Teams") or []
        blue = (teams[0] or {}).get("Score", 0) if len(teams) > 0 else 0
        orange = (teams[1] or {}).get("Score", 0) if len(teams) > 1 else 0
        ts = game.get("TimeSeconds")
        is_ot = bool(game.get("bOvertime") or game.get("IsOvertime"))
        guid = data.get("MatchGuid") or game.get("MatchGuid")
        if guid:
            current_match_guid = guid

        if ts is None:
            ts = 300

        upsert_match(blue, orange, ts, is_ot, current_match_guid)

        players = data.get("Players") or game.get("Players") or []
        stats["players_seen"] = len(players)

        if players:
            last_real_players_at = time.time()
            rows: List[Dict[str, Any]] = []
            target = None
            for p in players:
                pname = p.get("Name") or p.get("PlayerName")
                if not pname:
                    continue
                rows.append({
                    "player_name": pname,
                    "team_num": int(p.get("Team", 0)),
                    "boost": int(round((p.get("Boost", 0) or 0))),
                    "speed": float(p.get("Speed", 0) or 0),
                    "goals": int(p.get("Goals", 0) or 0),
                    "assists": int(p.get("Assists", 0) or 0),
                    "saves": int(p.get("Saves", 0) or 0),
                    "shots": int(p.get("Shots", 0) or 0),
                    "demos": int(p.get("Demolishes", p.get("Demos", 0)) or 0),
                    "is_demolished": bool(p.get("bDemolished") or p.get("IsDemolished")),
                    "is_supersonic": bool(p.get("bSupersonic") or p.get("IsSupersonic")),
                })
                if p.get("bIsTarget") or p.get("IsTarget"):
                    target = pname
            upsert_players(rows)
            if target:
                upsert_camera(target)

    elif name == "ClockUpdatedSeconds":
        # data zawiera np. { "delta_time": 0.033, "TimeSeconds": ... }
        ts = data.get("TimeSeconds")
        if ts is None:
            ts = data.get("time_seconds")
        if ts is None:
            return
        # Update tylko timera; wynik zostaje
        try:
            current = sb.table("match_metadata").select("blue_score,orange_score,is_overtime").eq("id", 1).single().execute().data or {}
        except Exception:
            current = {}
        upsert_match(
            current.get("blue_score", 0),
            current.get("orange_score", 0),
            ts,
            bool(current.get("is_overtime", False)),
            current_match_guid,
        )

    elif name in ("MatchCreated", "MatchDestroyed"):
        guid = data.get("MatchGuid")
        if name == "MatchCreated" and guid:
            current_match_guid = guid


# === TRYB TESTOWY (mecz z botami / offline) ===
def dummy_loop() -> None:
    """Co WRITE_INTERVAL_S generuje fikcyjnych graczy gdy RL nie podaje Players."""
    cam_idx = 0
    last_cam_switch = 0.0
    phase = 0.0
    while True:
        time.sleep(WRITE_INTERVAL_S)
        # Wlacz tylko gdy nie ma realnych graczy od DUMMY_TIMEOUT_S
        if last_real_players_at and (time.time() - last_real_players_at) < DUMMY_TIMEOUT_S:
            stats["dummy_mode"] = False
            continue
        stats["dummy_mode"] = True
        phase += WRITE_INTERVAL_S

        rows: List[Dict[str, Any]] = []
        for i, dp in enumerate(DUMMY_PLAYERS):
            boost = int(50 + 45 * math.sin(phase * 0.7 + i))
            speed = abs(int(40 + 60 * math.sin(phase * 1.1 + i * 1.7)))
            rows.append({
                "player_name": dp["player_name"],
                "team_num": dp["team_num"],
                "boost": max(0, min(100, boost)),
                "speed": float(speed),
                "goals": 0, "assists": 0, "saves": 0, "shots": 0, "demos": 0,
                "is_demolished": False,
                "is_supersonic": speed > 95,
            })
        upsert_players(rows)

        if time.time() - last_cam_switch >= DUMMY_CAMERA_CYCLE_S:
            last_cam_switch = time.time()
            cam_idx = (cam_idx + 1) % len(DUMMY_PLAYERS)
            upsert_camera(DUMMY_PLAYERS[cam_idx]["player_name"])


# === HEARTBEAT ===
def heartbeat_loop() -> None:
    while True:
        time.sleep(HEARTBEAT_S)
        with state_lock:
            mode = "DUMMY" if stats["dummy_mode"] else "LIVE"
            print(
                f"[HB] {HEARTBEAT_S:.1f}s | mode: {mode} "
                f"| events: +{stats['events_delta']} (total {stats['events']}) "
                f"| bytes: +{stats['bytes_delta']} (total {stats['bytes']}) "
                f"| DB: match=+{stats['match_writes_delta']} "
                f"players=+{stats['player_writes_delta']} "
                f"camera=+{stats['camera_writes_delta']} "
                f"| players_seen={stats['players_seen']}"
            )
            stats["events_delta"] = 0
            stats["bytes_delta"] = 0
            stats["match_writes_delta"] = 0
            stats["player_writes_delta"] = 0
            stats["camera_writes_delta"] = 0


# === GLOWNA PETLA TCP ===
def read_messages(sock: socket.socket) -> None:
    """RL Stats API wysyla strumien JSON-ow rozdzielonych newline-em."""
    buf = b""
    sock.settimeout(1.0)
    while True:
        try:
            chunk = sock.recv(65536)
        except socket.timeout:
            continue
        if not chunk:
            print("[RL] Polaczenie zamkniete przez gre.")
            return
        with state_lock:
            stats["bytes"] += len(chunk)
            stats["bytes_delta"] += len(chunk)
        buf += chunk
        # parse newline-delimited JSON
        while b"\\n" in buf:
            line, buf = buf.split(b"\\n", 1)
            line = line.strip()
            if not line:
                continue
            try:
                evt = json.loads(line.decode("utf-8", errors="replace"))
            except Exception:
                continue
            with state_lock:
                stats["events"] += 1
                stats["events_delta"] += 1
            try:
                handle_event(evt)
            except Exception as e:
                print(f"[ERR] handle_event: {e}")


def connect_loop() -> None:
    while True:
        try:
            print(f"[RL] Laczenie z {RL_HOST}:{RL_PORT}...")
            with socket.create_connection((RL_HOST, RL_PORT), timeout=5) as sock:
                print("[RL] \\u2705 Polaczono \\u2014 czekam na eventy.")
                read_messages(sock)
        except (ConnectionRefusedError, socket.timeout, OSError) as e:
            print(f"[RL] Brak polaczenia ({e}). Ponawiam za 3s.")
        time.sleep(3)


def main() -> None:
    print("\\u2554\\u2550\\u2550 RL Broadcast Relay V2 (Python) \\u2550\\u2550")
    print(f"\\u2551 Stats API: {RL_HOST}:{RL_PORT}")
    print(f"\\u2551 Supabase:  {SUPABASE_URL}")
    print("\\u255a\\u2550 Tryb testowy aktywuje sie automatycznie gdy RL nie wysyla graczy (np. mecz z botami).\\n")

    threading.Thread(target=heartbeat_loop, daemon=True).start()
    threading.Thread(target=dummy_loop, daemon=True).start()
    connect_loop()


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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Gamepad2 className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Relay Script (Overlay V2)</h1>
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
                  <li>Zainstaluj zaleznosci: <code className="bg-secondary px-1 rounded">pip install supabase requests</code></li>
                  <li>Uruchom: <code className="bg-secondary px-1 rounded">python relay.py</code></li>
                </ol>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Tryb testowy dla botow</strong>
                  <br />
                  Jezeli grasz mecz z botami / offline, RL nie wysyla listy graczy. Relay automatycznie wstawia czterech testowych zawodnikow oraz przelaczana kamere, zebys mogl testowac caly Overlay V2. W meczu online dane testowe sa zastepowane prawdziwymi.
                </p>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>Gotowe do uzycia</strong>
                  <br />
                  Skrypt ma juz wpisane SUPABASE_URL i klucz — nie musisz nic edytowac.
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
