import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getMe } from '../services/user/user.service';

/**
 * True when the signed-in user never accepted the current Terms / Privacy
 * Policy (GET /users/me -> `requires_terms_acceptance`): accounts created
 * before acceptance existed, or after the published version changed.
 * `null` while still unknown, so callers don't redirect on a guess.
 */
export function useRequiresTermsAcceptance(): boolean | null {
  const { isAuthenticated } = useAuth();
  const [requires, setRequires] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setRequires(null);
      return;
    }
    let active = true;
    getMe()
      .then((user) => {
        if (active) setRequires(Boolean(user.requires_terms_acceptance));
      })
      .catch(() => {
        // Don't lock anyone out of the app because a lookup failed.
        if (active) setRequires(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return requires;
}
