import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { colors, spacing } from '../../constants/theme';
import type { ChallengeParticipantContract } from '../../types/challenge';

interface ChallengeParticipantManageRowProps {
  participant: ChallengeParticipantContract;
  onRemove: () => void;
  removing?: boolean;
}

/** Manage-challenge's own participant row (public challenge, owner-only) —
 * same avatar+username shape as FollowListItem, plus a trailing remove
 * button FollowListItem doesn't support. Kept separate rather than adding an
 * optional trailing-action prop to FollowListItem, which is shared by the
 * followers/following screens too. */
export function ChallengeParticipantManageRow({
  participant,
  onRemove,
  removing = false,
}: ChallengeParticipantManageRowProps) {
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
          <UserAvatar username={participant.username} size={44} />
          <Text variant="body" weight="bold" numberOfLines={1} style={styles.username}>
            @{participant.username}
          </Text>
        </Row>
      </Pressable>
      <Pressable
        onPress={onRemove}
        disabled={removing}
        style={[styles.removeButton, removing && styles.disabled]}
        accessibilityLabel={t('challengeProgress.removeParticipantA11y')}
      >
        {removing ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Icon name="close-outline" size={18} color={colors.ink} />
        )}
      </Pressable>
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
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.6,
  },
});
