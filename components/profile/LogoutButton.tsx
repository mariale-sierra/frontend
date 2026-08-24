import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Card } from '../ui/card';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { ConfirmationPopup } from '../ui/confirmationPopup';
import { Row } from '../layout/row';
import { useAuth } from '../../hooks/useAuth';

/**
 * Settings-style logout row: a subtle tappable card (icon + label + chevron)
 * that confirms via the shared ConfirmationPopup before signing out. Lives
 * on the edit-profile screen so "configuration" is the single place session
 * management happens, instead of a standalone danger button on the profile tab.
 */
export function LogoutButton() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <Card
        variant="basic"
        radius="medium"
        onPress={() => setConfirmVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={t('profile.logoutButtonA11y')}
      >
        <Row justify="space-between" align="center">
          <Row gap="sm" align="center">
            <Icon name="log-out-outline" size={20} color={colors.error} />
            <Text variant="body" style={styles.label}>
              {t('profile.logoutButton')}
            </Text>
          </Row>
          <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.paper, 0.3)} />
        </Row>
      </Card>

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

const styles = StyleSheet.create({
  label: {
    color: colors.error,
  },
});
