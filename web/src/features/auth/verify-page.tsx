import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { AuthHeroPanel } from "./auth-hero-panel";
import { VerifyAccountCard } from "./verify-account-card";

export function VerifyPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);

  return (
    <main className="flex min-h-full w-full flex-col overflow-x-hidden bg-white lg:min-h-screen lg:flex-row lg:overflow-visible">
      <AuthHeroPanel title={t("title")} subtitle={t("verifyHeroSubtitle")} />
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:px-10 sm:py-10 lg:min-h-0 lg:py-16">
        <VerifyAccountCard token={token} />
      </div>
    </main>
  );
}
