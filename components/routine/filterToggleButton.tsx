import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from '../ui/text';

interface FilterToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function FilterToggleButton({ label, isActive, onPress }: FilterToggleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isActive && styles.buttonActive,
        pressed && styles.pressed,
      ]}
    >
      <Text
        variant="caption"
        style={[
          styles.buttonText,
          isActive && styles.buttonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    backgroundColor: colors.background,
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  buttonTextActive: {
    color: colors.textInverse,
  },
  pressed: {
    opacity: 0.75,
  },
});
