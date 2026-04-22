import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';

export interface RoutineOption {
  id: number;
  name: string;
}

interface MetricsRoutineSelectorProps {
  routines: RoutineOption[];
  selectedRoutineId: number | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (routineId: number) => void;
}

export function MetricsRoutineSelector({
  routines,
  selectedRoutineId,
  isOpen,
  onToggle,
  onSelect,
}: MetricsRoutineSelectorProps) {
  const selectedRoutine =
    routines.find((routine) => routine.id === selectedRoutineId) ?? null;

  return (
    <View style={styles.container}>
      <Pressable style={({ pressed }) => [styles.trigger, pressed && styles.pressed]} onPress={onToggle}>
        <Text variant="caption" style={styles.eyebrow}>ROUTINE</Text>
        <Text variant="body" style={styles.routineLabel} numberOfLines={1}>
          {(selectedRoutine?.name ?? 'Select a routine').toUpperCase()}
        </Text>

        <View style={styles.chevronButton}>
          <Icon
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textPrimary}
          />
        </View>
      </Pressable>

      {isOpen && routines.length > 0 && (
        <View style={styles.menu}>
          {routines.map((routine, index) => {
            const isSelected = routine.id === selectedRoutineId;
            const isLast = index === routines.length - 1;

            return (
              <Pressable
                key={routine.id}
                onPress={() => onSelect(routine.id)}
                style={({ pressed }) => [
                  styles.option,
                  !isLast && styles.optionDivider,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body" style={styles.optionLabel} numberOfLines={1}>
                  {routine.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {isOpen && routines.length === 0 && (
        <View style={styles.menu}>
          <View style={styles.option}>
            <Text variant="body" tone="secondary">No routines yet.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  eyebrow: {
    color: colors.textSecondary,
    letterSpacing: 1.2,
  },
  routineLabel: {
    flex: 1,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  chevronButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  optionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.surfaceHighlight,
  },
  optionLabel: {
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.88,
  },
});
