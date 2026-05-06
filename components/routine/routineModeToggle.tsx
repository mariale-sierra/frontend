import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';

export type RoutineMode = 'workout' | 'rest';

interface RoutineModeToggleProps {
  value: RoutineMode;
  onChange: (nextMode: RoutineMode) => void;
}

function ToggleOption({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        active && styles.optionActive,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="label" style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function RoutineModeToggle({ value, onChange }: RoutineModeToggleProps) {
  return (
    <View style={styles.shell}>
      <ToggleOption
        active={value === 'workout'}
        label="Workout"
        onPress={() => onChange('workout')}
      />
      <ToggleOption
        active={value === 'rest'}
        label="Rest day"
        onPress={() => onChange('rest')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.xxs,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: colors.textPrimary,
  },
  optionLabel: {
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  optionLabelActive: {
    color: colors.textInverse,
  },
  pressed: {
    opacity: 0.85,
  },
});