import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../../api";
import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { SessionUser } from "../../types";

type SessionData = { token: string; refreshToken: string; user: SessionUser };
type Session = SessionData | null;
type SessionContextValue = {
  ready: boolean;
  session: Session;
  login: (token: string, refreshToken: string, user: SessionUser) => void;
  logout: () => void;
};

const storageKey = "mekteb-session";
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);
  const clearSession = useCallback(() => {
    setSession(null);
    setAuthToken(undefined);
    localStorage.removeItem(storageKey);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      setReady(true);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Session;
      if (parsed?.token && parsed.refreshToken) {
        setSession(parsed);
        setAuthToken(parsed.token);
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    } finally {
      setReady(true);
    }
  }, [clearSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      ready,
      session,
      login: (token, refreshToken, user) => {
        const next = { token, refreshToken, user };
        setSession(next);
        setAuthToken(token);
        localStorage.setItem(storageKey, JSON.stringify(next));
      },
      logout: clearSession,
    }),
    [clearSession, ready, session]
  );

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        const status = error.response?.status;
        if (!originalRequest || status !== 401) throw error;
        if (originalRequest.url?.includes("/auth/refresh") || originalRequest._retry) throw error;
        if (!session?.refreshToken) {
          clearSession();
          throw error;
        }

        originalRequest._retry = true;
        try {
          const refreshResponse = await api.post<SessionData>("/auth/refresh", {
            refreshToken: session.refreshToken,
          });
          const next = refreshResponse.data;
          setSession(next);
          setAuthToken(next.token);
          localStorage.setItem(storageKey, JSON.stringify(next));
          originalRequest.headers.Authorization = `Bearer ${next.token}`;
          return api.request(originalRequest);
        } catch (refreshError) {
          clearSession();
          throw refreshError;
        }
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [clearSession, session?.refreshToken]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
