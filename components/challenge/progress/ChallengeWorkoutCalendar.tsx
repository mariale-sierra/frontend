import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, spacing } from '../../../constants/theme';

interface ChallengeWorkoutCalendarProps {
  width: number;
  month: string;
  completedWorkoutDays: number[];
  selectedDay: number;
  photoDays: number[];
  onPressDay: (day: number) => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const WEEKS: Array<Array<number | null>> = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
];

export function ChallengeWorkoutCalendar({
  width,
  month,
  completedWorkoutDays,
  selectedDay,
  photoDays,
  onPressDay,
}: ChallengeWorkoutCalendarProps) {
  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.calendar}>
        <Text variant="title" style={styles.month}>{month}</Text>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((weekday) => (
            <Text key={weekday} variant="caption" style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>

        {WEEKS.map((week, rowIndex) => (
          <View key={`week-${rowIndex}`} style={styles.weekRow}>
            {week.map((day, columnIndex) => {
              const completed = day != null && completedWorkoutDays.includes(day);
              const selected = day === selectedDay;
              const hasPhotos = day != null && photoDays.includes(day);

              return (
                <Pressable
                  key={`${rowIndex}-${columnIndex}`}
                  disabled={!day || !hasPhotos}
                  onPress={() => {
                    if (day && hasPhotos) onPressDay(day);
                  }}
                  style={({ pressed }) => [styles.dayCell, pressed && styles.pressed]}
                >
                  <View style={styles.markerWrap}>
                    {completed && <View style={styles.completedDot} />}
                    {selected && <View style={styles.selectedRing} />}
                  </View>
                  {day != null && (
                    <Text
                      variant="body"
                      style={[
                        styles.dayText,
                        completed && styles.dayTextComplete,
                        !completed && !selected && styles.dayTextMuted,
                      ]}
                    >
                      {day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  calendar: {
    flex: 1,
  },
  month: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.md,
  },
  weekday: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  weekRow: {
    minHeight: 62,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  markerWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
  },
  selectedRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: colors.textPrimary,
  },
  dayText: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
  },
  dayTextComplete: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dayTextMuted: {
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
