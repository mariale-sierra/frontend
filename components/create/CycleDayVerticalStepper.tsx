import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';

export type CycleDayStatus = 'empty' | 'configured' | 'rest';

export interface CycleDayVerticalStepperProps {
  days: number[];
  selectedDay: number;
  getDayStatus?: (dayNumber: number) => CycleDayStatus;
  getDayRoutineLabel?: (dayNumber: number) => string | undefined;
  getDayRoutineDescription?: (dayNumber: number) => string | undefined;
  onSelectDay?: (dayNumber: number) => void;
  onPressAssignRoutine?: (dayNumber: number) => void;
}

function getStepState(params: {
  dayNumber: number;
  selectedDay: number;
  dayStatus: CycleDayStatus;
}): 'completed' | 'current' | 'pending' {
  const { dayNumber, selectedDay, dayStatus } = params;

  if (dayNumber === selectedDay) {
    return 'current';
  }

  if (dayStatus !== 'empty') {
    return 'completed';
  }

  return 'pending';
}

export function CycleDayVerticalStepper({
  days,
  selectedDay,
  getDayStatus,
  getDayRoutineLabel,
  getDayRoutineDescription,
  onSelectDay,
  onPressAssignRoutine,
}: CycleDayVerticalStepperProps) {
  return (
    <View style={styles.container}>
      {days.map((dayNumber, index) => {
        const isLast = index === days.length - 1;
        const dayStatus = getDayStatus?.(dayNumber) ?? 'empty';
        const stepState = getStepState({ dayNumber, selectedDay, dayStatus });
        const routineLabel = getDayRoutineLabel?.(dayNumber);
        const routineDescription = getDayRoutineDescription?.(dayNumber);
        const stepLabel = routineLabel || `Day ${dayNumber}`;

        return (
          <Pressable
            key={`vertical-step-${dayNumber}`}
            onPress={() => {
              if (dayNumber === selectedDay) {
                onPressAssignRoutine?.(dayNumber);
                return;
              }

              onSelectDay?.(dayNumber);
            }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={styles.indicatorColumn}>
              <View
                style={[
                  styles.circle,
                  stepState === 'completed' && styles.circleCompleted,
                  stepState === 'current' && styles.circleCurrent,
                ]}
              >
                {stepState === 'completed' ? (
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                ) : (
                  <View style={[styles.innerDot, stepState === 'pending' && styles.innerDotPending]} />
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    stepState !== 'pending' && styles.connectorCompleted,
                  ]}
                />
              )}
            </View>

            <View style={styles.rowContent}>
              <Text variant="body" style={styles.stepTitle}>{stepLabel}</Text>
              {routineDescription ? (
                <Text
                  variant="caption"
                  style={styles.stepMeta}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {routineDescription}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 64,
  },
  indicatorColumn: {
    width: 28,
    alignItems: 'center',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.textPrimary,
  },
  circleCurrent: {
    borderColor: colors.textPrimary,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  innerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textPrimary,
  },
  innerDotPending: {
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  connector: {
    width: 1,
    flex: 1,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  connectorCompleted: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepMeta: {
    marginTop: spacing.xxs,
    color: 'rgba(255,255,255,0.72)',
  },
  pressed: {
    opacity: 0.84,
  },
});
