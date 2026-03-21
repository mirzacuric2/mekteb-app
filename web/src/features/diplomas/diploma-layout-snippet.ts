import type { DiplomaTextLayout } from "./diploma-layout";

function xLine(key: string, v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "";
  return `${key}XFromLeftPt: ${v},\n`;
}

export function diplomaLayoutToTsSnippet(layout: DiplomaTextLayout): string {
  return `nameFontStyle: "${layout.nameFontStyle}",
placementMode: "absolute",
${xLine("name", layout.nameXFromLeftPt)}${xLine("nivo", layout.nivoXFromLeftPt)}${xLine("date", layout.dateXFromLeftPt)}${xLine("imam", layout.imamXFromLeftPt)}nameBaselineFromBottomPt: ${layout.nameBaselineFromBottomPt},
nivoBaselineFromBottomPt: ${layout.nivoBaselineFromBottomPt},
dateBaselineFromBottomPt: ${layout.dateBaselineFromBottomPt},
imamBaselineFromBottomPt: ${layout.imamBaselineFromBottomPt},
nameFontSize: ${layout.nameFontSize},
nivoFontSize: ${layout.nivoFontSize},
dateFontSize: ${layout.dateFontSize},
imamFontSize: ${layout.imamFontSize},
minSideMarginPt: ${layout.minSideMarginPt},`;
}
