import { z } from "zod";

export const USER_UI_LANGUAGES = ["en", "sv", "bs"] as const;
export type UserUiLanguage = (typeof USER_UI_LANGUAGES)[number];

export const userUiLanguageFormSchema = z.enum(USER_UI_LANGUAGES);

export const USER_PREFERRED_LANGUAGE_API = {
  EN: "EN",
  SV: "SV",
  BS: "BS",
} as const;

export type UserPreferredLanguageApi = (typeof USER_PREFERRED_LANGUAGE_API)[keyof typeof USER_PREFERRED_LANGUAGE_API];

export function userPreferredLanguageFromApi(value: string | undefined | null): UserUiLanguage {
  switch (value) {
    case USER_PREFERRED_LANGUAGE_API.EN:
      return "en";
    case USER_PREFERRED_LANGUAGE_API.SV:
      return "sv";
    case USER_PREFERRED_LANGUAGE_API.BS:
      return "bs";
    default:
      return "en";
  }
}

export function normalizeUserUiLanguage(lang: string): UserUiLanguage {
  const base = lang.split("-")[0]?.toLowerCase() ?? "en";
  if (base === "sv" || base === "bs" || base === "en") return base;
  return "en";
}
