import { useCallback } from 'react';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { ErrorNotificationConfig } from '../components/ui/errorNotification';

export function useErrorNotification() {
  const { show, hide } = useErrorNotificationStore();

  const showError = useCallback(
    (config: ErrorNotificationConfig | string) => {
      if (typeof config === 'string') {
        show({ message: config });
      } else {
        show(config);
      }
    },
    [show]
  );

  return { showError, hide };
}
