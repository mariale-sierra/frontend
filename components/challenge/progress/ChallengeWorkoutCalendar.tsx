import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, spacing, typography } from '../../../constants/theme';
import { useChallengeCalendar } from '../../../hooks/useChallengeCalendar';
import type { CalendarCell } from '../../../utils/challengeCalendar';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface Props {
  width: number;
  startDate: Date;
  totalDays: number;
  completedWorkoutDays: number[];
  selectedDay: number | null;
  photoDays: number[];
  bottomInset: number;
  onPressDay: (challengeDay: number) => void;
}

interface DayCellProps {
  cell: CalendarCell | null;
  isSelected: boolean;
  onPress: (challengeDay: number) => void;
}

function DayCell({ cell, isSelected, onPress }: DayCellProps) {
  // Padding cell or day outside the challenge range — fully invisible, no structure
  if (!cell || cell.challengeDay === null) {
    return <View style={styles.dayCell} />;
  }

  const canPress = !cell.isFuture && cell.hasPhoto;

  // Text color priority: today/hasPhoto → bright white; completed-no-photo → secondary gray;
  // anything else past → muted; future → dim
  const textStyle = [
    styles.dayText,
    cell.isToday || cell.hasPhoto
      ? styles.dayTextBright
      : cell.isCompleted
      ? styles.dayTextNoPhoto
      : cell.isFuture
      ? styles.dayTextFuture
      : styles.dayTextMuted,
  ];

  return (
    <Pressable
      disabled={!canPress}
      onPress={() => {
        if (cell.challengeDay !== null) onPress(cell.challengeDay);
      }}
      style={({ pressed }) => [styles.dayCell, pressed && canPress && styles.pressed]}
    >
      <View style={styles.markerWrap}>
        {cell.hasPhoto && <View style={styles.completedDot} />}
        {isSelected && <View style={styles.selectedRing} />}
      </View>
      <Text style={textStyle}>{cell.dayOfMonth}</Text>
    </Pressable>
  );
}

export function ChallengeWorkoutCalendar({
  width,
  startDate,
  totalDays,
  completedWorkoutDays,
  selectedDay,
  photoDays,
  bottomInset,
  onPressDay,
}: Props) {
  const months = useChallengeCalendar(startDate, totalDays, completedWorkoutDays, photoDays);

  return (
    <ScrollView
      style={[styles.page, { width }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + spacing['2xl'] },
      ]}
      showsVerticalScrollIndicator={false}
      directionalLockEnabled
      nestedScrollEnabled
      bounces
    >
      {months.map((calMonth) => (
        <View key={`${calMonth.year}-${calMonth.month}`} style={styles.monthSection}>
          <Text style={styles.monthHeader}>{calMonth.label}</Text>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((wd) => (
              <Text key={wd} style={styles.weekday}>{wd}</Text>
            ))}
          </View>

          <View style={styles.weekdayUnderline} />

          {calMonth.weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((cell, ci) => (
                <DayCell
                  key={ci}
                  cell={cell}
                  isSelected={cell?.challengeDay === selectedDay && selectedDay !== null}
                  onPress={onPressDay}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing['2xl'],
  },
  monthSection: {
    gap: 0,
  },
  monthHeader: {
    ...typography.header,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
  },
  weekday: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  weekdayUnderline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 0,
  },
  weekRow: {
    minHeight: 62,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  markerWrap: {
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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
  // Has a photo → bright white, clearly tappable
  dayTextBright: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Completed but no photo uploaded yet → secondary gray, not tappable
  dayTextNoPhoto: {
    color: colors.textSecondary,
  },
  // Past challenge day, not yet completed
  dayTextMuted: {
    color: colors.textMuted,
  },
  // Future days not yet reached
  dayTextFuture: {
    color: colors.textMuted,
    opacity: 0.22,
  },
  pressed: {
    opacity: 0.7,
  },
});
