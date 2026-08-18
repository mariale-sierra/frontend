import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { UserAvatar } from '../../ui/userAvatar';
import { colors, spacing } from '../../../constants/theme';
import type { ChallengeParticipantContract } from '../../../types/challenge';

type Props = {
  participants: ChallengeParticipantContract[];
  loading?: boolean;
};

/**
 * Horizontal avatar row of everyone in the challenge. Tapping a participant
 * opens their public profile (/profile/[userId], which already has the
 * Follow button and their posts) — this is the entry point that was
 * missing: there was no way to discover and follow another challenge
 * member from anywhere in the app.
 */
export default function ChallengeParticipantsList({ participants, loading }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  if (loading || participants.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.title}>
        {t('challenges.participantsTitle')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {participants.map((participant) => (
          <Pressable
            key={participant.id}
            onPress={() => router.push(`/profile/${participant.id}`)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challenges.participantA11y', { name: participant.username })}
          >
            <UserAvatar username={participant.username} size={52} />
            <Text variant="caption" numberOfLines={1} style={styles.username}>
              {participant.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  item: {
    alignItems: 'center',
    width: 64,
    gap: spacing.xxs,
  },
  username: {
    color: colors.textPrimary,
    opacity: 0.85,
    maxWidth: 64,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
