import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { useAuth } from '../../hooks/useAuth';
import { SettingsRow } from './SettingsRow';

/**
 * Settings-style logout row that confirms via the shared ConfirmationPopup
 * before signing out. Lives on the Settings screen (Sprint 10, B2) — the one
 * place for session management — and stays on edit-profile's load-error state
 * as a way out when the profile cannot be read.
 */
export function LogoutButton() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <SettingsRow
        icon="log-out-outline"
        label={t('profile.logoutButton')}
        accessibilityLabel={t('profile.logoutButtonA11y')}
        tone="danger"
        onPress={() => setConfirmVisible(true)}
        testID="settings-logout"
      />

      <ConfirmationPopup
        visible={confirmVisible}
        title={t('profile.logoutConfirmTitle')}
        description={t('profile.logoutConfirmMessage')}
        primaryButton={{
          label: t('profile.logoutButton'),
          variant: 'danger',
          onPress: () => {
            setConfirmVisible(false);
            logout();
          },
        }}
        secondaryButton={{
          label: t('common.actions.back'),
          onPress: () => setConfirmVisible(false),
        }}
        onDismiss={() => setConfirmVisible(false)}
      />
    </>
  );
}
