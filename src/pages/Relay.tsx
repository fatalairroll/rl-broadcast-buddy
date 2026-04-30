import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, ArrowLeft, Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';

const SUPABASE_URL = 'https://swgisbcfmtzrbevsqtwr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z2lzYmNmbXR6cmJldnNxdHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNjgxNzQsImV4cCI6MjA4NDk0NDE3NH0.IEk5RfQw5kYOXbaNycV5_xkP5j106AKfwy4zYX6Oqjk';

const getRelayScript = () => `"""
RL Broadcast Relay V2 (Python) — oficjalne RL Stats API (lokalny TCP/JSON stream)

Zrodlo danych: Rocket League Stats API (TAGame.MatchStatsExporter_TA), port 49123.
Endpoint w aktualnych buildach RL zachowuje sie jak zwykly lokalny TCP stream JSON,
a nie jak klasyczny WebSocket (mimo nazwy w dokumentacji). Ten skrypt laczy sie
bezposrednio przez TCP i parsuje strumien JSON-ow przy uzyciu raw_decode.

Dziala w meczach competitive online, meczach z botami oraz w replayach z Match History.

INSTALACJA:
  1) Python 3.10+
  2) pip install supabase requests
  3) Wlacz w grze plik DefaultStatsAPI.ini (patrz /relay w aplikacji).
  4) python relay.py

Plik wygenerowany na stronie /relay — nie musisz nic edytowac.
"""

import json
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

# === KONFIGURACJA (wstrzykiwana przez Lovable) ===
SUPABASE_URL = '${SUPABASE_URL}'
SUPABASE_ANON_KEY = '${SUPABASE_ANON_KEY}'
RL_HOST = "127.0.0.1"
RL_PORT = 49123

WRITE_INTERVAL_S = 0.25      # throttle zapisow do DB (~4/s na rodzaj)
HEARTBEAT_S = 5.0
WATCHDOG_TIMEOUT_S = 0.5     # po tylu s bez updateu z gry zatrzymujemy lokalny zegar
LOCAL_TICK_S = 0.1
NO_DATA_WARN_S = 10.0
RECONNECT_DELAY_S = 3.0
RECV_CHUNK = 65536

sb: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# === STAN ===
state_lock = threading.Lock()

last_match_write = 0.0
last_players_write = 0.0
last_camera_write = 0.0
last_event_at = 0.0
last_state_update_at = 0.0

current_match_guid: Optional[str] = None
last_active_camera: Optional[str] = None

# Lokalny zegar (interpolacja miedzy snapami z gry)
local_time_seconds: float = 300.0
is_overtime: bool = False
clock_running: bool = False
in_replay: bool = False  # bReplay z Game lub goal-replay window
blue_score: int = 0
orange_score: int = 0

stats = {
    "events": 0, "events_delta": 0,
    "match_writes": 0, "match_writes_delta": 0,
    "player_writes": 0, "player_writes_delta": 0,
    "camera_writes": 0, "camera_writes_delta": 0,
    "players_seen": 0,
    "mode": "waiting",  # waiting / live / replay / podium
}


def fmt_timer(seconds: float) -> str:
    s = max(0, int(round(seconds)))
    return f"{s // 60}:{s % 60:02d}"


# === ZAPISY DO DB (z throttlingiem) ===
def upsert_match() -> None:
    global last_match_write
    now = time.time()
    if now - last_match_write < WRITE_INTERVAL_S:
        return
    last_match_write = now
    payload = {
        "id": 1,
        "blue_score": int(blue_score),
        "orange_score": int(orange_score),
        "time_seconds": int(round(max(0, local_time_seconds))),
        "timer": fmt_timer(local_time_seconds),
        "is_overtime": bool(is_overtime),
        "match_guid": current_match_guid,
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


# === HANDLERY EVENTOW ===
def handle_update_state(data: Dict[str, Any]) -> None:
    global current_match_guid, local_time_seconds, is_overtime
    global blue_score, orange_score, in_replay, last_state_update_at

    last_state_update_at = time.time()

    guid = data.get("MatchGuid")
    if guid:
        current_match_guid = guid

    game = data.get("Game") or {}
    teams = game.get("Teams") or []
    if len(teams) > 0:
        blue_score = int((teams[0] or {}).get("Score", 0) or 0)
    if len(teams) > 1:
        orange_score = int((teams[1] or {}).get("Score", 0) or 0)

    ts = game.get("TimeSeconds")
    if ts is not None:
        try:
            local_time_seconds = float(ts)
        except Exception:
            pass
    is_overtime = bool(game.get("bOvertime", False))
    in_replay = bool(game.get("bReplay", False))

    upsert_match()

    # Kamera aktywna
    if game.get("bHasTarget"):
        target = (game.get("Target") or {}).get("Name")
        if target:
            upsert_camera(target)
    else:
        upsert_camera(None)

    # Gracze
    players = data.get("Players") or []
    stats["players_seen"] = len(players)
    rows: List[Dict[str, Any]] = []
    for p in players:
        name = p.get("Name")
        if not name:
            continue
        rows.append({
            "player_name": name,
            "team_num": int(p.get("TeamNum", 0) or 0),
            "boost": int(p.get("Boost", 0) or 0),          # SPECTATOR-only
            "speed": float(p.get("Speed", 0) or 0),         # SPECTATOR-only
            "goals": int(p.get("Goals", 0) or 0),
            "assists": int(p.get("Assists", 0) or 0),
            "saves": int(p.get("Saves", 0) or 0),
            "shots": int(p.get("Shots", 0) or 0),
            "demos": int(p.get("Demos", 0) or 0),
            "is_demolished": bool(p.get("bDemolished", False)),
            "is_supersonic": bool(p.get("bSupersonic", False)),
        })
    if rows:
        upsert_players(rows)


def handle_clock_updated(data: Dict[str, Any]) -> None:
    global local_time_seconds, is_overtime, last_state_update_at
    last_state_update_at = time.time()
    ts = data.get("TimeSeconds")
    if ts is not None:
        try:
            local_time_seconds = float(ts)
        except Exception:
            return
    is_overtime = bool(data.get("bOvertime", is_overtime))
    upsert_match()


def handle_event(evt: Dict[str, Any]) -> None:
    global current_match_guid, clock_running, in_replay
    global blue_score, orange_score, local_time_seconds, is_overtime

    name = evt.get("Event") or evt.get("event") or ""
    data = evt.get("Data") or evt.get("data") or {}

    if name == "UpdateState":
        handle_update_state(data)
        return

    if name == "ClockUpdatedSeconds":
        handle_clock_updated(data)
        return

    if name == "GoalScored":
        scorer = (data.get("Scorer") or {}).get("Name", "?")
        print(f"[GOAL] {scorer}")
        return

    if name == "GoalReplayStart":
        in_replay = True
        clock_running = False
        return

    if name in ("GoalReplayEnd", "GoalReplayWillEnd"):
        in_replay = False
        clock_running = True
        return

    if name == "RoundStarted":
        clock_running = True
        return

    if name == "CountdownBegin":
        clock_running = False
        return

    if name in ("MatchCreated", "MatchInitialized"):
        guid = data.get("MatchGuid")
        if guid:
            current_match_guid = guid
        blue_score = 0
        orange_score = 0
        local_time_seconds = 300.0
        is_overtime = False
        in_replay = False
        clock_running = False
        stats["mode"] = "live"
        upsert_match()
        return

    if name in ("MatchEnded", "MatchDestroyed", "PodiumStart"):
        clock_running = False
        if name == "PodiumStart":
            stats["mode"] = "podium"
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
    global local_time_seconds, clock_running
    while True:
        time.sleep(LOCAL_TICK_S)
        with state_lock:
            # Watchdog: brak danych z gry => zatrzymaj zegar
            if last_state_update_at and (time.time() - last_state_update_at) > WATCHDOG_TIMEOUT_S:
                clock_running = False
            if not clock_running or in_replay:
                continue
            if is_overtime:
                local_time_seconds += LOCAL_TICK_S
            else:
                local_time_seconds = max(0.0, local_time_seconds - LOCAL_TICK_S)
        upsert_match()


# === HEARTBEAT ===
def heartbeat_loop() -> None:
    while True:
        time.sleep(HEARTBEAT_S)
        with state_lock:
            mode = stats["mode"]
            no_data_for = (time.time() - last_event_at) if last_event_at else None
            warn = ""
            if last_event_at == 0 or (no_data_for is not None and no_data_for > NO_DATA_WARN_S):
                warn = " | [WARN] brak danych z RL — sprawdz DefaultStatsAPI.ini i restart RL"
            print(
                f"[HB] mode={mode} "
                f"events=+{stats['events_delta']} (total {stats['events']}) "
                f"| players_seen={stats['players_seen']} "
                f"| DB: match=+{stats['match_writes_delta']} "
                f"players=+{stats['player_writes_delta']} "
                f"camera=+{stats['camera_writes_delta']}"
                f"{warn}"
            )
            stats["events_delta"] = 0
            stats["match_writes_delta"] = 0
            stats["player_writes_delta"] = 0
            stats["camera_writes_delta"] = 0


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
    with state_lock:
        stats["events"] += 1
        stats["events_delta"] += 1
        last_event_at = time.time()
    try:
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
    while True:
        sock: Optional[socket.socket] = None
        try:
            print(f"[RL] Laczenie z {RL_HOST}:{RL_PORT} ...")
            sock = socket.create_connection((RL_HOST, RL_PORT), timeout=5.0)
            sock.settimeout(None)
            print(f"[RL] Polaczono z RL Stats API na {RL_HOST}:{RL_PORT}.")
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
        print(f"[RL] Reconnect za {RECONNECT_DELAY_S:.0f}s ...")
        time.sleep(RECONNECT_DELAY_S)


def main() -> None:
    print("== RL Broadcast Relay V2 (Python) ==")
    print(f"   Stats API: tcp://{RL_HOST}:{RL_PORT} (lokalny JSON stream)")
    print(f"   Supabase:  {SUPABASE_URL}")
    print("   Tryby: mecz online, mecz z botami, replay z Match History.")
    print("   (Boost/speed widoczny tylko w spectatorze lub na wlasnej druzynie.)\\n")

    threading.Thread(target=heartbeat_loop, daemon=True).start()
    threading.Thread(target=clock_loop, daemon=True).start()
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
