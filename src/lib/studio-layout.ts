import type { CSSProperties } from 'react';

export const STUDIO_STAGE_WIDTH = 1920;
export const STUDIO_STAGE_HEIGHT = 1080;

/** Jedna szerokość contentu dla WSZYSTKICH trybów Studio */
export const STUDIO_CONTENT_MAX_WIDTH = 956;

/** Kamera + czat — margines od prawej krawędzi */
export const STUDIO_CAMERA_SAFE_RIGHT = 450;

/** Dostępna szerokość UI w OBS (?obs=1) */
export const STUDIO_AVAILABLE_WIDTH = STUDIO_STAGE_WIDTH - STUDIO_CAMERA_SAFE_RIGHT; // 1470

/** Padding pionowy (jednolity dla wszystkich trybów) */
export const STUDIO_PADDING_TOP = 24;
export const STUDIO_PADDING_BOTTOM = 32;

/** Sidebar w podglądzie (ukryty przy ?obs=1) */
export const STUDIO_SIDEBAR_WIDTH = 112;

/** Dodatkowy offset w dół tylko dla trybu recent (kompaktowy box) */
export const STUDIO_RECENT_OFFSET_TOP = 56;

/**
 * Szerokość kolumny pasków H2H w postgame.
 * 208px mieści 1-liniowe etykiety przy jednolitym foncie 10px
 * (najdłuższe: „CZAS NA SUPERSONIC", „CZAS NA 100 BOOSTA").
 */
export const POSTGAME_CENTER_COL_WIDTH = 208;

/** Jednolity rozmiar etykiet nad paskami — wszystkie 10 wierszy */
export const POSTGAME_BAR_LABEL_FONT_SIZE = 10; // px
export const POSTGAME_BAR_LABEL_LETTER_SPACING = '0.05em';

export function studioContentStyle(obs: boolean): CSSProperties {
  return {
    marginLeft: obs ? 0 : STUDIO_SIDEBAR_WIDTH,
    paddingTop: STUDIO_PADDING_TOP,
    paddingBottom: STUDIO_PADDING_BOTTOM,
    paddingRight: STUDIO_CAMERA_SAFE_RIGHT,
    paddingLeft: 0,
    boxSizing: 'border-box',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    background: 'transparent',
  };
}