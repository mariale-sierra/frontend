import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

export type RoutineMode = 'workout' | 'rest';

interface RoutineModeToggleProps {
  value: RoutineMode;
  onChange: (nextMode: RoutineMode) => void;
}

function ToggleOption({
  active,
  color,
  label,
  onPress,
}: {
  active: boolean;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        active && { backgroundColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text
        variant="label"
        weight={active ? 'bold' : 'medium'}
        inverse={active}
        tone={active ? 'primary' : 'secondary'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Segmented control, per design system → Components → Segmented control:
// `surface` track, `big` radius, `xs` internal padding. Active segment reuses
// the standing `primary` (workout day) / `rest` (rest day) pairing already
// established everywhere else a day's workout/rest status needs a color
// (Today's-routine banner, ChallengeStatusCard, numbered cycle badges).
export function RoutineModeToggle({ value, onChange }: RoutineModeToggleProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.shell}>
      <ToggleOption
        active={value === 'workout'}
        color={colors.primary}
        label={t('routineSelect.modeToggle.workout')}
        onPress={() => onChange('workout')}
      />
      <ToggleOption
        active={value === 'rest'}
        color={colors.rest}
        label={t('routineSelect.modeToggle.rest')}
        onPress={() => onChange('rest')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    borderRadius: radius.big,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    height: 48,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
