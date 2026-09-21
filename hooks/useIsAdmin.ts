import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getMe } from '../services/user/user.service';

/**
 * Bloque 1 — whether the session user is a global platform admin
 * (`is_admin`, only present on GET /users/me). Deliberately not added to
 * AuthContext's own state (token/userId/username) — that context is the
 * session's identity, populated eagerly on every app start; admin status is
 * a permission check only the handful of admin-gated screens need, fetched
 * on demand instead.
 */
export function useIsAdmin(): boolean {
  const { isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    getMe()
      .then((user) => {
        if (active) setIsAdmin(Boolean(user.is_admin));
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return isAdmin;
}
