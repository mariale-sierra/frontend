import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getChallengeAccentColor } from '../../services/adapters/challengeState';
import type { LogChallengeQuickPick } from '../../services/adapters/metricsAdapter';

interface ChallengeQuickPickRowProps {
  challenge: LogChallengeQuickPick;
  onPress: () => void;
}

// Local named size constant, same convention as AVATAR_SIZE elsewhere
// (ProfileHeader/StreakGridItem/FriendStreakCard) — not a shared token since
// thumbnail dimensions are inherently per-component, but still a single
// named value rather than a bare number sprinkled through the styles below.
const THUMB_SIZE = 56;

/** One row in the "Log today's progress" bottom sheet. Background is this
 * challenge's own activity accent color (was flat `ink`) — name/day-label
 * text and the placeholder thumb use `ink` for contrast against it. */
export function ChallengeQuickPickRow({ challenge, onPress }: ChallengeQuickPickRowProps) {
  const { t } = useTranslation();
  const dayLabel = t('logMetrics.pickChallenge.dayLabel', { day: challenge.currentDay });
  // Activity Color System v2 — falls back to colors.primary (white) when
  // this challenge has no dominant category yet.
  const accentColor = getChallengeAccentColor(challenge.dominantActivityCategory);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: accentColor }, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {challenge.photoUrl ? (
        <Image source={{ uri: challenge.photoUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Icon name="image-outline" size={26} color={withAlpha(colors.ink, textOpacity.tertiary)} />
        </View>
      )}

      <View style={styles.textColumn}>
        <Text variant="body" size="lg" weight="bold" numberOfLines={1} style={styles.title}>{challenge.name}</Text>
        <Text variant="label" weight="medium" style={styles.dayLabel} numberOfLines={1}>
          {dayLabel}
        </Text>
      </View>

      <Icon name="chevron-forward-outline" size={18} color={withAlpha(colors.ink, textOpacity.secondary)} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.medium,
    // backgroundColor set inline — this challenge's own accent color, see accentColor above.
    padding: spacing.base,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    // Always radius.small for photo/image tiles, regardless of size — see
    // constants/theme.ts's radius token comment.
    borderRadius: radius.small,
    flexShrink: 0,
  },
  thumbPlaceholder: {
    // `ink`@18% — same treatment ChallengeStatusCard uses for its photo
    // panel on a colored background. Was `paper`@20% back when this row's
    // own background was flat `ink`; switched once the row itself became
    // activity-colored, since a light `paper` fill would wash out against it.
    backgroundColor: withAlpha(colors.ink, 0.18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    color: colors.ink,
    opacity: 1,
  },
  dayLabel: {
    color: colors.ink,
    opacity: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
