import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/text';
import { colors, spacing, type ActivityType } from '../../constants/theme';
import ChallengeRoutineDayCard from './challengeRoutineDayCard';

type RoutineItem = {
  day: number;
  title: string;
  description: string;
  activities: ActivityType[];
};

type Props = {
  routine: RoutineItem[];
  onPressDay?: (day: number) => void;
};

export default function ChallengeRoutineList({
  routine,
  onPressDay,
}: Props) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  const weekGroups = useMemo(() => {
    const sorted = [...routine].sort((a, b) => a.day - b.day);
    const groups: RoutineItem[][] = [];

    for (let index = 0; index < sorted.length; index += 7) {
      groups.push(sorted.slice(index, index + 7));
    }

    return groups;
  }, [routine]);

  const showWeekPicker = routine.length > 7;
  const activeDays = showWeekPicker
    ? weekGroups[selectedWeekIndex] ?? []
    : [...routine].sort((a, b) => a.day - b.day);

  const maxWeekIndex = Math.max(0, weekGroups.length - 1);

  return (
    <View style={styles.container}>
      <View style={styles.sectionRow}>
        <Text variant="subheader" style={styles.sectionLabel}>Days Summary</Text>

        {showWeekPicker && (
          <View style={styles.weekPickerWrap}>
            <Pressable
              onPress={() => setWeekPickerOpen((current) => !current)}
              style={({ pressed }) => [styles.weekPickerButton, pressed && styles.pressed]}
            >
              <Text variant="label" style={styles.weekPickerLabel}>
                Week {Math.min(selectedWeekIndex + 1, maxWeekIndex + 1)}
              </Text>
              <Ionicons
                name={weekPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textPrimary}
              />
            </Pressable>

            {weekPickerOpen && (
              <View style={styles.weekPickerList}>
                {weekGroups.map((_week, index) => {
                  const isActive = index === selectedWeekIndex;

                  return (
                    <Pressable
                      key={`week-${index + 1}`}
                      onPress={() => {
                        setSelectedWeekIndex(index);
                        setWeekPickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.weekPickerOption,
                        isActive && styles.weekPickerOptionActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text variant="body">Week {index + 1}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.dayList}>
        {activeDays.map((item) => {
          const primaryIcon = item.activities[0];

          return (
            <ChallengeRoutineDayCard
              key={`day-${item.day}`}
              day={item.day}
              title={item.title}
              activity={primaryIcon}
              onPress={() => onPressDay?.(item.day)}
            />
          );
        })}
      </View>

      <Text variant="label" style={styles.repeatLabel}>Repeat until challenge ends</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    opacity: 0.9,
    textTransform: 'none',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  weekPickerWrap: {
    position: 'relative',
  },
  weekPickerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  weekPickerLabel: {
    color: colors.textPrimary,
  },
  weekPickerList: {
    marginTop: spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(15,15,16,0.9)',
    overflow: 'hidden',
  },
  weekPickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  weekPickerOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dayList: {
    gap: spacing.md,
  },
  repeatLabel: {
    marginTop: spacing.lg,
    textAlign: 'center',
    opacity: 0.8,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.86,
  },
});