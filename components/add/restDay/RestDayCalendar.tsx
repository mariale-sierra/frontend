import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';
import { buildChallengeCalendar } from '../../../utils/challengeCalendar';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function makeDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface RestDayCalendarProps {
  startDate: Date;
  totalDays: number;
  selectedDates: Set<string>;
  onToggleDate: (dateKey: string) => void;
}

// No rest-day cycle exists yet at this pre-join planning stage (that's what
// this screen is collecting) — every real day is either future/selectable
// or already past, no photo/rest classification applies here.
const NO_REST_DAYS = () => false;

export function RestDayCalendar({ startDate, totalDays, selectedDates, onToggleDate }: RestDayCalendarProps) {
  const currentDay = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - start.getTime()) / 86_400_000);
    return diffDays + 1;
  }, [startDate]);

  const months = useMemo(
    () => buildChallengeCalendar(startDate, totalDays, currentDay, [], NO_REST_DAYS),
    [startDate, totalDays, currentDay],
  );

  return (
    <View style={styles.container}>
      <View style={styles.dayHeader}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayHeaderCell}>
            <Text variant="label" style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {months.map(({ year, month, label, weeks }) => (
        <View key={`${year}-${month}`} style={styles.monthBlock}>
          <Text style={styles.monthName}>{label}</Text>

          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`}>
              <View style={styles.weekRow}>
                {week.map((cell, colIndex) => {
                  if (!cell || cell.challengeDay === null) {
                    return <View key={`empty-${colIndex}`} style={styles.dayCell} />;
                  }

                  const dateKey = makeDateKey(year, month, cell.dayOfMonth);
                  const isSelectable = cell.isFuture || cell.isToday;
                  const isSelected = selectedDates.has(dateKey);

                  return (
                    <Pressable
                      key={dateKey}
                      style={styles.dayCell}
                      onPress={() => isSelectable && onToggleDate(dateKey)}
                      disabled={!isSelectable}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected, disabled: !isSelectable }}
                    >
                      <View style={styles.dotArea}>
                        {isSelected ? (
                          <View style={[styles.dot, styles.dotSelected]} />
                        ) : cell.isToday ? (
                          <View style={[styles.dot, styles.dotToday]} />
                        ) : null}
                      </View>
                      <Text
                        variant="body"
                        align="center"
                        style={[
                          styles.dayNumber,
                          !isSelectable && styles.dayNumberPast,
                          isSelected && styles.dayNumberSelected,
                        ]}
                      >
                        {String(cell.dayOfMonth)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {weekIndex < weeks.length - 1 && (
                <View style={styles.weekDivider} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monthBlock: {
    marginBottom: spacing.xl,
  },
  monthName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dotArea: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotSelected: {
    backgroundColor: colors.primary,
  },
  dotToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: 15,
    lineHeight: 18,
  },
  dayNumberPast: {
    color: colors.textMuted,
  },
  dayNumberSelected: {
    color: colors.primary,
  },
});
