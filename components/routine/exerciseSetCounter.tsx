import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { colors, spacing } from '../../constants/theme';

interface ExerciseSetCounterProps {
  count: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export function ExerciseSetCounter({ count, onIncrease, onDecrease }: ExerciseSetCounterProps) {
  const decreaseDisabled = count <= 1;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onDecrease}
        disabled={decreaseDisabled}
        style={({ pressed }) => [
          styles.counterButton,
          decreaseDisabled && styles.counterButtonDisabled,
          pressed && !decreaseDisabled && styles.pressed,
        ]}
      >
        <Text variant="label" style={styles.counterSymbol}>-</Text>
      </Pressable>

      <Text variant="caption" style={styles.counterLabel}>{`SETS ${count}`}</Text>

      <Pressable onPress={onIncrease} style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}>
        <Text variant="label" style={styles.counterSymbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  counterButton: {
    minWidth: 22,
    minHeight: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterSymbol: {
    color: colors.textPrimary,
    lineHeight: 18,
  },
  counterLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.9,
    minWidth: 56,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});