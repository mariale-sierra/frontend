import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, ActivityType } from '../../constants/theme';

interface ActivityIconProps {
  type: ActivityType;
  size?: 'sm' | 'md' | 'lg';
}

export function ActivityIcon({ type, size = 'md' }: ActivityIconProps) {
  const containerSize = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconMap: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {

    strength: 'barbell',

    cardioIntense: 'flash', 

    flexibility: 'flower', 

    cardioLow: 'leaf', 

    mindBody: 'body', 

    functional: 'musical-notes', 
  };

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
        color={colors.textInverse} // white
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