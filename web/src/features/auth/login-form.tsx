import { FormEvent, useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../api";
import { LoginResponse } from "../../types";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "../../components/common/language-switcher";

type Props = {
  onSuccess: (data: LoginResponse) => void;
};

export function LoginForm({ onSuccess }: Props) {
  const { t, i18n } = useTranslation();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => (await api.post<LoginResponse>("/auth/login", { email, password })).data,
    onSuccess,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync();
  };

  return (
    <Card className="w-full max-w-md space-y-4 border border-slate-200/80 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-sm sm:space-y-6 sm:p-8 lg:p-9">
      <div className="flex flex-col items-center gap-2 text-center sm:gap-4">
        <img
          src="/branding/logo-small.svg"
          alt=""
          width={610}
          height={380}
          className="h-16 w-auto max-w-[min(100%,220px)] sm:h-24 sm:max-w-[min(100%,280px)] lg:h-28 lg:max-w-[min(100%,320px)]"
        />
        <div className="w-full space-y-2 sm:space-y-2.5">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{t("loginFormHeading")}</h2>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{t("loginCardDescription")}</p>
        </div>
      </div>

      <form className="space-y-3 sm:space-y-4" onSubmit={submit} noValidate>
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor={emailId} className="text-sm font-medium text-slate-800">
            {t("email")}
          </label>
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("loginEmailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 sm:h-11"
          />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor={passwordId} className="text-sm font-medium text-slate-800">
            {t("password")}
          </label>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 sm:h-11"
          />
        </div>
        <Button className="h-10 w-full sm:h-11" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t("loginSubmitting") : t("login")}
        </Button>
      </form>
      {mutation.isError ? (
        <p className="text-sm text-red-600" role="alert">
          {t("loginError")}
        </p>
      ) : null}

      <div className="space-y-1.5 border-t border-slate-100 pt-3 sm:space-y-2 sm:pt-5">
        <p className="text-xs font-medium text-slate-500">{t("language")}</p>
        <LanguageSwitcher
          value={i18n.language as "en" | "sv" | "bs"}
          onChange={(language) => i18n.changeLanguage(language)}
          fullWidth
          className="w-full"
        />
      </div>
    </Card>
  );
}
