import { useEffect } from 'react';
import { create } from 'zustand';
import { useAuth } from './useAuth';
import { getMe } from '../services/user/user.service';

/**
 * Shared (not per-component) on purpose: app/accept-terms.tsx must be able
 * to flip it the moment the acceptance is saved. When this lived in the
 * hook's own `useState`, it was only re-fetched when `isAuthenticated`
 * changed — after accepting it stayed `true`, so RootNavigator sent the user
 * straight back to /accept-terms: an endless "accept the terms" loop.
 */
const useTermsStore = create<{ requires: boolean | null }>(() => ({ requires: null }));

/** Called by the accept-terms screen once POST /auth/accept-terms succeeded. */
export function markTermsAccepted() {
  useTermsStore.setState({ requires: false });
}

/**
 * True when the signed-in user never accepted the current Terms / Privacy
 * Policy (GET /users/me -> `requires_terms_acceptance`): accounts created
 * before acceptance existed, or after the published version changed.
 * `null` while still unknown, so callers don't redirect on a guess.
 * Mount it once (RootNavigator); other screens read it with the same hook.
 */
export function useRequiresTermsAcceptance(): boolean | null {
  const { isAuthenticated } = useAuth();
  const requires = useTermsStore((s) => s.requires);

  useEffect(() => {
    if (!isAuthenticated) {
      useTermsStore.setState({ requires: null });
      return;
    }
    let active = true;
    getMe()
      .then((user) => {
        if (active) useTermsStore.setState({ requires: Boolean(user.requires_terms_acceptance) });
      })
      .catch(() => {
        // Don't lock anyone out of the app because a lookup failed.
        if (active) useTermsStore.setState({ requires: false });
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return requires;
}
