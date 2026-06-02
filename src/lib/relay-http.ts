/**
 * Fire-and-forget POST helpers do lokalnego serwera HTTP relay v3
 * (http://127.0.0.1:49301). Bezbledowe gdy relay nie zyje — wszystkie
 * blady sa polykane, zeby UI Dashboardu nie spamil tostow.
 */

import type { BroadcastSession, SeriesType } from '@/types/broadcast';

const BASE = 'http://127.0.0.1:49301';

interface SeriesPayload {
  type: SeriesType;
  blue: number;
  orange: number;
  blue_name?: string;
  orange_name?: string;
}

interface TeamsPayload {
  blue_name: string;
  orange_name: string;
}

async function silentPost(path: string, body: unknown): Promise<void> {
  try {
    await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Krotki timeout poprzez AbortController, zeby nie blokowac dlugo.
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Relay moze byc offline — to OK, overlay i tak zlapie nowy stan przy
    // nastepnym hydratacji / reconnect.
  }
}

export function postSeries(payload: SeriesPayload): Promise<void> {
  return silentPost('/series', payload);
}

export function postTeams(payload: TeamsPayload): Promise<void> {
  return silentPost('/teams', payload);
}

/**
 * Wysyla aktualny stan sesji (nazwy + seria) do relaya jako jedna paczka.
 * Uzywane przy:
 *  - pierwszym zaladowaniu aktywnej broadcast_sessions w Dashboardzie,
 *  - kazdym update'cie sesji (po sukcesie zapisu do Supabase),
 *  - po wykryciu reconnectu lokalnego WS (relay mogl byc zrestartowany).
 */
export function syncSessionToRelay(session: Pick<
  BroadcastSession,
  'team_a_name' | 'team_b_name' | 'series_type' | 'team_a_series_score' | 'team_b_series_score'
>): void {
  const blueName = session.team_a_name ?? '';
  const orangeName = session.team_b_name ?? '';
  void postTeams({ blue_name: blueName, orange_name: orangeName });
  void postSeries({
    type: (session.series_type ?? 'bo3') as SeriesType,
    blue: session.team_a_series_score ?? 0,
    orange: session.team_b_series_score ?? 0,
    blue_name: blueName || undefined,
    orange_name: orangeName || undefined,
  });
}