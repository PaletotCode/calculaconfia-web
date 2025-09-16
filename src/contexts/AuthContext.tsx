"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  type LoginPayload,
  type User,
} from "@/lib/api";
import { extractErrorMessage } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (value: User | null) => void;
  lastError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMe();
      setUser(data);
      setLastError(null);
    } catch (error) {
      setUser(null);
      setLastError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        await apiLogin(payload);
        await refresh();
        setLastError(null);
      } catch (error) {
        const message = extractErrorMessage(error);
        setLastError(message);
        throw new Error(message);
      }
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      setLastError(extractErrorMessage(error));
    } finally {
      setUser(null);
    }
  }, []);

  const setAuthUser = useCallback((value: User | null) => {
    setUser(value);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refresh,
      setUser: setAuthUser,
      lastError,
    }),
    [user, isLoading, login, logout, refresh, setAuthUser, lastError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser utilizado dentro de AuthProvider");
  }
  return context;
}

export { AuthContext };