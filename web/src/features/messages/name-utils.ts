function normalizeNamePart(value: string | null | undefined) {
  return (value || "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatPersonName(firstName: string | null | undefined, lastName: string | null | undefined) {
  const first = normalizeNamePart(firstName);
  const last = normalizeNamePart(lastName);
  const fullName = [first, last].filter(Boolean).join(" ").trim();
  return fullName || "Unknown";
}
