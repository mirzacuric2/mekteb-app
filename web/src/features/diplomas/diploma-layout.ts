import { DIPLOMA_NAME_FONT_STYLE, type DiplomaNameFontStyle } from "./diploma-name-font";

/**
 * Diploma dynamic text placement (pdf-lib: origin bottom-left, Y increases upward).
 *
 * Each line has **Y** = baseline distance from the bottom, and optional **X** = distance from the
 * left for the **left edge** of the text (`drawText` in pdf-lib). Leave X unset (or clear the field)
 * to keep that line **horizontally centered** within the side margins.
 *
 * **Per-community layout** is stored in the database (Community → **Diplomas** tab).
 * App defaults below apply when no saved layout exists; admins tune positions in the UI
 * (click-to-set on the template preview).
 *
 * Tip: open the template in a PDF editor that shows rulers in **points** (1 pt ≈ 1/72 inch).
 * Portrait A4 is typically 595 × 842 pt; **landscape** swaps width/height.
 */

export type DiplomaRgb = { r: number; g: number; b: number };

export type DiplomaTextLayout = {
  placementMode: "stacked" | "absolute";
  nameBaselineFromBottomPt: number;
  nivoBaselineFromBottomPt: number;
  dateBaselineFromBottomPt: number;
  /** Baseline for optional imam/signature line (same coordinate system). */
  imamBaselineFromBottomPt: number;
  /**
   * Left edge of each line in pt from the page’s left (pdf-lib X). If null/omitted, that line is
   * horizontally centered (respecting minSideMarginPt).
   */
  nameXFromLeftPt?: number | null;
  nivoXFromLeftPt?: number | null;
  dateXFromLeftPt?: number | null;
  imamXFromLeftPt?: number | null;
  lineHeightFactor: number;
  gapAfterNamePt: number;
  gapAfterNivoPt: number;
  nameFontSize: number;
  nivoFontSize: number;
  dateFontSize: number;
  imamFontSize: number;
  minSideMarginPt: number;
  /** Child full name only; nivo, date, and imam use the body (sans) font. */
  nameFontStyle: DiplomaNameFontStyle;
  nameColor: DiplomaRgb;
  nivoColor: DiplomaRgb;
  dateColor: DiplomaRgb;
  imamColor: DiplomaRgb;
};

export const DIPLOMA_TEXT_LAYOUT: DiplomaTextLayout = {
  placementMode: "stacked",
  nameBaselineFromBottomPt: 400,
  nivoBaselineFromBottomPt: 348,
  dateBaselineFromBottomPt: 168,
  imamBaselineFromBottomPt: 115,
  lineHeightFactor: 1.35,
  gapAfterNamePt: 10,
  gapAfterNivoPt: 10,
  nameFontSize: 20,
  nivoFontSize: 14,
  dateFontSize: 12,
  imamFontSize: 11,
  minSideMarginPt: 40,
  nameFontStyle: DIPLOMA_NAME_FONT_STYLE.SANS,
  nameColor: { r: 0.08, g: 0.08, b: 0.1 },
  nivoColor: { r: 0.15, g: 0.15, b: 0.18 },
  dateColor: { r: 0.2, g: 0.2, b: 0.22 },
  imamColor: { r: 0.2, g: 0.2, b: 0.22 },
};

export function cloneDefaultDiplomaLayout(): DiplomaTextLayout {
  return JSON.parse(JSON.stringify(DIPLOMA_TEXT_LAYOUT)) as DiplomaTextLayout;
}

export function computeDiplomaTextPositions(layout: DiplomaTextLayout): {
  nameY: number;
  nivoY: number;
  dateY: number;
  imamY: number;
  nameSize: number;
  nivoSize: number;
  dateSize: number;
  imamSize: number;
} {
  const L = layout;
  const nameY = L.nameBaselineFromBottomPt;
  const nameSize = L.nameFontSize;
  const nivoSize = L.nivoFontSize;
  const dateSize = L.dateFontSize;
  const imamSize = L.imamFontSize;
  const imamY = L.imamBaselineFromBottomPt;

  if (L.placementMode === "absolute") {
    return {
      nameY,
      nivoY: L.nivoBaselineFromBottomPt,
      dateY: L.dateBaselineFromBottomPt,
      imamY,
      nameSize,
      nivoSize,
      dateSize,
      imamSize,
    };
  }

  const nivoY = nameY - nameSize * L.lineHeightFactor - L.gapAfterNamePt;
  const dateY = nivoY - nivoSize * L.lineHeightFactor - L.gapAfterNivoPt;

  return { nameY, nivoY, dateY, imamY, nameSize, nivoSize, dateSize, imamSize };
}

export type DiplomaTextHorizontalKey = "name" | "nivo" | "date" | "imam";

/** Resolve drawText `x` (left edge of text). Custom X is clamped so the line stays within side margins. */
export function resolveDiplomaTextX(
  layout: DiplomaTextLayout,
  key: DiplomaTextHorizontalKey,
  pageWidthPt: number,
  textWidthPt: number
): number {
  const margin = layout.minSideMarginPt;
  const custom =
    key === "name"
      ? layout.nameXFromLeftPt
      : key === "nivo"
        ? layout.nivoXFromLeftPt
        : key === "date"
          ? layout.dateXFromLeftPt
          : layout.imamXFromLeftPt;
  if (custom == null || Number.isNaN(custom)) {
    return Math.max(margin, (pageWidthPt - textWidthPt) / 2);
  }
  const maxLeft = Math.max(margin, pageWidthPt - margin - textWidthPt);
  return Math.max(margin, Math.min(custom, maxLeft));
}
