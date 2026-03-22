import { handbookRegistryBs } from "./bs";
import { handbookRegistryEn } from "./en";
import { handbookRegistrySv } from "./sv";
import type { HandbookLocaleRegistry } from "../types";

export const handbookLocales: Record<"en" | "sv" | "bs", HandbookLocaleRegistry> = {
  en: handbookRegistryEn,
  sv: handbookRegistrySv,
  bs: handbookRegistryBs,
};
