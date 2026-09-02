import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, spacing } from '../../constants/theme';
import type { SpaceJoinRequestContract } from '../../types/space';

interface JoinRequestListItemProps {
  request: SpaceJoinRequestContract;
  onApprove: () => void;
  onReject: () => void;
  /** Which action (if any) is in flight for this row — disables both
   * buttons so a double-tap can't send two approve/reject calls. */
  pendingAction?: 'approve' | 'reject' | null;
}

/** Matches wireframe Chats-47E: avatar + username, a red ✕ (reject) and a
 * green ✓ (approve) circular button. */
export function JoinRequestListItem({
  request,
  onApprove,
  onReject,
  pendingAction = null,
}: JoinRequestListItemProps) {
  const { t } = useTranslation();
  const { user } = request;
  const name = user.displayName ?? `@${user.username}`;
  const isBusy = pendingAction !== null;

  return (
    <Row align="center" gap="md" style={styles.row}>
      <UserAvatar username={user.username} imageUrl={user.profileImageUrl} size={48} />
      <Text variant="body" weight="bold" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Pressable
        onPress={onReject}
        disabled={isBusy}
        style={[styles.iconButton, styles.rejectButton, isBusy && styles.disabled]}
        accessibilityLabel={t('spaces.rejectA11y')}
      >
        {pendingAction === 'reject' ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Icon name="close-outline" size={18} color={colors.ink} />
        )}
      </Pressable>
      <Pressable
        onPress={onApprove}
        disabled={isBusy}
        style={[styles.iconButton, styles.approveButton, isBusy && styles.disabled]}
        accessibilityLabel={t('spaces.approveA11y')}
      >
        {pendingAction === 'approve' ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Icon name="checkmark-outline" size={18} color={colors.ink} />
        )}
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  disabled: {
    opacity: 0.6,
  },
});
