import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { activityColors, colors, radius, spacing } from '../../../constants/theme';
import type { ActivityType } from '../../../types/activity';

/** The order the chips always appear in (only those with challenges show). */
export const ACTIVITY_FILTER_ORDER: ActivityType[] = [
  'strength',
  'cardioIntense',
  'cardioLow',
  'flexibility',
  'mindBody',
  'functional',
];

const DOT_SIZE = 8;

interface ActivityFilterChipsProps {
  /** The activities to offer — only those at least one challenge has as its main one. */
  activities: ActivityType[];
  /** The picked activity, or null for "All". */
  selected: ActivityType | null;
  onSelect: (activity: ActivityType | null) => void;
  /** The leading "All" chip — on by default; off where a chip only navigates
   * (Search's "Browse by activity"). */
  showAll?: boolean;
}

/**
 * Challenges-Browse's activity filter (2026-10-20): a horizontally scrolling row
 * of chips — "All", then one per activity — that narrows the list to challenges
 * whose MAIN activity (the one that colors their card) is the picked one. Same
 * pill as the create flow's activity picker (`surface`, bold `label`, `radius.big`);
 * an unpicked activity chip carries a dot of its own color, a picked one fills
 * with it (`ink` text on it, as activity colors pair with); a picked "All" fills
 * with `paper`. It runs edge to edge: the row bleeds out of the list header's
 * side padding and puts it back inside the scroll.
 */
export function ActivityFilterChips({ activities, selected, onSelect, showAll = true }: ActivityFilterChipsProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      testID="activity-filter-chips"
    >
      {showAll && (
        <Chip
          label={t('challenges.filterAll')}
          selected={selected === null}
          fill={colors.paper}
          onPress={() => onSelect(null)}
          testID="activity-filter-all"
        />
      )}
      {activities.map((activity) => (
        <Chip
          key={activity}
          label={t(`challenges.activityBadgesShort.${activity}`)}
          selected={selected === activity}
          fill={activityColors[activity]}
          dot={activityColors[activity]}
          onPress={() => onSelect(selected === activity ? null : activity)}
          testID={`activity-filter-${activity}`}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  fill,
  dot,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  fill: string;
  dot?: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      style={({ pressed }) => [styles.chip, selected && { backgroundColor: fill }, pressed && styles.pressed]}
    >
      {dot && !selected ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <Text variant="label" weight="bold" tone={selected ? 'inverse' : 'primary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Out to the screen's edges, past the list header's `lg` side padding.
  scroll: {
    marginHorizontal: -spacing.lg,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radius.small,
  },
  pressed: {
    opacity: 0.85,
  },
});
