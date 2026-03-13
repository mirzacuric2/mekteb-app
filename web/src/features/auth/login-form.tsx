import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api } from "../../api";
import { LoginResponse } from "../../types";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

type Props = {
  onSuccess: (data: LoginResponse) => void;
};

export function LoginForm({ onSuccess }: Props) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("mekteb.app@gmail.com");
  const [password, setPassword] = useState("SuperAdmin1234!");

  const mutation = useMutation({
    mutationFn: async () => (await api.post<LoginResponse>("/auth/login", { email, password })).data,
    onSuccess,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await mutation.mutateAsync();
  };

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-slate-600">Demo: super admin / admin / user from seeded data.</p>
      <form className="space-y-3" onSubmit={submit}>
        <label className="text-sm">{t("email")}</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="text-sm">{t("password")}</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button className="w-full" type="submit" disabled={mutation.isPending}>
          {t("login")}
        </Button>
      </form>
      {mutation.isError ? <p className="text-sm text-red-600">Login failed.</p> : null}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => i18n.changeLanguage("en")}>
          EN
        </Button>
        <Button variant="outline" onClick={() => i18n.changeLanguage("sv")}>
          SV
        </Button>
        <Button variant="outline" onClick={() => i18n.changeLanguage("bs")}>
          BS
        </Button>
      </div>
    </Card>
  );
}
