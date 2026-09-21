import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { ChallengeCard } from '../card/ChallengeCard';
import { ChallengeCardMembers } from '../card/ChallengeCardMembers';
import { ChallengeCardTickRing } from '../card/ChallengeCardTickRing';
import { challengeCardText } from '../card/challengeCardText';
import type { ExploreChallengeCardProps } from './challengeListSections';
import { fontSize } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import { formatCount } from '../../../utils/format';
import { getChallengeAccentColor, getChallengeGlowKey } from '../../../services/adapters/challengeState';

/**
 * Challenges-Explore card, glow design: the shared `ChallengeCard` — dark, the
 * challenge's own activity color glowing up from the bottom edge — a small
 * preview of the Challenge-Info screen. The category as a plain label in the
 * activity color (no badge), the title with where it happens under it, the
 * member count, and a tick ring on the right holding how many days it lasts.
 *
 * Same props and logic as the classic `ExploreChallengeCard` — only the visuals
 * differ. (Rest days are no longer shown on the card, since 2026-09-19.)
 *
 * The member count carries a people icon rather than member profile pictures
 * (see `ChallengeCardMembers`): no endpoint returns those for a list of
 * challenges (`GET /challenges` has only the count, and `GET /challenges/:id/users`
 * has no image and is one request per challenge), so real avatars need a backend
 * change first.
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
        footer={
          <ChallengeCardMembers label={t('challenges.membersCount', { count: formatCount(challenge.membersCount) })} />
        }
        side={
          <ChallengeCardTickRing accentColor={accentColor}>
            <Text variant="title" style={[challengeCardText.primary, styles.ringNumber]}>
              {challenge.durationDays}
            </Text>
            <Text variant="caption" weight="bold" style={[challengeCardText.paper, styles.daysUnit]}>
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
  daysUnit: {
    textTransform: 'uppercase',
  },
});
