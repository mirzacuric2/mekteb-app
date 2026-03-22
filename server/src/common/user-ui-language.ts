import { UserPreferredLanguage } from "@prisma/client";
import { z } from "zod";

export const USER_UI_LANGUAGE_VALUES = ["en", "sv", "bs"] as const;
export type UserUiLanguageCode = (typeof USER_UI_LANGUAGE_VALUES)[number];

export const userUiLanguageSchema = z.enum(USER_UI_LANGUAGE_VALUES);

export function userUiLanguageToPrisma(code: UserUiLanguageCode): UserPreferredLanguage {
  const map: Record<UserUiLanguageCode, UserPreferredLanguage> = {
    en: UserPreferredLanguage.EN,
    sv: UserPreferredLanguage.SV,
    bs: UserPreferredLanguage.BS,
  };
  return map[code];
}

export function prismaUserUiLanguageToCode(value: UserPreferredLanguage): UserUiLanguageCode {
  const map: Record<UserPreferredLanguage, UserUiLanguageCode> = {
    [UserPreferredLanguage.EN]: "en",
    [UserPreferredLanguage.SV]: "sv",
    [UserPreferredLanguage.BS]: "bs",
  };
  return map[value];
}
