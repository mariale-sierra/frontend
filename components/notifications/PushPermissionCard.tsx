import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';
import { Row } from '../layout/row';
import { colors, radius, spacing } from '../../constants/theme';
import type { PushPermissionState } from '../../services/notifications/pushNotifications';

interface PushPermissionCardProps {
  state: PushPermissionState;
  busy?: boolean;
  onEnable: () => void;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

/**
 * The contextual "turn on notifications" ask, shown inside the inbox (the
 * moment the user is already looking at notifications) instead of on app
 * start. When the OS no longer allows the prompt it offers Settings instead,
 * so a tap can never re-trigger a denied prompt in a loop.
 */
export function PushPermissionCard({
  state,
  busy = false,
  onEnable,
  onOpenSettings,
  onDismiss,
}: PushPermissionCardProps) {
  const { t } = useTranslation();
  const blocked = state === 'blocked';

  return (
    <View style={styles.card}>
      <Row align="flex-start" gap="md">
        <Icon name="notifications-outline" size={22} color={colors.primary} />
        <View style={styles.text}>
          <Text variant="body" weight="bold">
            {t(blocked ? 'notifications.push.blockedTitle' : 'notifications.push.cardTitle')}
          </Text>
          <Text variant="caption" tone="secondary">
            {t(blocked ? 'notifications.push.blockedBody' : 'notifications.push.cardBody')}
          </Text>
        </View>
      </Row>
      <Row justify="flex-end" gap="sm">
        <Button variant="subtle" size="sm" onPress={onDismiss}>
          {t('notifications.push.notNow')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={busy}
          disabled={busy}
          onPress={blocked ? onOpenSettings : onEnable}
        >
          {t(blocked ? 'notifications.push.openSettings' : 'notifications.push.enable')}
        </Button>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.base,
    gap: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
