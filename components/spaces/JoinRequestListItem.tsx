import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';

const AVATAR_SIZE = 48;
const BUTTON_SIZE = 40;
const BUTTON_ICON_SIZE = 18;

interface JoinRequestListItemProps {
  /** Structural, not a Space's or a challenge's request contract: both have this `user`. */
  request: {
    user: { username: string; displayName: string | null; profileImageUrl: string | null };
  };
  onApprove: () => void;
  onReject: () => void;
  /** What a screen reader says for each button — the row is shared by Spaces and
   * challenges, so it does not know whose copy to use. */
  approveA11yLabel: string;
  rejectA11yLabel: string;
  /** Which action (if any) is in flight for this row — disables both
   * buttons so a double-tap can't send two approve/reject calls. */
  pendingAction?: 'approve' | 'reject' | null;
}

/** Matches wireframe Chats-47E: avatar + username, a red ✕ (reject) and a
 * green ✓ (approve) circular button. One row for every join-request list: a private
 * Space's (Chats-47E) and a private challenge's. */
export function JoinRequestListItem({
  request,
  onApprove,
  onReject,
  approveA11yLabel,
  rejectA11yLabel,
  pendingAction = null,
}: JoinRequestListItemProps) {
  const { user } = request;
  const name = user.displayName ?? `@${user.username}`;
  const isBusy = pendingAction !== null;

  return (
    <Row align="center" gap="md" style={styles.row}>
      <UserAvatar username={user.username} imageUrl={user.profileImageUrl} size={AVATAR_SIZE} />
      <Text variant="body" weight="bold" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
      <Pressable
        onPress={onReject}
        disabled={isBusy}
        style={[styles.iconButton, styles.rejectButton, isBusy && styles.busy]}
        accessibilityRole="button"
        accessibilityLabel={rejectA11yLabel}
      >
        {pendingAction === 'reject' ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Icon name="close-outline" size={BUTTON_ICON_SIZE} color={colors.ink} />
        )}
      </Pressable>
      <Pressable
        onPress={onApprove}
        disabled={isBusy}
        style={[styles.iconButton, styles.approveButton, isBusy && styles.busy]}
        accessibilityRole="button"
        accessibilityLabel={approveA11yLabel}
      >
        {pendingAction === 'approve' ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Icon name="checkmark-outline" size={BUTTON_ICON_SIZE} color={colors.ink} />
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
  // A circle: `big` is more than half of the size, which is a round corner.
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  // Both buttons dim while one of them is working: the loading-state dim of the scale.
  busy: {
    opacity: fillOpacity.dim,
  },
});
