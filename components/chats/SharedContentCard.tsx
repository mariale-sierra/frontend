import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/userAvatar';
import { Row } from '../layout/row';
import { HashtagText } from '../social/HashtagText';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getChallengeAccentColor, parseActivityType } from '../../services/adapters/challengeState';
import type { SharedChallengePreviewContract, SharedPostPreviewContract } from '../../types/chat';

const CARD_WIDTH = 220;

/**
 * A post or challenge shared inside a 1:1 message (Sprint 10, B5), drawn as
 * a small tappable card in the bubble. The backend already resolved each
 * preview for THIS viewer — `available: false` (deleted, hidden, or a post
 * they aren't allowed to see) renders a muted placeholder, never content.
 */
export function SharedPostCard({ post }: { post: SharedPostPreviewContract }) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!post.available || !post.author) {
    return <UnavailableCard label={t('chats.sharedPostUnavailable')} />;
  }

  const author = post.author;
  const authorName = author.displayName || `@${author.username}`;

  // There's no single-post screen; a shared post opens its author's profile,
  // where the post lives in their grid.
  return (
    <Pressable
      onPress={() => router.push(`/profile/${author.id}`)}
      accessibilityRole="button"
      accessibilityLabel={t('chats.openSharedPostA11y', { name: authorName })}
      style={styles.card}
      testID="shared-post-card"
    >
      <Row gap="sm" align="center" justify="flex-start" style={styles.cardHeader}>
        <UserAvatar username={author.username} imageUrl={author.profileImageUrl} size={24} />
        <Text variant="caption" weight="bold" numberOfLines={1} style={styles.flexText}>
          {authorName}
        </Text>
      </Row>
      <View style={styles.photo}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Icon name="image-outline" size={32} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        )}
      </View>
      {post.caption ? (
        <HashtagText variant="caption" numberOfLines={2} style={styles.caption}>
          {post.caption}
        </HashtagText>
      ) : null}
    </Pressable>
  );
}

export function SharedChallengeCard({ challenge }: { challenge: SharedChallengePreviewContract }) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!challenge.available || !challenge.name) {
    return <UnavailableCard label={t('chats.sharedChallengeUnavailable')} />;
  }

  const accent = getChallengeAccentColor(parseActivityType(challenge.dominantActivityCategory));

  return (
    <Pressable
      onPress={() => router.push(`/challenge/${challenge.id}`)}
      accessibilityRole="button"
      accessibilityLabel={t('chats.openSharedChallengeA11y', { name: challenge.name })}
      style={styles.card}
      testID="shared-challenge-card"
    >
      <View style={[styles.challengeBand, { backgroundColor: accent }]}>
        <Icon name="trophy-outline" size={18} color={colors.ink} />
        <Text variant="caption" weight="bold" style={styles.bandLabel}>
          {t('chats.sharedChallengeLabel')}
        </Text>
      </View>
      <View style={styles.challengeBody}>
        <Text variant="body" weight="bold" numberOfLines={2}>
          {challenge.name}
        </Text>
        {challenge.description ? (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {challenge.description}
          </Text>
        ) : null}
        <Text variant="caption" tone="secondary">
          {[
            challenge.durationDays != null ? t('chats.sharedChallengeDays', { count: challenge.durationDays }) : null,
            challenge.membersJoined != null
              ? t('chats.sharedChallengeMembers', { count: challenge.membersJoined })
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

function UnavailableCard({ label }: { label: string }) {
  return (
    <Row gap="sm" align="center" justify="flex-start" style={[styles.card, styles.unavailable]}>
      <Icon name="eye-off-outline" size={18} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      <Text variant="caption" tone="secondary" style={styles.flexText}>
        {label}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radius.medium,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  flexText: {
    flex: 1,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: withAlpha(colors.paper, fillOpacity.placeholder),
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  caption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  challengeBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  // Custom color on `Text` needs `opacity: 1` (see components/ui/text.tsx).
  bandLabel: {
    color: colors.ink,
    opacity: 1,
  },
  challengeBody: {
    gap: spacing.xs,
    padding: spacing.sm,
  },
  unavailable: {
    padding: spacing.md,
  },
});
