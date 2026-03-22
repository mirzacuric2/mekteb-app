import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, setAuthToken } from "../../api";
import { AxiosError, InternalAxiosRequestConfig } from "axios";
import i18n from "../../i18n";
import { SessionUser } from "../../types";
import { userPreferredLanguageFromApi } from "../users/user-preferred-language";
import { sessionUserFromAuthProfile, type AuthProfileResponse } from "./map-auth-profile";

type SessionData = { token: string; refreshToken: string; user: SessionUser };
type Session = SessionData | null;
type SessionContextValue = {
  ready: boolean;
  session: Session;
  login: (token: string, refreshToken: string, user: SessionUser) => void;
  logout: () => void;
  mergeSessionUser: (partial: Partial<SessionUser>) => void;
};

const storageKey = "mekteb-session";
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(null);
  const [ready, setReady] = useState(false);
  const profileHydratedTokenRef = useRef<string | null>(null);
  const clearSession = useCallback(() => {
    profileHydratedTokenRef.current = null;
    setSession(null);
    setAuthToken(undefined);
    localStorage.removeItem(storageKey);
  }, []);

  const mergeSessionUser = useCallback((partial: Partial<SessionUser>) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next: SessionData = { ...prev, user: { ...prev.user, ...partial } };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
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

  useEffect(() => {
    if (!ready || !session?.user.preferredLanguage) return;
    const ui = userPreferredLanguageFromApi(session.user.preferredLanguage);
    const current = i18n.language?.split("-")[0]?.toLowerCase() ?? "";
    if (current === ui) return;
    void i18n.changeLanguage(ui);
  }, [ready, session?.user.preferredLanguage]);

  useEffect(() => {
    if (!ready || !session?.token) return;
    if (session.user.preferredLanguage !== undefined && session.user.preferredLanguage !== null) return;
    if (profileHydratedTokenRef.current === session.token) return;

    const tokenAtFetch = session.token;
    profileHydratedTokenRef.current = tokenAtFetch;

    api
      .get<AuthProfileResponse>("/auth/me")
      .then(({ data }) => {
        const user = sessionUserFromAuthProfile(data);
        setSession((prev) => {
          if (!prev || prev.token !== tokenAtFetch) return prev;
          const next: SessionData = { ...prev, user: { ...prev.user, ...user } };
          localStorage.setItem(storageKey, JSON.stringify(next));
          return next;
        });
        void i18n.changeLanguage(userPreferredLanguageFromApi(user.preferredLanguage));
      })
      .catch(() => {
        /* Keep ref so we do not retry in a loop; user can refresh or sign in again. */
      });
  }, [ready, session?.token, session?.user.preferredLanguage]);

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
      mergeSessionUser,
    }),
    [clearSession, mergeSessionUser, ready, session]
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
