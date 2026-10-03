import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { UserAvatar } from '../../ui/userAvatar';
import { spacing } from '../../../constants/theme';
import { challengeCardText } from './challengeCardText';
import type { ChallengeAuthorViewModel } from '../list/challengeListSections';

const AVATAR_SIZE = { sm: 18, md: 20 } as const;

interface ChallengeCardAuthorProps {
  author: ChallengeAuthorViewModel;
  /** `sm` (default): a small caption row below the location line — the
   * classic `ExploreChallengeCard`'s placement. `md`: the glow card's
   * footer, where it now stands in for the member count (`ExploreChallengeCardV2`,
   * "same weight and size" as `ChallengeCardMembers`, per explicit request
   * 2026-09-22) — a bigger, bold `label`, matching that component's own text
   * exactly except for color (this stays `paper`, per the separate "I want
   * the text in paper" request; `ChallengeCardMembers` uses `primary`). */
  size?: 'sm' | 'md';
}

/**
 * "by @username" — who made this challenge. Text is plain `paper`, full
 * opacity (`challengeCardText.paper`) per explicit request 2026-09-22 ("I
 * want the text in paper") — was `tone="secondary"` (dimmed), which read too
 * faint next to the location line.
 *
 * `@username`, not the display name: the card is already tight on width, and
 * a username is guaranteed short, unique and non-empty, unlike a display
 * name (which can be unset). Reuses the `byAuthor` i18n string the challenge
 * detail screen's incomplete-data placeholder already defined but never
 * used.
 */
export function ChallengeCardAuthor({ author, size = 'sm' }: ChallengeCardAuthorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      <UserAvatar username={author.username} imageUrl={author.profileImageUrl} size={AVATAR_SIZE[size]} circle />
      <Text
        variant={size === 'md' ? 'label' : 'caption'}
        weight={size === 'md' ? 'bold' : undefined}
        numberOfLines={1}
        style={[challengeCardText.paper, styles.text]}
      >
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
