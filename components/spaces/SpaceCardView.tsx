import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentCard } from '../ui/accentCard';
import { AccentPill } from '../ui/accentPill';
import { Text } from '../ui/text';
import { ChallengeCardMembers } from '../challenge/card/ChallengeCardMembers';
import { challengeCardText } from '../challenge/card/challengeCardText';
import { spacing } from '../../constants/theme';
import { formatCount } from '../../utils/format';

interface SpaceCardViewProps {
  name: string;
  description?: string | null;
  /** The category's name, shown as the badge. No badge when there isn't one. */
  categoryName?: string | null;
  membersCount: number;
  /** The space's own Activity Color — the card's glow, outline and badge. */
  accentColor: string;
  /** The Join / Request / Pending pill, top right. None for a member or owner,
   * and in the form's live preview. */
  cta?: ReactNode;
}

/**
 * What a Space looks like as a card: the glow card look shared with the challenge
 * cards (`AccentCard` — dark, the space's Activity Color glowing up from the
 * bottom edge with a fine outline) in the Space card's own compact layout, based
 * on wireframe Chats-46A: the category badge over the name on the left, the
 * Join / Request / Pending pill on the right of the same row, then the
 * description, then the member count. Sized by its content. Presentational only
 * — `SpaceCard` adds the press handling, and the space form shows it as its live
 * preview.
 */
export function SpaceCardView({
  name,
  description,
  categoryName,
  membersCount,
  accentColor,
  cta,
}: SpaceCardViewProps) {
  const { t } = useTranslation();

  return (
    <AccentCard color={accentColor} style={styles.card}>
      {/* Real, reported layout bug: the badge and name used to be two
          separate full-width rows (badge+CTA on row 1, name alone on row
          2) — the wireframe groups the badge and name into ONE left-hand
          column that sits in the SAME row as the CTA pill, the CTA
          vertically anchored to that column's top edge, not floating
          above the name on its own line. */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          {categoryName ? (
            <AccentPill size="sm" uppercase icon="flash-outline" label={categoryName} color={accentColor} />
          ) : null}
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
  // `AccentCard`'s own `md` padding — compact, no extra inset.
  card: {
    gap: spacing.xs,
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
