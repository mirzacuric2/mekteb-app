import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/card";
import { LanguageSwitcher } from "../../components/common/language-switcher";
import { MANAGEMENT_PAGE_CARD_CLASSNAME } from "../common/components/entity-list-toolbar";
import { cn } from "../../lib/utils";
import i18n from "../../i18n";
import { normalizeUserUiLanguage } from "../users/user-preferred-language";
import { usePatchMeLanguage } from "./use-patch-me-language";

export function SettingsPanel() {
  const { t } = useTranslation();
  const patchLanguage = usePatchMeLanguage({ successToast: true });

  return (
    <Card className={cn(MANAGEMENT_PAGE_CARD_CLASSNAME, "flex flex-col gap-6 p-5 sm:p-6")}>
      <div>
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{t("settingsPageTitle")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("settingsPageSubtitle")}</p>
      </div>

      <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">{t("settingsLanguageSectionTitle")}</h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">{t("settingsLanguageSectionDescription")}</p>
        <div className="mt-4 max-w-md">
          <LanguageSwitcher
            value={normalizeUserUiLanguage(i18n.language)}
            onChange={(language) => {
              void i18n.changeLanguage(language);
              patchLanguage.mutate(language);
            }}
            fullWidth
          />
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-border bg-slate-50/80 p-4">
        <h2 className="text-sm font-semibold text-slate-700">{t("settingsComingSoonTitle")}</h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">{t("settingsComingSoonDescription")}</p>
      </section>
    </Card>
  );
}
