import type { SessionUser } from "../../types";
import type { UserPreferredLanguageApi } from "../users/user-preferred-language";

/** Subset of `GET/PATCH /auth/me` used for session state. */
export type AuthProfileResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: SessionUser["role"];
  communityId: string | null;
  preferredLanguage: UserPreferredLanguageApi;
};

export function sessionUserFromAuthProfile(data: AuthProfileResponse): SessionUser {
  return {
    id: data.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    communityId: data.communityId,
    preferredLanguage: data.preferredLanguage,
  };
}
