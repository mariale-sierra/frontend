import React from 'react';
import { ErrorNotification } from './errorNotification';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';

/**
 * Provider component for error notifications.
 * Add this to your root layout to enable error notifications throughout your app.
 */
export function ErrorNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const visible = useErrorNotificationStore((state) => state.visible);
  const config = useErrorNotificationStore((state) => state.config);
  const hide = useErrorNotificationStore((state) => state.hide);

  return (
    <>
      {children}
      <ErrorNotification visible={visible} config={config} onDismiss={hide} />
    </>
  );
}
