import { useEffect, useState } from 'react';
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
import { Skeleton } from '../ui/skeleton';
import { ExploreCard } from '../challenge/list/challengeCards';
import { CHALLENGE_CARD_HEIGHT } from '../challenge/card/ChallengeCard';
import { getChallenge } from '../../services/challenge/challenge.service';
import { toExploreChallengeViewModels } from '../../services/adapters';
import type { ExploreChallengeViewModel } from '../challenge/list/challengeListSections';
import type { SharedChallengePreviewContract, SharedPostPreviewContract } from '../../types/chat';

const CARD_WIDTH = 220;
// A shared challenge is the full Explore card, so it gets more room than a
// post card — still inside the bubble column's 80% of the screen.
const CHALLENGE_CARD_WIDTH = 260;

/** Long-press on the card itself (your own message: delete it). The card's
 * own Pressable takes the touch, so the bubble's long-press never fires on it
 * — a share sent without a comment had no other surface to long-press. */
interface CardActionProps {
  onLongPress?: () => void;
  longPressA11yHint?: string;
}

/**
 * A post or challenge shared inside a 1:1 message (Sprint 9, B5), drawn as
 * a small tappable card in the bubble. The backend already resolved each
 * preview for THIS viewer — `available: false` (deleted, hidden, or a post
 * they aren't allowed to see) renders a muted placeholder, never content.
 */
export function SharedPostCard({
  post,
  onLongPress,
  longPressA11yHint,
}: { post: SharedPostPreviewContract } & CardActionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!post.available || !post.author) {
    return (
      <UnavailableCard
        label={t('chats.sharedPostUnavailable')}
        onLongPress={onLongPress}
        longPressA11yHint={longPressA11yHint}
      />
    );
  }

  const author = post.author;
  const authorName = author.displayName || `@${author.username}`;

  // There's no single-post screen: a shared post opens its author's profile
  // with that post already open in the photo modal (`postId`).
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/profile/[userId]', params: { userId: author.id, postId: post.id } })}
      onLongPress={onLongPress}
      accessibilityHint={onLongPress ? longPressA11yHint : undefined}
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

/**
 * A challenge shared in a chat looks exactly like its card in Explore — the
 * same `ExploreCard` (glow or classic, whichever the app uses), built from
 * the full challenge (GET /challenges/:id: categories, location and author
 * aren't in the message's own preview). Tapping it opens the challenge.
 */
export function SharedChallengeCard({
  challenge,
  onLongPress,
  longPressA11yHint,
}: { challenge: SharedChallengePreviewContract } & CardActionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [card, setCard] = useState<ExploreChallengeViewModel | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!challenge.available) return;
    let active = true;
    getChallenge(challenge.id)
      .then((full) => {
        if (active) setCard(toExploreChallengeViewModels([full])[0] ?? null);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [challenge.id, challenge.available]);

  if (!challenge.available || failed) {
    return (
      <UnavailableCard
        label={t('chats.sharedChallengeUnavailable')}
        onLongPress={onLongPress}
        longPressA11yHint={longPressA11yHint}
      />
    );
  }

  return (
    <View
      style={styles.challengeCard}
      testID="shared-challenge-card"
      accessibilityHint={onLongPress ? longPressA11yHint : undefined}
    >
      {card ? (
        <ExploreCard
          challenge={card}
          onPress={() => router.push(`/challenge/${challenge.id}`)}
          onLongPress={onLongPress}
        />
      ) : (
        <Skeleton height={CHALLENGE_CARD_HEIGHT} radius={radius.big} />
      )}
    </View>
  );
}

function UnavailableCard({ label, onLongPress, longPressA11yHint }: { label: string } & CardActionProps) {
  return (
    <Pressable onLongPress={onLongPress} disabled={!onLongPress} accessibilityHint={longPressA11yHint}>
      <Row gap="sm" align="center" justify="flex-start" style={[styles.card, styles.unavailable]}>
        <Icon name="eye-off-outline" size={18} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        <Text variant="caption" tone="secondary" style={styles.flexText}>
          {label}
        </Text>
      </Row>
    </Pressable>
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
  challengeCard: {
    width: CHALLENGE_CARD_WIDTH,
  },
  unavailable: {
    padding: spacing.md,
  },
});
