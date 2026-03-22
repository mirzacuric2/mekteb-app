import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthHeroPanel } from "../features/auth/auth-hero-panel";
import { LoginForm } from "../features/auth/login-form";
import { useSession } from "../features/auth/session-context";

export function LoginPage() {
  const { t } = useTranslation();
  const { ready, session, login } = useSession();
  if (!ready) return null;
  if (session) return <Navigate to="/app/dashboard" replace />;

  return (
    <main className="flex min-h-full w-full flex-col overflow-x-hidden bg-white lg:min-h-screen lg:flex-row lg:overflow-visible">
      <AuthHeroPanel title={t("title")} subtitle={t("loginHeroSubtitle")} />
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:px-10 sm:py-10 lg:min-h-0 lg:py-16">
        <LoginForm onSuccess={(data) => login(data.token, data.refreshToken, data.user)} />
      </div>
    </main>
  );
}
