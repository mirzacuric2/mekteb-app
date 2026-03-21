import type { Prisma } from "@prisma/client";

/** Never expose raw PDF bytes on standard community JSON responses. */
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
