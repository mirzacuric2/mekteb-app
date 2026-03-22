/** Safe fields returned for the authenticated user (no password hash). */
export const AUTH_ME_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  communityId: true,
  status: true,
  preferredLanguage: true,
  phoneNumber: true,
  ssn: true,
  addressId: true,
  invitedById: true,
  createdAt: true,
  updatedAt: true,
  address: true,
} as const;
