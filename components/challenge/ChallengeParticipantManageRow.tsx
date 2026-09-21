import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../ui/iconButton';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { ChallengeParticipantContract } from '../../types/challenge';

// Shared with the row's skeleton, so the one stands in for the other.
export const PARTICIPANT_AVATAR_SIZE = 44;
export const PARTICIPANT_REMOVE_BUTTON_SIZE = 36;
const REMOVE_ICON_SIZE = 18;

interface ChallengeParticipantManageRowProps {
  participant: ChallengeParticipantContract;
  onRemove: () => void;
}

/** Manage-challenge's own participant row (public challenge, owner-only) —
 * same avatar+username shape as FollowListItem, plus a trailing remove
 * button FollowListItem doesn't support. Kept separate rather than adding an
 * optional trailing-action prop to FollowListItem, which is shared by the
 * followers/following screens too.
 *
 * The remove button is a soft `error` chip, not a solid red circle: a solid one on
 * every row of a long list shouts, and removing someone is confirmed in a popup
 * anyway. (The join-request buttons are solid because approve / reject is the whole
 * point of that screen.) */
export function ChallengeParticipantManageRow({ participant, onRemove }: ChallengeParticipantManageRowProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Row align="center" gap="md" style={styles.row}>
      <Pressable
        onPress={() => router.push(`/profile/${participant.id}`)}
        accessibilityRole="button"
        style={styles.identity}
      >
        <Row align="center" gap="md">
          <UserAvatar username={participant.username} size={PARTICIPANT_AVATAR_SIZE} />
          <Text variant="body" weight="bold" numberOfLines={1} style={styles.username}>
            @{participant.username}
          </Text>
        </Row>
      </Pressable>
      <IconButton
        name="person-remove-outline"
        size={PARTICIPANT_REMOVE_BUTTON_SIZE}
        iconSize={REMOVE_ICON_SIZE}
        iconColor={colors.error}
        onPress={onRemove}
        style={styles.removeButton}
        accessibilityLabel={t('challengeProgress.removeParticipantA11y')}
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.xs,
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    flex: 1,
  },
  // A circle: `big` is more than half of the size, which is a round corner.
  removeButton: {
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.error, fillOpacity.chip),
  },
});
