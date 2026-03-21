import { cloneDefaultDiplomaLayout, type DiplomaTextLayout } from "../../diplomas/diploma-layout";
import { communityDiplomaTextLayoutSchema } from "./community-diploma-schema";

export function mergeCommunityDiplomaLayout(saved: unknown): DiplomaTextLayout {
  const base = cloneDefaultDiplomaLayout();
  if (saved === null || saved === undefined) return base;
  const parsed = communityDiplomaTextLayoutSchema.safeParse(saved);
  if (!parsed.success) return base;
  return { ...base, ...parsed.data };
}
