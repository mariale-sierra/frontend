import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { challengeCardText } from '../card/challengeCardText';
import { ChallengeCard } from '../card/ChallengeCard';
import type { ExploreChallengeCardProps } from './challengeListSections';
import { borderWidth, colors, radius, spacing } from '../../../constants/theme';
import { formatCount } from '../../../utils/format';
import { getChallengeAccentColor } from '../../../services/adapters/challengeState';

/**
 * Challenges-Browse card, glow design — after the Challenges-Explore-18A
 * wireframe (2026-10-20, explicit requests), on the shared `ChallengeCard` with
 * the Mine cards' glow (the plain half-moon of the activity color from the
 * bottom edge — no mesh recipe):
 *
 *  - the title, with a days badge outlined in the activity color ("30 days",
 *    calendar icon) at the end of its row, top right;
 *  - "By @name" under the title, in the title's own color (the author, an
 *    explicit 2026-09-22 request — it takes the wireframe's cycle line, which
 *    listed rest days, kept off the cards since 2026-09-19);
 *  - the footer: where it happens and what kind of training, each with its icon,
 *    then "N members" in `paper` and a "Join ›" pill filled with the activity color.
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
  const accentText = { color: accentColor, opacity: 1 };

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ChallengeCard
        accentColor={accentColor}
        // No `glowRecipe`: the Mine cards' plain glow, the half-moon of the
        // activity color from the bottom edge.
        // No top slot: the title starts at the top of the card (2026-10-20, moved
        // down, then back up — "move the content a bit further up").
        top={null}
        title={challenge.title}
        titleLines={1}
        titleAccessory={
          // Outline, text and icon in the activity color (2026-10-20, trying it out —
          // it was the card's secondary gray). As written ("30 days"), not in capitals.
          <View style={[styles.daysBadge, { borderColor: accentColor }]} testID="explore-card-days">
            <Icon name="calendar-outline" size={16} color={accentColor} />
            <Text variant="label" weight="bold" style={accentText}>
              {t('challenges.durationDaysLabel', { count: challenge.durationDays })}
            </Text>
          </View>
        }
        subtitleInTitleColor
        // The author as the card's subtitle (plain "By @name"): as its own row with
        // an avatar it would push the card past its fixed height.
        subtitle={challenge.author ? t('challenges.byAuthor', { name: `@${challenge.author.username}` }) : undefined}
        footer={
          <View style={styles.footer}>
            {challenge.locationsLabel || challenge.categoriesLabel ? (
              <View style={styles.metaRow}>
                {challenge.locationsLabel ? (
                  <View style={styles.metaItem}>
                    <Icon name="location-outline" size={14} color={colors.paper} />
                    <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.metaText}>
                      {challenge.locationsLabel}
                    </Text>
                  </View>
                ) : null}
                {challenge.categoriesLabel ? (
                  <View style={styles.metaItem}>
                    <Icon name="flash-outline" size={14} color={colors.paper} />
                    <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.metaText}>
                      {challenge.categoriesLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <View style={styles.metaItem}>
                {/* `paper` (2026-10-20, trying it out — it was the activity color). */}
                <Icon name="people-outline" size={18} color={colors.paper} />
                <Text variant="label" weight="bold" style={challengeCardText.paper}>
                  {t('challenges.membersCount', { count: formatCount(challenge.membersCount) })}
                </Text>
              </View>
              {/* Looks like a button; the whole card is the press target, and it
                  opens the challenge, where joining happens. */}
              <View style={[styles.joinPill, { backgroundColor: accentColor }]} testID="explore-card-join">
                <Text variant="label" weight="bold" style={styles.joinText}>
                  {t('challenges.join')}
                </Text>
                <Icon name="chevron-forward" size={16} color={colors.ink} />
              </View>
            </View>
          </View>
        }
      />
    </Pressable>
  );
});

// Halfway between `radius.small` and `radius.medium` (2026-10-20, "a bit more
// rounded"): `medium` on a badge this short is a full pill again.
const DAYS_BADGE_RADIUS = (radius.small + radius.medium) / 2;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  // The days badge, top right — an outline (its color, the activity color, set
  // inline), softly rounded (2026-10-20: was a filled `paper` pill, then a white
  // outline, then a gray one).
  daysBadge: {
    borderWidth: borderWidth.thin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: DAYS_BADGE_RADIUS,
  },
  // "Join": a pill in the activity color, `ink` on it, as activity colors pair with.
  joinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    // Wider (2026-10-20): the chevron side a step less, so it looks balanced.
    paddingLeft: spacing.lg,
    paddingRight: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
  },
  joinText: {
    color: colors.ink,
    opacity: 1,
  },
  // `ChallengeCard` pins the footer to the bottom of the card (2026-10-20: it was
  // lifted by `base`, then `sm`, then let back down — "the join button a bit lower").
  // Back at the text column's own bottom padding — it was sunk into it, then
  // raised again so the Join pill has room ("move the content a bit up"). The
  // `base` gap sets the members + Join row apart from the location row above
  // it, which also brings that row closer to "By @name" (the header and footer
  // sit at opposite ends of the card, so the space between them is what's left).
  footer: {
    gap: spacing.base,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  metaText: {
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
