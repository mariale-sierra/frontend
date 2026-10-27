import { memo, useId } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { challengeCardText } from '../card/challengeCardText';
import { ChallengeCard } from '../card/ChallengeCard';
import { ChallengeCardAuthor } from '../card/ChallengeCardAuthor';
import { LoadingImage } from '../../ui/loadingImage';
import type { ExploreChallengeCardProps } from './challengeListSections';
import { colors, fillOpacity, radius, shadows, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { formatCount } from '../../../utils/format';
import { getChallengeAccentColor } from '../../../services/adapters/challengeState';

/**
 * Challenges-Browse card, glow design, on the shared `ChallengeCard` (Sprint 10
 * mockups, one with a photo and one without):
 *
 *  - top: the title, then the author ("By @name" with their avatar);
 *  - bottom: "30 days" and the member count as badges, and the "Join ›" pill
 *    filled with the activity color on the right;
 *  - with an approved challenge photo, the photo covers the card's right side
 *    behind the content and fades out to the left into the card itself, so the
 *    text stays readable — that card has no activity-color glow, it is plain
 *    `ink`, so the fade has no seam; without a photo, it is the card with the
 *    activity color's glow.
 *
 * Same props and logic as the classic `ExploreChallengeCard` — only the visuals
 * differ.
 */
export const ExploreChallengeCardV2 = memo(function ExploreChallengeCardV2({
  challenge,
  onPress,
  onLongPress,
}: ExploreChallengeCardProps) {
  const { t } = useTranslation();
  // Activity Color System v2 — falls back to colors.primary when this
  // challenge has no dominant category yet.
  const accentColor = getChallengeAccentColor(challenge.dominantActivityCategory);
  const photoUrl = challenge.imageUrl;

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ChallengeCard
        accentColor={accentColor}
        // No `glowRecipe`: the Mine cards' plain glow, the half-moon of the
        // activity color from the bottom edge (covered by the photo when there is one).
        top={null}
        roomy
        title={challenge.title}
        titleLines={1}
        background={photoUrl ? <CardPhoto uri={photoUrl} /> : undefined}
        belowSubtitle={challenge.author ? <ChallengeCardAuthor author={challenge.author} size="lg" bold={false} /> : null}
        footer={
          <View style={styles.footer}>
            <View style={styles.stats}>
              <View style={styles.statBadge} testID="explore-card-days">
                <Icon name="calendar-outline" size={STAT_ICON_SIZE} color={colors.paper} />
                <Text variant="label" weight="bold" style={challengeCardText.paper}>
                  {t('challenges.durationDaysLabel', { count: challenge.durationDays })}
                </Text>
              </View>
              <View
                style={styles.statBadge}
                accessible
                accessibilityLabel={t('challenges.membersCount', { count: formatCount(challenge.membersCount) })}
                testID="explore-card-members"
              >
                <Icon name="people-outline" size={STAT_ICON_SIZE} color={colors.paper} />
                <Text variant="label" weight="bold" style={challengeCardText.paper}>
                  {formatCount(challenge.membersCount)}
                </Text>
              </View>
            </View>
            {/* Looks like a button; the whole card is the press target, and it
                opens the challenge, where joining happens. */}
            <View style={[styles.joinPill, { backgroundColor: accentColor }]} testID="explore-card-join">
              <Text variant="body" weight="bold" style={styles.joinText}>
                {t('challenges.join')}
              </Text>
              <Icon name="chevron-forward" size={18} color={colors.ink} />
            </View>
          </View>
        }
      />
    </Pressable>
  );
});

/** The approved photo on the card's right side, fading out to the left into the
 * card's own `ink` (where the text is) — the Sprint 10 mockup. */
function CardPhoto({ uri }: { uri: string }) {
  const gradientId = useId();
  return (
    // A plain `ink` card under the photo: it covers the activity color's glow, so
    // the photo fades into black with no seam (the glow is for cards without one).
    <View style={styles.photoBase} testID="explore-card-photo-base">
      <View style={styles.photoArea} testID="explore-card-photo">
        {/* A spinner on the skeleton fill while it loads, under the fade. */}
        <LoadingImage uri={uri} style={StyleSheet.absoluteFill} testID="explore-card-cover-image" />
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              {/* Solid `ink` at its left edge, so it melts into the card with no seam. */}
              <Stop offset="0" stopColor={colors.ink} stopOpacity={1} />
              <Stop offset={SCRIM_MID_AT} stopColor={colors.ink} stopOpacity={SCRIM_MID} />
              <Stop offset="1" stopColor={colors.ink} stopOpacity={SCRIM_RIGHT} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
    </View>
  );
}

const STAT_ICON_SIZE = 16;
// How much of the card the photo covers, from the right edge.
const PHOTO_WIDTH = '70%';
// The fade over the photo: fully `ink` at its left edge, half by SCRIM_MID_AT,
// and only a light dim at the right edge.
const SCRIM_MID_AT = 0.45;
const SCRIM_MID = 0.45;
const SCRIM_RIGHT = 0.15;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  photoBase: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.ink,
  },
  photoArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PHOTO_WIDTH,
  },
  // The badges on the left, Join on the right, along the bottom.
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  // A badge: the translucent `paper` fill of Button's `subtle` variant, an icon and a label.
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
    borderRadius: radius.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  // "Join": a pill in the activity color, `ink` on it, as activity colors pair with.
  joinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.lg,
    paddingRight: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.big,
    ...shadows.md,
  },
  joinText: {
    color: colors.ink,
    opacity: 1,
  },
});
