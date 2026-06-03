# Hotfix overlay freeze + WS-as-primary fallback

Two-part change. Part A is the accepted freeze hotfix. Part B wires `getLastFrame()` from the WS feed into `match`, `players`, and `camera` so the overlay works when relay v3 has Supabase live writes disabled (WS becomes the primary source; Supabase is the fallback).

---

## PART A — Freeze hotfix

### A1. `src/hooks/useLocalBoostFeed.ts` → rename to `useLocalRelayFeed.ts`

- Add `revision` state; coalesce all incoming WS messages into ONE `setRevision` per `requestAnimationFrame`. Schedule rAF only if not already scheduled.
- Parse both shapes:
  - v2: `{ t, players: [...] }` → fills boost map only.
  - v3: `{ v:3, t, match, players, camera, series, teams }` → fills boost map AND stores full snapshot in `lastFrameRef`.
- Refs: `mapRef` (per-player boost), `lastFrameRef` (full v3 frame or null), `lastMsgRef` (perf.now timestamp).
- Stable return memoized on `[connected, revision]`:
  ```
  { connected, lastMessageAgeMs, getBoost, getLastFrame, getLastMessageAge }
  ```
- Keep `useLocalBoostFeed` as a re-export alias so nothing breaks mid-merge.

### A2. `src/hooks/useLiveStatsV2.ts` — stop subscription churn

- Remove `localBoost` from the Realtime `useEffect` deps; read it via `localBoostRef.current` updated every render.
- Memoize the hook's return object on its real inputs so `OverlayV2` consumers don't re-render per WS frame unless data changed.

### A3. `src/hooks/useOverlayVisibility.ts` — WS liveness override

- New optional second arg `{ relayConnected, lastMessageAgeMs, lastFrameIsActive }`.
- If `relayConnected && lastMessageAgeMs != null && lastMessageAgeMs < 1500`: `visible = lastFrameIsActive !== false`. Skip `updated_at` staleness check.
- Else: current logic.
- `OverlayV2.tsx`: pass relay feed snapshot in.

### A4. `src/components/v2/BoostBarV2.tsx` — bypass easing when WS connected

- Optional `relayConnected?: boolean`. When true: render `boost = targetBoost`, skip RAF easing loop. When false: current ease retained as Supabase fallback.
- Thread the prop through `BoostStackV2` from `OverlayV2`.

---

## PART B — WS as primary for match / players / camera

Goal: when the v3 relay is sending full frames and Supabase live writes are off (or just lagging), `useLiveStatsV2` must serve `match`, `players`, and `camera` from `getLastFrame()` instead of stale Supabase rows. Registry stays Supabase-only (admin-edited, low-frequency).

### B1. Frame shape contract (consumed by overlay)

`getLastFrame()` returns `null` or:

```ts
interface RelayFrameV3 {
  v: 3;
  t: number;                      // server time
  match: MatchMetadata;           // id=1 shape, includes is_active + updated_at (ISO from relay)
  players: PlayerLive[];          // full rows incl. goals/assists/saves/shots/demos/is_demolished/mmr
  camera: { target_name: string | null };
  series?: unknown;               // handled elsewhere
  teams?: unknown;
}
```

Relay v3 is expected to emit these fields; if any are missing (older v3 build), fall back to Supabase value for that field only (per-field merge, not all-or-nothing).

### B2. `useLiveStatsV2.ts` — merge logic

Compute a single `liveSource` flag:
```
const liveWs = relay.connected && relay.lastMessageAgeMs != null && relay.lastMessageAgeMs < 1500;
const frame  = liveWs ? relay.getLastFrame() : null;
```

Then:

- **match**: `frame?.match ?? supabaseMatch`.
- **camera**: `frame?.camera ? { id:1, target_name: frame.camera.target_name, updated_at: ... } : supabaseCamera`.
- **players**: when `frame?.players` present, use frame players as the base list (replaces `fresh` from Supabase). Then still run the existing boost-map enrichment from `relay.getBoost(name)` so per-frame boost stays smooth even between full frames (which may be throttled). When frame absent, keep current Supabase `fresh` path.
- **registry**: unchanged (Supabase only).
- Drop the 30 s staleness filter when `liveWs` is true (frame freshness is authoritative).
- Memoize final return once, derived from `[match, players, camera, registryMap, activeCameraTarget]`.

### B3. Optional: keep Supabase Realtime subscribed even when WS is primary

Yes — subscriptions stay on so OBS-on-other-machine instances still work, and so we auto-fall-back if WS dies mid-match. No conditional unsubscribe.

### B4. Debug log (`?debug=1`)

Print one line every 2 s:
```
[live-stats] source=ws|sb wsAge=120ms frameAge=33ms players=ws(6)|sb(6) revs/2s=...
```

---

## Acceptance

- `/v2/overlay?debug=1` open in OBS for 10 min: no freeze, stable memory, `revision` increments at ≤ frame-rate.
- With relay v3 + Supabase live writes ENABLED: behaves like before, overlay shows live data (no regression).
- With relay v3 + Supabase live writes DISABLED: overlay still shows full match, players, camera, and live boost — sourced entirely from WS.
- WS drops mid-match: within ~1.5 s overlay falls back to Supabase (or hides via visibility logic if Supabase is also stale).
- Supabase Realtime channel `live-stats-v2` is subscribed exactly once per page lifetime (no `phx_join` churn in network panel).

## Out of scope

- `Relay.tsx` (Python generator) — separate task. Hotfix works against v2.4 (boost-only) via the v2 parser branch; Part B activates automatically once v3 frames arrive.
- `useBroadcast`, `relay-http.ts`, Dashboard hydration — untouched.
- `players_registry` — stays Supabase.
