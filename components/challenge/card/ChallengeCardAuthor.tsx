import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { UserAvatar } from '../../ui/userAvatar';
import { spacing } from '../../../constants/theme';
import type { ChallengeAuthorViewModel } from '../list/challengeListSections';

const AVATAR_SIZE = 18;

/**
 * "by @username" — who made this challenge. Shown on the Explore cards, both
 * designs (`ExploreChallengeCard`/`ExploreChallengeCardV2`), next to the
 * member count — the same slot `ChallengeCardMembers` sits in, so this reuses
 * plain `tone="secondary"` rather than `challengeCardText` (the glow card's
 * own full-opacity override): that matches how the subtitle line already
 * renders on both card designs, no per-design styling needed here.
 *
 * `@username`, not the display name: the card is already tight on width, and
 * a username is guaranteed short, unique and non-empty, unlike a display
 * name (which can be unset). Reuses the `byAuthor` i18n string the challenge
 * detail screen's incomplete-data placeholder already defined but never
 * used.
 */
export function ChallengeCardAuthor({ author }: { author: ChallengeAuthorViewModel }) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <UserAvatar username={author.username} imageUrl={author.profileImageUrl} size={AVATAR_SIZE} circle />
      <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.text}>
        {t('challenges.byAuthor', { name: `@${author.username}` })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  text: {
    flexShrink: 1,
  },
});
