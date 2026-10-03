import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ChallengeCard } from '../card/ChallengeCard';
import { ChallengeCardAuthor } from '../card/ChallengeCardAuthor';
import { ChallengeCardTickRing } from '../card/ChallengeCardTickRing';
import { challengeCardText } from '../card/challengeCardText';
import type { ExploreChallengeCardProps } from './challengeListSections';
import { colors, fontSize, spacing } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import { formatCount } from '../../../utils/format';
import { getChallengeAccentColor, getChallengeGlowKey } from '../../../services/adapters/challengeState';

/**
 * Challenges-Explore card, glow design: the shared `ChallengeCard` — dark, the
 * challenge's own activity color glowing up from the bottom edge — a small
 * preview of the Challenge-Info screen. The category as a plain label in the
 * activity color (no badge), the title with where it happens under it, who
 * made it in the footer, a compact member-count badge pinned to the top-right
 * corner, and a tick ring on the right holding how many days it lasts.
 *
 * Layout reworked 2026-09-22, per explicit request — the author tag (was
 * below the location line) now sits in the footer instead, replacing the old
 * `ChallengeCardMembers` row there ("same weight and size": `ChallengeCardAuthor`'s
 * `size="md"`, which matches `ChallengeCardMembers`' own label/bold text
 * exactly except color — still `paper`, per the separate "text in paper"
 * request). The member count moved to a small badge in the card's top-right
 * corner (`ChallengeCard`'s `cornerBadge` slot) — just the people icon and the
 * number, no "members" word, so it doesn't compete with the footer's author
 * tag for the word "members." The tick ring nudged down a little
 * (`ChallengeCardTickRing`'s own `topOffset`) so it doesn't crowd the corner
 * badge sitting right above it.
 *
 * Same props and logic as the classic `ExploreChallengeCard` — only the visuals
 * differ (the classic design keeps its OLD layout: author below the location
 * line, "N members" in the footer — this rework is glow-card-specific).
 * (Rest days are no longer shown on the card, since 2026-09-19.)
 *
 * The member count carries a people icon rather than member profile pictures:
 * no endpoint returns those for a list of challenges (`GET /challenges` has
 * only the count, and `GET /challenges/:id/users` has no image and is one
 * request per challenge), so real avatars need a backend change first.
 */
export const ExploreChallengeCardV2 = memo(function ExploreChallengeCardV2({
  challenge,
  onPress,
}: ExploreChallengeCardProps) {
  const { t } = useTranslation();
  // Activity Color System v2 — falls back to colors.primary when this
  // challenge has no dominant category yet.
  const accentColor = getChallengeAccentColor(challenge.dominantActivityCategory);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ChallengeCard
        accentColor={accentColor}
        glowRecipe={getMeshRecipe('explore', getChallengeGlowKey('active', challenge.dominantActivityCategory))}
        top={
          challenge.categoriesLabel ? (
            <Text
              variant="caption"
              weight="bold"
              numberOfLines={1}
              style={[styles.categoryLabel, { color: accentColor }]}
            >
              {challenge.categoriesLabel}
            </Text>
          ) : null
        }
        title={challenge.title}
        titleLines={1}
        subtitle={challenge.locationsLabel}
        footer={challenge.author ? <ChallengeCardAuthor author={challenge.author} size="md" /> : null}
        cornerBadge={
          <View style={styles.memberCountBadge} accessibilityLabel={t('challenges.membersCount', { count: challenge.membersCount })}>
            <Icon name="people-outline" size={14} color={colors.primary} />
            <Text variant="caption" weight="bold" style={challengeCardText.primary}>
              {formatCount(challenge.membersCount)}
            </Text>
          </View>
        }
        side={
          <ChallengeCardTickRing accentColor={accentColor} topOffset={spacing.sm}>
            <Text variant="title" style={[challengeCardText.primary, styles.ringNumber]}>
              {challenge.durationDays}
            </Text>
            <Text variant="caption" weight="bold" style={challengeCardText.paper}>
              {t('challenges.daysUnit', { count: challenge.durationDays })}
            </Text>
          </ChallengeCardTickRing>
        }
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  // The category is a plain label in the activity color, not a badge. `Text`'s
  // tone-opacity applies even to a custom color, so it is cancelled back.
  categoryLabel: {
    opacity: 1,
    textTransform: 'uppercase',
  },
  // The number's line box is as tall as the number itself (30, not the title
  // variant's roomier 38), which pulls the "days" label up under it.
  ringNumber: {
    lineHeight: fontSize['3xl'],
  },
  memberCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
