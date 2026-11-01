import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, loadSession, saveSession, type User } from "@/lib/api";

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadSession()?.user ?? null);

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener("auth:expired", logout);
    return () => window.removeEventListener("auth:expired", logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedIn } = await api.login(email, password);
    saveSession({ token, user: loggedIn });
    setUser(loggedIn);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}