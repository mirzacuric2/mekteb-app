import { z } from "zod";

const diplomaRgbSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
});

export const communityDiplomaTextLayoutSchema = z.object({
  placementMode: z.enum(["stacked", "absolute"]),
  nameBaselineFromBottomPt: z.number(),
  nivoBaselineFromBottomPt: z.number(),
  dateBaselineFromBottomPt: z.number(),
  imamBaselineFromBottomPt: z.number(),
  nameXFromLeftPt: z.number().nullable().optional(),
  nivoXFromLeftPt: z.number().nullable().optional(),
  dateXFromLeftPt: z.number().nullable().optional(),
  imamXFromLeftPt: z.number().nullable().optional(),
  lineHeightFactor: z.number().positive(),
  gapAfterNamePt: z.number(),
  gapAfterNivoPt: z.number(),
  nameFontSize: z.number().positive().max(200),
  nivoFontSize: z.number().positive().max(200),
  dateFontSize: z.number().positive().max(200),
  imamFontSize: z.number().positive().max(200),
  minSideMarginPt: z.number(),
  nameFontStyle: z.enum(["SANS", "SCRIPT"]).optional(),
  nameColor: diplomaRgbSchema,
  nivoColor: diplomaRgbSchema,
  dateColor: diplomaRgbSchema,
  imamColor: diplomaRgbSchema,
});

export const communityDiplomaSettingsPayloadSchema = z.object({
  layout: communityDiplomaTextLayoutSchema,
  defaultImamLine: z.union([z.string(), z.null()]).optional(),
});

export type CommunityDiplomaSettingsPayload = z.infer<typeof communityDiplomaSettingsPayloadSchema>;
