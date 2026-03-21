/** How the child’s full name is typeset on the diploma PDF (other lines use the body font). */
export const DIPLOMA_NAME_FONT_STYLE = {
  SANS: "SANS",
  SCRIPT: "SCRIPT",
} as const;

export type DiplomaNameFontStyle = (typeof DIPLOMA_NAME_FONT_STYLE)[keyof typeof DIPLOMA_NAME_FONT_STYLE];

export const DIPLOMA_NAME_FONT_STYLE_ORDER = [
  DIPLOMA_NAME_FONT_STYLE.SANS,
  DIPLOMA_NAME_FONT_STYLE.SCRIPT,
] as const satisfies readonly DiplomaNameFontStyle[];

/** OFL Dancing Script (variable TTF from Google Fonts) — `web/public/fonts/`. */
export const DIPLOMA_NAME_SCRIPT_FONT_PUBLIC_PATH = "/fonts/DancingScript-wght.ttf";
