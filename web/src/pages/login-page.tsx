import { Navigate } from "react-router-dom";
import { LoginForm } from "../features/auth/login-form";
import { useSession } from "../features/auth/session-context";

export function LoginPage() {
  const { ready, session, login } = useSession();
  if (!ready) return null;
  if (session) return <Navigate to="/app/posts" replace />;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <LoginForm onSuccess={(data) => login(data.token, data.refreshToken, data.user)} />
    </main>
  );
}
