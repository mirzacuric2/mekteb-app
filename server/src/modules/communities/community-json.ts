import type { Prisma } from "@prisma/client";

export const COMMUNITY_JSON_OMIT = {
  diplomaTemplatePdf: true,
} satisfies Prisma.CommunityOmit;

export function withCommunityDiplomaFlags<T extends { diplomaTemplateUpdatedAt: Date | null }>(
  row: T
): T & { hasCustomDiplomaTemplate: boolean } {
  return {
    ...row,
    hasCustomDiplomaTemplate: Boolean(row.diplomaTemplateUpdatedAt),
  };
}
