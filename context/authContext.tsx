import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getToken as getStoredToken,
  getUserId as getStoredUserId,
  getUsername as getStoredUsername,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '../services/auth/auth.service';
import api from '../services/api';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  username: string | null;
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
  const [username, setUsername] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const restoreSession = useCallback(async () => {
    console.log('[auth] restoreSession start');
    try {
      const [storedToken, storedUserId, storedUsername] = await Promise.all([
        getStoredToken(),
        getStoredUserId(),
        getStoredUsername(),
      ]);

      console.log('[auth] token from storage exists:', Boolean(storedToken));

      if (!storedToken || !storedUserId || !storedUsername) {
        setToken(null);
        setUserId(null);
        setUsername(null);
        return;
      }

      console.log('[auth] /auth/me start');
      try {
        await api.get('/auth/me');
        console.log('[auth] /auth/me success');
      } catch (error: any) {
        const status = error?.response?.status;
        console.log('[auth] /auth/me failed status:', status, 'data:', JSON.stringify(error?.response?.data));

        if (status === 401) {
          // Token genuinamente rechazado por el servidor — limpiar sesión
          console.log('[auth] 401 → clearing session');
          await logoutService();
          setToken(null);
          setUserId(null);
          setUsername(null);
          return;
        }

        // Error de red, 5xx, CORS, timeout, etc. — preservar sesión
        // El token sigue en AsyncStorage y el interceptor lo adjuntará en siguientes llamadas
        console.log('[auth] non-401 error → preserving session');
      }

      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);

    } finally {
      console.log('[auth] restoreSession done');
      console.log('[auth] isLoading: false');
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
    setUsername(result?.user?.username ?? (await getStoredUsername()));
    return result;
  }, []);

  const register = useCallback(async (email: string, username: string, password: string) => {
    const result = await registerService(email, username, password);
    setToken(result?.accessToken ?? (await getStoredToken()));
    setUserId(result?.user?.id ?? (await getStoredUserId()));
    setUsername(result?.user?.username ?? (await getStoredUsername()));
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setToken(null);
    setUserId(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      userId,
      username,
       isAuthenticated: Boolean(token && userId && username),
      isRestoring,
      login,
      register,
      logout,
      restoreSession,
    }),
    [token, userId, username, isRestoring, login, register, logout, restoreSession],
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
