import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { LanguageSwitcher } from "../../components/common/language-switcher";
import { verifyAccountFormSchema, type VerifyAccountFormValues } from "./verify-form-schema";

type Props = {
  token: string;
};

export function VerifyAccountCard({ token }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const passwordId = useId();
  const confirmId = useId();
  const [successMessage, setSuccessMessage] = useState("");

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<VerifyAccountFormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  const verify = useMutation({
    mutationFn: async (password: string) => (await api.post("/auth/verify", { token, password })).data,
    onSuccess: () => {
      setSuccessMessage(t("verifySuccess"));
      setTimeout(() => navigate("/login"), 1200);
    },
  });

  const onSubmit = handleSubmit((values) => {
    clearErrors();
    const parsed = verifyAccountFormSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "password" || field === "confirmPassword") {
          setError(field, { type: "manual", message: issue.message });
        }
      }
      return;
    }
    verify.mutate(parsed.data.password);
  });

  const hasToken = Boolean(token);

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
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{t("verifyFormHeading")}</h2>
          <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{t("verifyCardDescription")}</p>
        </div>
      </div>

      {!hasToken ? (
        <p className="text-center text-sm text-amber-800" role="alert">
          {t("verifyMissingToken")}
        </p>
      ) : (
        <form className="space-y-3 sm:space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5 sm:space-y-2">
            <label htmlFor={passwordId} className="text-sm font-medium text-slate-800">
              {t("password")}
            </label>
            <Input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              placeholder={t("verifyPasswordPlaceholder")}
              className="h-10 sm:h-11"
              {...register("password", {
                onChange: () => clearErrors("password"),
              })}
            />
            {errors.password ? (
              <p className="text-xs text-red-600">{t(errors.password.message as string)}</p>
            ) : null}
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label htmlFor={confirmId} className="text-sm font-medium text-slate-800">
              {t("verifyConfirmPasswordLabel")}
            </label>
            <Input
              id={confirmId}
              type="password"
              autoComplete="new-password"
              className="h-10 sm:h-11"
              {...register("confirmPassword", {
                onChange: () => clearErrors("confirmPassword"),
              })}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-red-600">{t(errors.confirmPassword.message as string)}</p>
            ) : null}
          </div>
          <Button className="h-10 w-full sm:h-11" type="submit" disabled={verify.isPending}>
            {verify.isPending ? t("verifySubmitting") : t("verifySubmit")}
          </Button>
        </form>
      )}

      {verify.isError ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {t("verifyError")}
        </p>
      ) : null}
      {successMessage ? (
        <p className="text-center text-sm text-green-700" role="status">
          {successMessage}
        </p>
      ) : null}

      <div className="space-y-2 border-t border-slate-100 pt-3 sm:space-y-2 sm:pt-5">
        <p className="text-center text-sm text-slate-600">
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("verifyBackToLogin")}
          </Link>
        </p>
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-xs font-medium text-slate-500">{t("language")}</p>
          <LanguageSwitcher
            value={i18n.language as "en" | "sv" | "bs"}
            onChange={(language) => i18n.changeLanguage(language)}
            fullWidth
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
}
