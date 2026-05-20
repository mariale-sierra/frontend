import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface RestDayIconButtonProps {
  onPress: () => void;
}

const SIZE = 44;

export function RestDayIconButton({ onPress }: RestDayIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Mark as rest day"
    >
      <View style={styles.container}>
        <View style={styles.bloomOuter} />
        <View style={styles.bloomMid} />
        <View style={styles.bloomCore} />
        <View style={styles.iconGlow}>
          <Ionicons name="moon" size={18} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: SIZE / 2,
  },
  pressed: {
    opacity: 0.7,
  },
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomOuter: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: withAlpha(colors.restDayNeon, 0.09),
  },
  bloomMid: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: withAlpha(colors.restDayNeon, 0.16),
  },
  bloomCore: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: withAlpha(colors.restDayNeon, 0.25),
  },
  iconGlow: {
    shadowColor: colors.restDayNeon,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 10,
  },
});
