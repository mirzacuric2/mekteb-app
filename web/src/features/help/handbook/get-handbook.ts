import { ROLE, type Role } from "../../../types";
import type { HelpHandbookContent } from "./types";
import { handbookLocales } from "./locales";

const FALLBACK_LANG = "en";

function normalizeHelpLanguage(language: string): keyof typeof handbookLocales {
  const base = language.split("-")[0]?.toLowerCase() ?? FALLBACK_LANG;
  if (base === "sv" || base === "bs") return base;
  return FALLBACK_LANG;
}

export function getHandbookForRole(role: Role | undefined, i18nLanguage: string): HelpHandbookContent | null {
  if (!role) return null;
  const lang = normalizeHelpLanguage(i18nLanguage);
  const registry = handbookLocales[lang] ?? handbookLocales.en;
  const effectiveRole = role === ROLE.USER ? ROLE.PARENT : role;
  return registry[effectiveRole] ?? null;
}
