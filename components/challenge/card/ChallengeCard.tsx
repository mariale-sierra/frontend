import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AccentCard } from '../../ui/accentCard';
import { Text } from '../../ui/text';
import { spacing } from '../../../constants/theme';
import { USE_MESH_CARD_GLOW } from '../../../constants/challengeCards';
import type { MeshRecipe } from '../../../constants/meshRecipes';
import { challengeCardText } from './challengeCardText';

/** Fixed height of the list cards (Challenges-Mine and Explore) — the loading
 * skeleton is the same. */
export const CHALLENGE_CARD_HEIGHT = 176;

/** How a card is sized: `fixed` at `CHALLENGE_CARD_HEIGHT` (the list cards), or
 * `fill` to take all the height its parent gives it (Home's carousel, where the
 * tallest card sets the height for all of them). */
export type ChallengeCardSizing = 'fixed' | 'fill';

interface ChallengeCardProps {
  /** The challenge's own activity color — the card's glow, outline and accents. */
  accentColor: string;
  /** The badge slot above the title (an `AccentPill`, or a row holding one). */
  top: ReactNode;
  title: string;
  /** Limit the title to this many lines. Unlimited when unset. */
  titleLines?: number;
  /** A small line under the title. */
  subtitle?: string;
  /** Sits directly below `subtitle` (e.g. who made the challenge) — still part of
   * the header, above the footer, but its own row rather than sharing the tight
   * title/subtitle stack. */
  belowSubtitle?: ReactNode;
  /** What sits at the bottom of the text column (progress, members). */
  footer: ReactNode;
  /** A panel on the right (the photo tile, the tick ring). The text column takes
   * the full width when there isn't one. */
  side?: ReactNode;
  /** A small badge pinned to the card's top-right corner, drawn over the glow
   * and the `side` panel — e.g. Explore's compact member count (just an icon
   * and a number, since "members" is now said by the footer's author tag
   * instead). Absolutely positioned at the same inset as the rest of the
   * card's content; optional, most cards have none. */
  cornerBadge?: ReactNode;
  /** See `ChallengeCardSizing`. Default `fixed`. */
  sizing?: ChallengeCardSizing;
  /** The mesh recipe for the card's glow (see `getMeshRecipe`); the plain
   * half-moon from the bottom edge when unset — or when `USE_MESH_CARD_GLOW` is
   * off, which is the revert. */
  glowRecipe?: MeshRecipe;
}

/**
 * The shared shell and layout of the glow challenge cards — Challenges-Mine,
 * Challenges-Explore and Home's hero card: an `AccentCard` (dark, the activity
 * color glowing up from the bottom edge, a soft outline), a text column on the
 * left (badge, title, optional subtitle, and a footer pinned to the bottom) and
 * an optional panel on the right. The cards that use it only decide what goes in
 * each slot, so the layout, type and spacing exist once. (Space cards share the
 * `AccentCard` look but have their own, more compact layout.)
 *
 * It isn't pressable itself — wrap it in the card's own `Pressable`.
 */
export function ChallengeCard({
  accentColor,
  top,
  title,
  titleLines,
  subtitle,
  belowSubtitle,
  footer,
  side,
  cornerBadge,
  sizing = 'fixed',
  glowRecipe,
}: ChallengeCardProps) {
  return (
    <AccentCard
      color={accentColor}
      glowRecipe={USE_MESH_CARD_GLOW ? glowRecipe : undefined}
      style={[styles.card, sizing === 'fill' ? styles.fill : styles.fixed]}
    >
      <View style={[styles.content, !side && styles.contentAlone]}>
        <View style={styles.header}>
          {top}
          <View style={styles.titleBlock}>
            <Text variant="subheader" numberOfLines={titleLines} style={challengeCardText.primary}>
              {title}
            </Text>
            {subtitle ? (
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {belowSubtitle}
        </View>

        {footer}
      </View>

      {side}
      {cornerBadge ? <View style={styles.cornerBadge}>{cornerBadge}</View> : null}
    </AccentCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  fixed: {
    height: CHALLENGE_CARD_HEIGHT,
  },
  fill: {
    flex: 1,
  },
  // The text column sits a little further in from the card's edge than the side
  // panel does (which runs to the card's own padding), so it breathes.
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
  },
  // With no side panel the column is inset the same amount on the right.
  contentAlone: {
    paddingRight: spacing.sm,
  },
  header: {
    // Each child sizes to its content (a badge shouldn't stretch to the column).
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleBlock: {
    // A tight title / subtitle stack — the design system's one `gap: 2` exception.
    alignSelf: 'stretch',
    gap: 2,
  },
  // Real bug, found 2026-09-22: `top: 0, right: 0` sat flush with the
  // card's own OUTER edge, not its padded content edge — RN positions an
  // absolute child relative to the parent's border box, not its padding
  // box (unlike CSS). Combined with the card's rounded `radius.big` corner
  // and `overflow: 'hidden'`, that clipped most of the badge off. `top:
  // spacing.md` matches `AccentCard`'s own padding exactly, so it sits at
  // the same top inset every other piece of content in the card already
  // does. `right` is one step further in (`spacing.base`, 16 vs. `md`'s 12)
  // per explicit follow-up ("move it a bit to the left").
  cornerBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.base,
  },
});
