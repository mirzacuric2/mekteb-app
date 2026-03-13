import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

export function VerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => params.get("token") || "", [params]);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const verify = useMutation({
    mutationFn: async () => (await api.post("/auth/verify", { token, password })).data,
    onSuccess: () => {
      setSuccessMessage("Account verified. You can now login.");
      setTimeout(() => navigate("/login"), 1200);
    },
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await verify.mutateAsync();
  };

  return (
    <main className="mx-auto max-w-6xl p-6">
      <Card className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Verify account</h1>
        <p className="text-sm text-slate-600">
          Set your password to activate the invited account.
        </p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="text-sm">Token</label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} />
          <label className="text-sm">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
          />
          <Button className="w-full" type="submit" disabled={!token || password.length < 8 || verify.isPending}>
            Verify account
          </Button>
        </form>
        {verify.isError ? <p className="text-sm text-red-600">Verification failed.</p> : null}
        {successMessage ? <p className="text-sm text-green-700">{successMessage}</p> : null}
      </Card>
    </main>
  );
}
