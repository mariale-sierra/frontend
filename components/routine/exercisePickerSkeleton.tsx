import { StyleSheet, View } from 'react-native';
import { Skeleton } from '../ui/skeleton';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

const ROW_COUNT = 7;
const THUMB_SIZE = 64;

/**
 * Mirrors the Add-Exercises screen's real layout (the 3 filter pills, the
 * results-count line, and a handful of image-thumbnail list rows) — shown
 * while the very first page is in flight, instead of a bare centered
 * spinner. Every padding/gap value here matches the real screen's own
 * styles exactly, so swapping skeleton -> real content doesn't reflow
 * anything.
 *
 * Deliberately NOT re-shown on every filter/search change — same
 * "type-to-search would flash constantly" reasoning the design system
 * already documents for Search's own skeleton exception (see
 * havit-design-system skill -> Components -> Skeleton loading). Existing
 * rows just stay on screen while a new page loads in behind them.
 */
export function ExercisePickerSkeleton() {
  return (
    <View>
      <View style={styles.pillRow}>
        <Skeleton height={36} radius={radius.big} style={styles.pill} />
        <Skeleton height={36} radius={radius.big} style={styles.pill} />
        <Skeleton height={36} radius={radius.big} style={styles.pill} />
      </View>

      <View style={styles.countRow}>
        <Skeleton width={110} height={11} />
      </View>

      <View style={styles.list}>
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <View key={index}>
            <View style={styles.row}>
              <Skeleton width={THUMB_SIZE} height={THUMB_SIZE} radius={radius.small} />
              <View style={styles.textColumn}>
                <Skeleton width="65%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={22} height={22} radius={radius.big} />
            </View>
            {index < ROW_COUNT - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.base,
  },
  pill: {
    flex: 1,
  },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: spacing.sm,
  },
  textColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
});
