export function formatUserOptionLabel(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed user";
  return user.email ? `${fullName} (${user.email})` : fullName;
}

export function formatAddressLine(address: {
  streetLine1?: string | null;
  streetLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  const street = [address.streetLine1, address.streetLine2].filter(Boolean).join(", ");
  const cityLine = [address.postalCode, address.city].filter(Boolean).join(" ");
  const country = address.country?.trim();

  return [street, cityLine, country].filter(Boolean).join(", ");
}
