import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SettingsRow } from './SettingsRow';

/** Settings row (same look as LogoutButton) that opens the delete-account screen,
 * where the existing confirmation and password check happen. */
export function DeleteAccountRow() {
  const { t } = useTranslation();

  return (
    <SettingsRow
      icon="trash-outline"
      label={t('deleteAccount.row')}
      accessibilityLabel={t('deleteAccount.rowA11y')}
      tone="danger"
      onPress={() => router.push('/profile/delete-account')}
      testID="settings-delete-account"
    />
  );
}
