import type { ReactNode } from 'react';
import {
  NB_ACID,
  NB_BORDER,
  NB_BORDER_THIN,
  NB_FONT,
  NB_INK,
  NB_MONO,
  nbSceneBg,
  nbShadowSmall,
} from '@/lib/studio-neobrutal-theme';

export type NeobrutalViewKey = 'next' | 'results' | 'bracket' | 'postgame';

const TITLES: Record<NeobrutalViewKey, string> = {
  next: 'Następne mecze',
  results: 'Zakończone mecze',
  bracket: 'Drabinka',
  postgame: 'Podsumowanie',
};

const TAGS: Record<NeobrutalViewKey, string> = {
  next: 'STUDIO · NEXT',
  results: 'STUDIO · RESULTS',
  bracket: 'STUDIO · BRACKET',
  postgame: 'STUDIO · POSTGAME',
};

interface Props {
  view: NeobrutalViewKey;
  tournamentName?: string;
  children: ReactNode;
}

/**
 * Wraps a studio view with the neobrutal scene: opaque paper background with
 * blueprint grid, top-left signature (kicker + title + acid bar) and top-right
 * view tag. All four studio views share identical chrome.
 */
export function NeobrutalScene({ view, tournamentName, children }: Props) {
  const kicker = tournamentName
    ? `MMRIVALS · ${tournamentName.toUpperCase()}`
    : 'MMRIVALS';

  return (
    <div
      style={{
        ...nbSceneBg,
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        padding: '36px 40px 40px',
        boxSizing: 'border-box',
        color: NB_INK,
        fontFamily: NB_FONT,
      }}
    >
      {/* Signature header — top-left */}
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: NB_MONO,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '.24em',
            color: NB_INK,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {kicker}
        </div>
        <h1
          style={{
            fontFamily: NB_FONT,
            fontWeight: 900,
            fontSize: 58,
            lineHeight: 1,
            letterSpacing: '-.02em',
            textTransform: 'uppercase',
            color: NB_INK,
            margin: 0,
          }}
        >
          {TITLES[view]}
        </h1>
        <div
          aria-hidden
          style={{
            width: 160,
            height: 10,
            background: NB_ACID,
            border: NB_BORDER,
            boxShadow: nbShadowSmall,
            marginTop: 14,
          }}
        />
      </header>

      {/* View tag — top-right */}
      <div
        style={{
          position: 'absolute',
          top: 36,
          right: 40,
          fontFamily: NB_MONO,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '.18em',
          padding: '3px 10px',
          background: NB_ACID,
          border: NB_BORDER_THIN,
          color: NB_INK,
          textTransform: 'uppercase',
        }}
      >
        {TAGS[view]}
      </div>

      {children}
    </div>
  );
}

export default NeobrutalScene;