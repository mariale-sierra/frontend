import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientBox } from '../layout/gradient-box';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Text } from '../ui/text';
import { colors, gradients, radius, spacing } from '../../constants/theme';
import type { RoutineSummary } from '../../types/routine';

export interface CycleDayAssignmentPanelProps {
  dayNumber: number;
  routine?: RoutineSummary;
  onPressAssign?: () => void;
  onPressRemove?: () => void;
}

export function CycleDayAssignmentPanel({
  dayNumber,
  routine,
  onPressAssign,
  onPressRemove,
}: CycleDayAssignmentPanelProps) {
  const hasRoutine = Boolean(routine);
  const isRestDay = Boolean(routine?.isRestDay);
  const cardGradient = isRestDay ? gradients.restDay : gradients.surface;

  return (
    <Pressable
      onPress={onPressAssign}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <GradientBox
        colors={cardGradient.colors}
        start={cardGradient.start}
        end={cardGradient.end}
        style={styles.card}
      >
        {/* Minus remove button — only when a routine is assigned */}
        {hasRoutine && (
          <Pressable
            onPress={onPressRemove}
            hitSlop={12}
            style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
          >
            <Ionicons name="remove" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}

        <Stack gap="xs">
          <Text variant="caption" style={styles.dayLabel}>Day {dayNumber}</Text>

          {hasRoutine ? (
            <>
              <Text variant="body" style={styles.routineName}>{routine?.name}</Text>
              <Text variant="caption" style={styles.routineMeta}>
                {routine?.isRestDay
                  ? 'Rest · Recovery or complete rest'
                  : `${routine?.exercises.length ?? 0} exercises`}
              </Text>
            </>
          ) : (
            <>
              <Text variant="body" style={styles.emptyTitle}>Assign routine</Text>
              <Text variant="caption" style={styles.emptyMeta}>
                Tap to select a routine or mark as rest day.
              </Text>
            </>
          )}
        </Stack>
      </GradientBox>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    padding: spacing.lg,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removePressed: {
    opacity: 0.65,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.52)',
  },
  routineName: {
    fontWeight: '600',
  },
  routineMeta: {
    color: 'rgba(255,255,255,0.62)',
    marginTop: spacing.xs,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.85)',
  },
  emptyMeta: {
    color: 'rgba(255,255,255,0.48)',
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.82,
  },
});

