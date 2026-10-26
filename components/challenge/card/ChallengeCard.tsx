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
  /** Sets the subtitle in the title's own color (`primary`) instead of the
   * secondary tone — Browse's "By @name". */
  subtitleInTitleColor?: boolean;
  /** Sits at the end of the title's row, top right (Browse's days badge); the
   * title takes the space left of it, so a long title never runs under it. */
  titleAccessory?: ReactNode;
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
  /** More room between the content and the card's edges (Explore, Sprint 10). */
  roomy?: boolean;
  /** Centers the text column vertically instead of pinning the header to the
   * top and the footer to the bottom — for a card with no footer (Explore). */
  centered?: boolean;
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
  subtitleInTitleColor = false,
  titleAccessory,
  belowSubtitle,
  footer,
  side,
  cornerBadge,
  sizing = 'fixed',
  roomy = false,
  centered = false,
  glowRecipe,
}: ChallengeCardProps) {
  return (
    <AccentCard
      color={accentColor}
      glowRecipe={USE_MESH_CARD_GLOW ? glowRecipe : undefined}
      style={[styles.card, sizing === 'fill' ? styles.fill : styles.fixed, roomy && styles.roomy]}
    >
      <View style={[styles.content, !side && styles.contentAlone, centered && styles.contentCentered]}>
        <View style={styles.header}>
          {top}
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text variant="subheader" numberOfLines={titleLines} style={[challengeCardText.primary, styles.title]}>
                {title}
              </Text>
              {titleAccessory}
            </View>
            {subtitle ? (
              <Text
                variant="caption"
                tone={subtitleInTitleColor ? undefined : 'secondary'}
                numberOfLines={1}
                style={subtitleInTitleColor ? challengeCardText.primary : undefined}
              >
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
  // `base` instead of AccentCard's own `md` padding.
  roomy: {
    padding: spacing.base,
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
  contentCentered: {
    justifyContent: 'center',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
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
