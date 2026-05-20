import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS_TO_SHOW = 4;

function makeDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTodayKey(): string {
  const d = new Date();
  return makeDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// Builds week rows for a given month. Days are Monday-first (index 0 = Mon, 6 = Sun).
function getWeeksForMonth(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startIndex = (firstDay.getDay() + 6) % 7;

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startIndex).fill(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push([...week]);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

interface RestDayCalendarProps {
  selectedDates: Set<string>;
  onToggleDate: (dateKey: string) => void;
}

export function RestDayCalendar({ selectedDates, onToggleDate }: RestDayCalendarProps) {
  const todayKey = getTodayKey();
  const now = new Date();

  const months = Array.from({ length: MONTHS_TO_SHOW }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <View style={styles.container}>
      {/* Day-of-week header */}
      <View style={styles.dayHeader}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayHeaderCell}>
            <Text variant="label" style={styles.dayLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {months.map(({ year, month }) => {
        const weeks = getWeeksForMonth(year, month);
        return (
          <View key={`${year}-${month}`} style={styles.monthBlock}>
            <Text style={styles.monthName}>
              {MONTH_NAMES[month].toUpperCase()}
            </Text>

            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`}>
                <View style={styles.weekRow}>
                  {week.map((day, colIndex) => {
                    if (day === null) {
                      return <View key={`empty-${colIndex}`} style={styles.dayCell} />;
                    }

                    const dateKey = makeDateKey(year, month, day);
                    const isToday = dateKey === todayKey;
                    const isPast = dateKey < todayKey;
                    const isSelected = selectedDates.has(dateKey);

                    return (
                      <Pressable
                        key={dateKey}
                        style={styles.dayCell}
                        onPress={() => !isPast && onToggleDate(dateKey)}
                        disabled={isPast}
                        accessibilityRole="button"
                        accessibilityLabel={`${MONTH_NAMES[month]} ${day}`}
                        accessibilityState={{ selected: isSelected, disabled: isPast }}
                      >
                        <View style={styles.dotArea}>
                          {isSelected ? (
                            <View style={[styles.dot, styles.dotSelected]} />
                          ) : isToday ? (
                            <View style={[styles.dot, styles.dotToday]} />
                          ) : null}
                        </View>
                        <Text
                          variant="body"
                          align="center"
                          style={[
                            styles.dayNumber,
                            isPast && styles.dayNumberPast,
                            isSelected && styles.dayNumberSelected,
                          ]}
                        >
                          {String(day)}
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
        );
      })}
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
