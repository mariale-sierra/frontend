import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ActivityType } from '../../constants/theme';

interface ActivityIconProps {
  type: ActivityType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'circle' | 'plain';
}

const containerSize = { xs: 18, sm: 28, md: 36, lg: 48 };
const iconSize = { xs: 12, sm: 18, md: 22, lg: 26 };

const iconMap: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  strength: 'barbell',
  cardioIntense: 'flash',
  flexibility: 'flower',
  cardioLow: 'leaf',
  mindBody: 'body',
  functional: 'musical-notes',
};

export function ActivityIcon({ type, size = 'md', variant = 'circle' }: ActivityIconProps) {

  if (variant === 'plain') {
    return (
      <Ionicons
        name={iconMap[type]}
        size={iconSize[size]}
        color={colors.textPrimary}
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