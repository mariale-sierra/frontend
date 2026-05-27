import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ActivityType } from '../../constants/theme';

interface ActivityIconProps {
  type: ActivityType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'circle' | 'plain' | 'dot';
  color?: string;
}

const containerSize = { xs: 18, sm: 28, md: 36, lg: 48 };
const iconSize = { xs: 12, sm: 18, md: 22, lg: 26 };
const dotSize = { xs: 6, sm: 8, md: 10, lg: 12 };

const iconMap: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell',
  cardioIntense: 'flash',
  flexibility: 'flower',
  cardioLow: 'leaf',
  mindBody: 'body',
  functional: 'musical-notes',
};

export function ActivityIcon({ type, size = 'md', variant = 'circle', color }: ActivityIconProps) {

  if (variant === 'dot') {
    const sz = dotSize[size];
    return (
      <View
        style={{
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          backgroundColor: colors.activityType[type],
        }}
      />
    );
  }

  if (variant === 'plain') {
    return (
      <Ionicons
        name={iconMap[type]}
        size={iconSize[size]}
        color={color ?? colors.textPrimary}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.activityType[type],
          width: containerSize[size],
          height: containerSize[size],
          borderRadius: containerSize[size] / 2,
        },
      ]}
    >
      <Ionicons
        name={iconMap[type]}
        size={iconSize[size]}
        color={colors.textPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});