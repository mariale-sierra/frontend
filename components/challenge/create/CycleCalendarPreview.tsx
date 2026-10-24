import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { borderWidth, colors, fillOpacity, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { dayInCycle, getCycleBreakdown } from '../../../utils/challengeCycle';
import type { CycleDayStatus } from './CycleDayList';

const WEEK_DAYS = 7;
// 2024-01-01 was a Monday: seven dates from it give Mon…Sun names in any locale.
const A_MONDAY = new Date(2024, 0, 1);

interface CycleCalendarPreviewProps {
  /** The challenge's total length — one cell per day. */
  durationDays: number;
  cycleLengthDays: number;
  /** A cycle day's state: `empty` (nothing assigned yet), `rest`, or
   * `configured` (a workout). */
  getDayStatus: (cycleDay: number) => CycleDayStatus;
  /** A configured workout day's color: its routine's own activity color
   * (Activity Color System v2), `primary` while it has no exercises. */
  getDayRoutineColor: (cycleDay: number) => string;
  /** Monday-based weekday (0 = Mon … 6 = Sun) of day 1 — today's, so the
   * preview lines up with the real week the challenge starts in. */
  startWeekday: number;
}

/**
 * The challenge's whole length as a Mon–Sun calendar (Create challenge, 53A
 * and 53B): one cell per challenge day, showing which cycle day it falls on
 * — cell i is cycle day (i % cycleLength) + 1, via `dayInCycle`, the same
 * mapping the backend uses. Workout days are filled with their routine's
 * activity color, rest days with `rest`, both with `ink` numbers; a day with
 * nothing assigned yet is a dashed outline with no fill — except in the first
 * cycle, where it is solid `paper` with an `ink` number; the days of a
 * last, cut-short cycle are dimmed. A
 * summary underneath reads "N full cycles" or "N full cycles + R days".
 */
export function CycleCalendarPreview({
  durationDays,
  cycleLengthDays,
  getDayStatus,
  getDayRoutineColor,
  startWeekday,
}: CycleCalendarPreviewProps) {
  const { t, i18n } = useTranslation();
  const { fullCycles, remainderDays } = getCycleBreakdown(durationDays, cycleLengthDays);
  const firstLeftoverIndex = fullCycles * cycleLengthDays;

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language || undefined, { weekday: 'narrow' });
    return Array.from({ length: WEEK_DAYS }, (_, i) => {
      const date = new Date(A_MONDAY);
      date.setDate(A_MONDAY.getDate() + i);
      return formatter.format(date);
    });
  }, [i18n.language]);

  // Leading blanks up to today's weekday, then one cell per challenge day,
  // then trailing blanks to finish the last week.
  const weeks = useMemo(() => {
    const cells: Array<number | null> = [
      ...Array.from({ length: startWeekday }, () => null),
      ...Array.from({ length: durationDays }, (_, index) => index),
    ];
    while (cells.length % WEEK_DAYS !== 0) cells.push(null);
    const rows: Array<Array<number | null>> = [];
    for (let i = 0; i < cells.length; i += WEEK_DAYS) rows.push(cells.slice(i, i + WEEK_DAYS));
    return rows;
  }, [durationDays, startWeekday]);

  const summary =
    remainderDays > 0
      ? t('challengeCreate.calendar.cyclesAndDays', {
          cycles: t('challengeCreate.calendar.fullCycles', { count: fullCycles }),
          days: t('challengeCreate.calendar.leftoverDays', { count: remainderDays }),
        })
      : t('challengeCreate.calendar.fullCycles', { count: fullCycles });

  return (
    <View style={styles.container} testID="cycle-calendar">
      <View style={styles.week}>
        {weekdayLabels.map((label, i) => (
          <Text key={`weekday-${i}`} variant="caption" tone="tertiary" align="center" style={styles.cellSlot}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, row) => (
        <View key={`week-${row}`} style={styles.week}>
          {week.map((index, col) => {
            if (index === null) return <View key={`blank-${row}-${col}`} style={styles.cellSlot} />;

            const cycleDay = dayInCycle(index + 1, cycleLengthDays);
            const status = getDayStatus(cycleDay);
            const isFirstCycle = index < cycleLengthDays;
            // An unassigned first-cycle day is a solid `paper` cell (the days
            // still to plan stand out); once assigned it takes its routine's
            // color like every other day. Later unassigned days stay dashed.
            const isUnplannedFirstCycle = isFirstCycle && status === 'empty';
            const isEmpty = status === 'empty' && !isFirstCycle;
            const fill = isUnplannedFirstCycle
              ? colors.paper
              : isEmpty
                ? 'transparent'
                : status === 'rest'
                  ? colors.rest
                  : getDayRoutineColor(cycleDay);
            const isLeftover = index >= firstLeftoverIndex;

            return (
              <View key={`day-${index}`} style={styles.cellSlot}>
                <View
                  testID={`cycle-calendar-day-${index}`}
                  style={[
                    styles.cell,
                    { backgroundColor: fill },
                    isEmpty && styles.cellEmpty,
                    isLeftover && styles.cellLeftover,
                  ]}
                >
                  <Text variant="caption" weight="bold" style={isEmpty ? styles.numberEmpty : styles.numberFilled}>
                    {cycleDay}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <Text variant="caption" tone="secondary" align="center" style={styles.summary} testID="cycle-calendar-summary">
        {summary}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.base,
    gap: spacing.xs,
  },
  week: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cellSlot: {
    flex: 1,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmpty: {
    borderWidth: borderWidth.thin,
    borderStyle: 'dashed',
    borderColor: withAlpha(colors.paper, textOpacity.tertiary),
  },
  cellLeftover: {
    opacity: fillOpacity.dim,
  },
  // `ink` on a filled (activity/rest) cell; custom color on `Text` needs
  // `opacity: 1` (components/ui/text.tsx).
  numberFilled: {
    color: colors.ink,
    opacity: 1,
  },
  numberEmpty: {
    color: withAlpha(colors.paper, textOpacity.secondary),
    opacity: 1,
  },
  summary: {
    marginTop: spacing.sm,
  },
});
