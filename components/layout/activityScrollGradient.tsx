import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, getActivityGradient, type ActivityType } from '../../constants/theme';

interface ActivityScrollGradientProps {
  children: ReactNode;
  activityType: ActivityType;
  style?: StyleProp<ViewStyle>;
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return hex;
  }

  const value = Math.max(0, Math.min(1, alpha));
  const suffix = Math.round(value * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `#${normalized}${suffix}`;
}

export default function ActivityScrollGradient({
  children,
  activityType,
  style,
}: ActivityScrollGradientProps) {
  const [startColor] = getActivityGradient(activityType);

  return (
    <View style={[styles.gradient, style]}>
      <LinearGradient
        colors={[
          withAlpha(startColor, 0.86),
          withAlpha(startColor, 0.3),
          'rgba(0,0,0,0)',
        ]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topGradient}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    backgroundColor: colors.background,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 285,
  },
});
