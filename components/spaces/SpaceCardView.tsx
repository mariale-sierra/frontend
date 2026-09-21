import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentCard } from '../ui/accentCard';
import { Text } from '../ui/text';
import { ChallengeCardMembers } from '../challenge/card/ChallengeCardMembers';
import { challengeCardText } from '../challenge/card/challengeCardText';
import { spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';

interface SpaceCardViewProps {
  name: string;
  description?: string | null;
  membersCount: number;
  /** The space's own Activity Color — the card's glow and outline. */
  accentColor: string;
  /** The Join / Request / Pending pill, top right. None for a member or owner,
   * and in the form's live preview. */
  cta?: ReactNode;
}

/**
 * What a Space looks like as a card: the glow card look shared with the challenge
 * cards (`AccentCard` — dark, the space's Activity Color as a fine outline and as
 * a glow) with a glow of its own, a half-moon from the top AND the bottom edge
 * (`twinGlow`), in the Space card's compact layout, based on wireframe Chats-46A:
 * the name on the left, the Join / Request / Pending pill on the right of the same
 * row, then the description, then the member count. No activity badge (the color
 * says it), and roomier padding than the challenge cards. Sized by its content.
 * Presentational only — `SpaceCard` adds the press handling, and the space form
 * shows it as its live preview.
 */
export function SpaceCardView({
  name,
  description,
  membersCount,
  accentColor,
  cta,
}: SpaceCardViewProps) {
  const { t } = useTranslation();

  return (
    <AccentCard color={accentColor} twinGlow style={styles.card}>
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
