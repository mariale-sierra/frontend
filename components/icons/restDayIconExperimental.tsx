import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface RestDayIconExperimentalProps {
  size?: number;
}

export function RestDayIconExperimental({ size = 80 }: RestDayIconExperimentalProps) {
  return (
    <View style={styles.container}>
      {/* Diffuse outer bloom */}
      <View style={styles.bloomOuter} />
      {/* Mid bloom */}
      <View style={styles.bloomMid} />
      {/* Tight core bloom */}
      <View style={styles.bloomCore} />

      {/* Moon with neon glow shadow */}
      <View style={styles.iconGlow}>
        <Ionicons name="moon" size={size} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: withAlpha(colors.rest, 0.07),
  },
  bloomMid: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: withAlpha(colors.rest, 0.13),
  },
  bloomCore: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: withAlpha(colors.rest, 0.20),
  },
  iconGlow: {
    shadowColor: colors.rest,
    shadowOpacity: 0.88,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 16,
  },
});
