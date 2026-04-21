import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '../ui/icon';
import { colors, radius, spacing } from '../../constants/theme';

interface RestDayIconButtonProps {
  onPress: () => void;
}

export function RestDayIconButton({ onPress }: RestDayIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Mark as rest day"
    >
      <Icon name="moon-outline" size={18} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.88,
  },
});
