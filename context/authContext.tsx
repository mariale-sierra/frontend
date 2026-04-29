import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getToken as getStoredToken,
  getUserId as getStoredUserId,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '../services/auth/auth.service';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, username: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const [storedToken, storedUserId] = await Promise.all([getStoredToken(), getStoredUserId()]);
      setToken(storedToken);
      setUserId(storedUserId);
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginService(email, password);
    setToken(result?.accessToken ?? (await getStoredToken()));
    setUserId(result?.user?.id ?? (await getStoredUserId()));
    return result;
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const result = await registerService(email, username, password);
    setToken(result?.accessToken ?? (await getStoredToken()));
    setUserId(result?.user?.id ?? (await getStoredUserId()));
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setToken(null);
    setUserId(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      userId,
      isAuthenticated: Boolean(token),
      isRestoring,
      login,
      register,
      logout,
      restoreSession,
    }),
    [token, userId, isRestoring, login, register, logout, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
