import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchAuthMe,
  getToken as getStoredToken,
  getUserId as getStoredUserId,
  getUsername as getStoredUsername,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '../services/auth/auth.service';
import { invalidateChallengeProgressCache } from '../hooks/useChallengeProgress';
import { resetSessionStores } from '../store/resetSessionStores';
import { clearQueryCache, setQueryScope } from '../services/cache/queryCache';
import { forgetPushToken, unregisterPushToken } from '../services/notifications/pushNotifications';
import { setSessionExpiredHandler } from '../services/auth/sessionEvents';
import type { LegalConsent } from '../types/auth';

interface AuthContextValue {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (
    email: string,
    username: string,
    password: string,
    consent: LegalConsent,
  ) => Promise<any>;
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
    try {
      let storedToken: string | null = null;
      let storedUserId: string | null = null;
      let storedUsername: string | null = null;
      try {
        [storedToken, storedUserId, storedUsername] = await Promise.all([
          getStoredToken(),
          getStoredUserId(),
          getStoredUsername(),
        ]);
      } catch {
        // Reading stored session data itself failed (e.g. a storage backend
        // that isn't available on this platform) — treat exactly like "no
        // session found" rather than letting this become an unhandled
        // rejection that breaks the rest of app startup.
      }

      if (!storedToken || !storedUserId || !storedUsername) {
        setToken(null);
        setUserId(null);
        setUsername(null);
        return;
      }

      // Cached server data for this user (services/cache) is readable from now on.
      setQueryScope(storedUserId);
      setToken(storedToken);
      setUserId(storedUserId);
      setUsername(storedUsername);

      // Validated in the background, not before the first screen: the app
      // used to show nothing until /auth/me answered (up to the request
      // timeout on a bad connection), even though the stored session and
      // the cached Home/Profile data were already on the device. A token the
      // server rejects (401) still ends the session — the same cleanup as
      // before, just after the first paint instead of before it. Network
      // errors, 5xx, etc. keep the session, as they always did.
      fetchAuthMe().catch(async (error: any) => {
        if (error?.response?.status !== 401) return;
        await logoutService();
        invalidateChallengeProgressCache();
        resetSessionStores();
        await clearQueryCache();
        setQueryScope(null);
        setToken(null);
        setUserId(null);
        setUsername(null);
      });
    } finally {
      setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Any authenticated request answered 401 (token expired, account banned,
  // purged or gone) signs the user out here, and RootNavigator takes them to
  // the login screen. See services/api.ts.
  useEffect(() => {
    setSessionExpiredHandler(async () => {
      await forgetPushToken();
      await logoutService();
      invalidateChallengeProgressCache();
      resetSessionStores();
      await clearQueryCache();
      setQueryScope(null);
      setToken(null);
      setUserId(null);
      setUsername(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Clear any previous session's cached progress before establishing a new one.
    invalidateChallengeProgressCache();
    resetSessionStores();
    const result = await loginService(email, password);
    setQueryScope(result?.user?.id ?? (await getStoredUserId()));
    setToken(result?.accessToken ?? (await getStoredToken()));
    setUserId(result?.user?.id ?? (await getStoredUserId()));
    setUsername(result?.user?.username ?? (await getStoredUsername()));
    return result;
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string, consent: LegalConsent) => {
    invalidateChallengeProgressCache();
    resetSessionStores();
    const result = await registerService(email, username, password, consent);
    setQueryScope(result?.user?.id ?? (await getStoredUserId()));
    setToken(result?.accessToken ?? (await getStoredToken()));
    setUserId(result?.user?.id ?? (await getStoredUserId()));
    setUsername(result?.user?.username ?? (await getStoredUsername()));
    return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    // While the session is still valid: this device stops getting the
    // account's pushes (bounded wait, never blocks the logout).
    await unregisterPushToken();
    await logoutService();
    invalidateChallengeProgressCache();
    resetSessionStores();
    await clearQueryCache();
    setQueryScope(null);
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
