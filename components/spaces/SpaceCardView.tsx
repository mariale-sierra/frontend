import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentCard } from '../ui/accentCard';
import { Text } from '../ui/text';
import { ChallengeCardMembers } from '../challenge/card/ChallengeCardMembers';
import { challengeCardText } from '../challenge/card/challengeCardText';
import { spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';
import { getChallengeGlowColor } from '../../services/adapters/challengeState';
import type { ActivityType } from '../../types/activity';

interface SpaceCardViewProps {
  name: string;
  description?: string | null;
  membersCount: number;
  /** The space's own Activity Type: its color is the card's outline and its glow
   * (the neutral color when the space has none). */
  activityType: ActivityType | null;
  /** The Join / Request / Pending pill, top right. None for a member or owner,
   * and in the form's live preview. */
  cta?: ReactNode;
}

/**
 * What a Space looks like as a card: the glow card look shared with the challenge
 * cards (`AccentCard` — dark, the space's Activity Color as a fine outline and as
 * a glow), in the Space card's compact layout, based on wireframe Chats-46A: the
 * name on the left, the Join / Request / Pending pill on the right of the same
 * row, then the description, then the member count. No activity badge (the color
 * says it), and roomier padding than the challenge cards. Sized by its content.
 * Presentational only — `SpaceCard` adds the press handling, and the space form
 * shows it as its live preview.
 *
 * The glow is `AccentCard`'s `linearGlow` — a plain diagonal `LinearGradient`,
 * `ink` at the top-left to the space's own full, vivid activity color at the
 * bottom-right. Real change 2026-09-25, replacing a long chain of attempts at
 * getting there through `AccentCard`'s dome/bloom system instead (a half-moon
 * from the bottom edge, matching Home's hero card and Mine's cards): after
 * seven rounds of tuning peaks, falloff curves, a hot core and a real blur —
 * still not saturated, not concentrated, not "colorful" enough — working out
 * the dome's own geometry by hand (not eyeballing another guess) found a
 * genuine bug: for this card's real short/wide size, its own math put the
 * wash's brightest point ~900px below the visible card, meaning the ONE part
 * of the dome that actually carries any hue variation was rendering at ~5%
 * strength the entire time, no matter how the bloom (a single flat color) was
 * tuned. When an attached reference image ("I want something like this, only
 * gradient wise... with their activity colors") showed a plain corner-to-corner
 * gradient card, not a radial glow at all, that turned out to be a completely
 * different, much simpler shape — no falloff curve to tighten, no bloom/wash
 * balance, no "circle" to ever be visible — that matches what was actually
 * being asked for far more directly than the dome ever could. This card's own
 * former dome tuning history (and everything learned about `AccentDome`'s
 * circle-through-three-points geometry along the way) isn't reproduced here —
 * see this file's git history if it's ever needed again. Uses Skia's own
 * `LinearGradient` (the same primitive `AccentDome`'s own wash already draws
 * successfully) — NOT `expo-linear-gradient`, confirmed to render nothing at
 * all in this app's actual build (see `ChallengeCardShimmer.tsx`'s own doc
 * comment for that already-diagnosed bug) — see `linearGlow`'s own prop doc
 * on `AccentCard` for the rest.
 *
 * This used to be its own thing before the dome, too: a scatter of soft ORBS
 * of light (the `space` mesh recipe: seven round bubbles of different sizes —
 * kept in meshRecipes.ts for reference/reversion, same pattern as
 * `LAYOUTS.mine`), or, with `USE_MESH_CARD_GLOW` off, a half-moon from BOTH
 * the top and bottom edge (`twinGlow`). None of that is drawn here anymore —
 * layout, padding and every other part of this card are unchanged throughout
 * all of this.
 */
export function SpaceCardView({
  name,
  description,
  membersCount,
  activityType,
  cta,
}: SpaceCardViewProps) {
  const { t } = useTranslation();

  return (
    <AccentCard color={getChallengeGlowColor('active', activityType)} linearGlow style={styles.card}>
      {/* The name on the left, in the SAME row as the CTA pill, the CTA anchored
          to its top edge (the wireframe's shape). */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          {/* `lg` (18px), a tier down from `subheader`'s 20 — a Space card's
              name is smaller than a challenge card's title, to keep the card short. */}
          <Text variant="subheader" size="lg" numberOfLines={1} style={challengeCardText.primary}>
            {name}
          </Text>
        </View>
        {cta}
      </View>

      {description ? (
        // A caption (12px) — small, like the challenge cards' subtitle, to keep
        // the card short.
        <Text variant="caption" tone="secondary" numberOfLines={2} style={styles.description}>
          {description}
        </Text>
      ) : null}

      <View style={styles.members}>
        {/* Real, reported bug: `spaces.membersCount` is pluralized
            (`_one`/`_other`), which needs a real NUMBER in `count` to
            resolve at all — `formatCount()` returns a string (e.g.
            "1.2k"), so passing it AS `count` made i18next fail to match
            either variant and fall back to printing the raw key
            ("spaces.membersCount") on screen. `count` stays the real
            number for plural resolution; `formattedCount` is the
            separate interpolation var the strings actually display. */}
        <ChallengeCardMembers
          size="sm"
          label={t('spaces.membersCount', { count: membersCount, formattedCount: formatCount(membersCount) })}
        />
      </View>
    </AccentCard>
  );
}

const styles = StyleSheet.create({
  // Roomier than `AccentCard`'s own `md` padding, so the content sits well in from
  // the card's rounded edges: `lg` at the sides, `base` above and below.
  card: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
    // Each child sizes to its content (the badge shouldn't stretch to the column).
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  // Negative `spacing.xs` cancels out `card`'s own `gap: spacing.xs` between its
  // children, purely for this one edge (title-row -> description) —
  // description -> members keeps the normal card-level gap.
  description: {
    marginTop: -spacing.xs,
  },
  members: {
    marginTop: spacing.xs,
  },
});
