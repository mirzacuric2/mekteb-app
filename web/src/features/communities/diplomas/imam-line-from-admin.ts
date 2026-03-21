import { formatPersonName } from "../../messages/name-utils";
import type { CommunityAdminRecord } from "../types";

function normalizePart(value: string | null | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

export function formatDiplomaImamLineFromAdmin(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string {
  const f = normalizePart(firstName);
  const l = normalizePart(lastName);
  if (!f && !l) return "";
  if (!l) return f;
  if (!f) return l;
  return `${f} ef. ${l}`;
}

export function pickPrimaryCommunityAdmin(
  users: CommunityAdminRecord[] | undefined
): CommunityAdminRecord | null {
  if (!users?.length) return null;
  const sorted = [...users].sort((a, b) =>
    formatPersonName(a.firstName, a.lastName).localeCompare(formatPersonName(b.firstName, b.lastName), undefined, {
      sensitivity: "base",
    })
  );
  return sorted[0] ?? null;
}

export function formatDiplomaImamLineFromPrimaryAdmin(users: CommunityAdminRecord[] | undefined): string {
  const admin = pickPrimaryCommunityAdmin(users);
  if (!admin) return "";
  return formatDiplomaImamLineFromAdmin(admin.firstName, admin.lastName);
}
