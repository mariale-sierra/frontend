import { Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../constants/theme';
import { Text } from '../../ui/text';

interface FilterToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

/** Category filter pill (Add-Exercises screen) — `big` radius, `primary`/`ink`
 * bold when active, `surface`/`paper` medium when inactive. */
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
      <Text variant="label" size="sm" weight={isActive ? 'bold' : 'medium'} inverse={isActive} tone={isActive ? 'primary' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
