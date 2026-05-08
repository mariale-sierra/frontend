import { ReactNode } from 'react';
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import { colors, getActivityGradient, type ActivityType } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface ActivityScrollGradientProps {
  children: ReactNode;
  activityType: ActivityType;
  style?: StyleProp<ViewStyle>;
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
        colors={[withAlpha(startColor, 1), withAlpha(startColor, 0.4), 'rgba(0,0,0,0)']}
        locations={[0, 0.2, 0.45]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroLayer}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[withAlpha(startColor, 1), withAlpha(startColor, 0.4), 'rgba(0,0,0,0)']}
        locations={[0, 0.2, 0.45]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroLayer}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    flex: 1,
    backgroundColor: '#000000',
  },
  heroLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
  },
});