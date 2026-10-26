import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { challengeCardText } from '../card/challengeCardText';
import { ChallengeCard } from '../card/ChallengeCard';
import { ChallengeCardAuthor } from '../card/ChallengeCardAuthor';
import { ChallengeCoverTile } from '../card/ChallengeCoverTile';
import type { ExploreChallengeCardProps } from './challengeListSections';
import { colors, fillOpacity, radius, shadows, spacing } from '../../../constants/theme';
import { EXPLORE_COVER_FULL_BLEED } from '../../../constants/challengeCards';
import { withAlpha } from '../../../utils/color';
import { formatCount } from '../../../utils/format';
import { getChallengeAccentColor } from '../../../services/adapters/challengeState';

/** The photo tile's side and tilt (Sprint 10 wireframe: a slightly leaning square). */
const COVER_SIZE = 100;
const COVER_TILT_DEG = 3;
/** EXPLORE_COVER_FULL_BLEED: how wide the edge-to-edge photo is. */
const BLEED_WIDTH = 140;

/**
 * Challenges-Browse card, glow design, on the shared `ChallengeCard` with the
 * Mine cards' glow (the plain half-moon of the activity color from the bottom
 * edge). Layout after the Sprint 10 challenge-photo wireframe:
 *
 *  - left: the title, then right under it the author ("By @name" with their
 *    avatar), then "30 days" and the member count (number + people icon) in a row;
 *  - right: the challenge photo, a rounded square leaning a few degrees — a gray
 *    placeholder with an image icon while there is no approved photo — and the
 *    "Join ›" pill filled with the activity color under it. With
 *    `EXPLORE_COVER_FULL_BLEED` (a Sprint 10 trial) the photo instead covers the
 *    card's whole right side, edge to edge, with the Join pill on top of it.
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

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ChallengeCard
        accentColor={accentColor}
        // No `glowRecipe`: the Mine cards' plain glow, the half-moon of the
        // activity color from the bottom edge.
        top={null}
        roomy
        // No footer: the title, author and stats sit centered in the card's height.
        centered
        title={challenge.title}
        titleLines={2}
        // The author and the member count right under the title (Sprint 10:
        // "N members" no longer sits down by the Join pill).
        belowSubtitle={
          <View style={styles.meta}>
            {challenge.author ? <ChallengeCardAuthor author={challenge.author} size="md" bold={false} /> : null}
            {/* How long it lasts, then the member count as just the number and
                the people icon (Sprint 10). */}
            <View style={styles.stats}>
              <View style={styles.statBadge} testID="explore-card-days">
                <Text variant="caption" weight="bold" style={challengeCardText.paper}>
                  {t('challenges.durationDaysLabel', { count: challenge.durationDays })}
                </Text>
              </View>
              <View
                style={styles.statBadge}
                accessible
                accessibilityLabel={t('challenges.membersCount', { count: formatCount(challenge.membersCount) })}
                testID="explore-card-members"
              >
                <Text variant="caption" weight="bold" style={challengeCardText.paper}>
                  {formatCount(challenge.membersCount)}
                </Text>
                <Icon name="people-outline" size={14} color={colors.paper} />
              </View>
            </View>
          </View>
        }
        footer={null}
        side={
          EXPLORE_COVER_FULL_BLEED ? (
            <View style={styles.bleed}>
              <ChallengeCoverTile
                imageUrl={challenge.imageUrl}
                iconSize={32}
                style={styles.bleedPhoto}
                testID="explore-card-cover"
              />
              {/* On the photo; the whole card is the press target. */}
              <View
                style={[styles.joinPill, styles.joinOverPhoto, { backgroundColor: accentColor }]}
                testID="explore-card-join"
              >
                <Text variant="label" weight="bold" style={styles.joinText}>
                  {t('challenges.join')}
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.ink} />
              </View>
            </View>
          ) : (
            <View style={styles.side}>
              <ChallengeCoverTile
                imageUrl={challenge.imageUrl}
                size={COVER_SIZE}
                rotateDeg={COVER_TILT_DEG}
                style={styles.cover}
                testID="explore-card-cover"
              />
              {/* Looks like a button; the whole card is the press target, and it
                opens the challenge, where joining happens. */}
              <View style={[styles.joinPill, { backgroundColor: accentColor }]} testID="explore-card-join">
                <Text variant="label" weight="bold" style={styles.joinText}>
                  {t('challenges.join')}
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.ink} />
              </View>
            </View>
          )
        }
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  meta: {
    gap: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // A small badge: the same translucent `paper` fill as Button's `subtle`
  // variant, `paper` text, fully rounded.
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
    borderRadius: radius.big,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  // The photo on top, the Join pill pinned to the bottom right.
  side: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  // Clear of the card's top edge and right corner once tilted.
  cover: {
    marginTop: spacing.xs,
    marginRight: spacing.xs,
  },
  // EXPLORE_COVER_FULL_BLEED: the right side of the card, edge to edge — the
  // negative margins cancel the card's own (`roomy`) padding on the top, right
  // and bottom; the card's rounded corners clip it.
  bleed: {
    width: BLEED_WIDTH,
    marginTop: -spacing.base,
    marginRight: -spacing.base,
    marginBottom: -spacing.base,
  },
  bleedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  // Pinned to the photo's bottom-right, with a shadow so it lifts off any photo.
  joinOverPhoto: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    ...shadows.md,
  },
  // "Join": a pill in the activity color, `ink` on it, as activity colors pair with.
  joinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.lg,
    paddingRight: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
  },
  joinText: {
    color: colors.ink,
    opacity: 1,
  },
});
