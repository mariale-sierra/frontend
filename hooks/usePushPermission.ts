import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { storage } from '../utils/storage';
import {
  getPushPermissionState,
  openNotificationSettings,
  PUSH_PROMPT_DISMISSED_KEY,
  requestPushPermission,
  syncPushToken,
  type PushPermissionState,
} from '../services/notifications/pushNotifications';

/**
 * Push permission for the in-app ask (inbox card, settings row). Re-checked
 * when the app comes back to the foreground — the usual way back from the
 * system Settings — and registers the token if it was turned on there.
 */
export function usePushPermission() {
  const [state, setState] = useState<PushPermissionState | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const check = useCallback(async () => {
    const next = await getPushPermissionState();
    setState((previous) => {
      if (next === 'granted' && previous !== null && previous !== 'granted') {
        void syncPushToken();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void check();
    storage
      .getItem(PUSH_PROMPT_DISMISSED_KEY)
      .then((value) => setDismissed(value === '1'))
      .catch(() => setDismissed(false));
    const sub = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') void check();
    });
    return () => sub.remove();
  }, [check]);

  const enable = useCallback(async () => {
    setRequesting(true);
    try {
      setState(await requestPushPermission());
    } finally {
      setRequesting(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    storage.setItem(PUSH_PROMPT_DISMISSED_KEY, '1').catch(() => undefined);
  }, []);

  const showCard =
    !dismissed && (state === 'undetermined' || state === 'denied' || state === 'blocked');

  return {
    state,
    showCard,
    requesting,
    enable,
    dismiss,
    openSettings: openNotificationSettings,
  };
}
