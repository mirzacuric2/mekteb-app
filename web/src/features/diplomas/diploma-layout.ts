import { DIPLOMA_NAME_FONT_STYLE, type DiplomaNameFontStyle } from "./diploma-name-font";

export type DiplomaRgb = { r: number; g: number; b: number };

export type DiplomaTextLayout = {
  placementMode: "stacked" | "absolute";
  nameBaselineFromBottomPt: number;
  nivoBaselineFromBottomPt: number;
  dateBaselineFromBottomPt: number;
  imamBaselineFromBottomPt: number;
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
