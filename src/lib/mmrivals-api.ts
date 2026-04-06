import type { TournamentResponse, MatchResponse } from '@/types/studio';

const API_URL = 'https://tvmieplfcvgmfcjaxpto.supabase.co/functions/v1/overlay-data';
const API_KEY = 'kXS6cVkTpJM2Qti';

async function apiFetch<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(API_URL);
  url.searchParams.set('key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const status = res.status;
    if (status === 401) throw new Error('Nieprawidłowy klucz API');
    if (status === 400) throw new Error('Nieprawidłowe parametry zapytania');
    if (status === 404) throw new Error('Turniej nie znaleziony');
    if (status === 429) throw new Error('Zbyt wiele zapytań — spróbuj za chwilę');
    throw new Error(`Błąd API: ${status}`);
  }

  return res.json();
}

export async function fetchTournaments(): Promise<TournamentResponse> {
  return apiFetch<TournamentResponse>({ mode: 'tournaments' });
}

export async function fetchMatches(
  tournamentId: string,
  mode: string,
): Promise<MatchResponse> {
  return apiFetch<MatchResponse>({ tournament_id: tournamentId, mode });
}
