//move to better folder 
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';

export type LocationType =
  | 'home'
  | 'outdoor'
  | 'gym'
  | 'studio'
  | 'anywhere';

interface LocationIconProps {
  type: LocationType;
  size?: 'sm' | 'md' | 'lg';
}

export function LocationIcon({ type, size = 'md' }: LocationIconProps) {
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

  const iconMap: Record<LocationType, keyof typeof Ionicons.glyphMap> = {
    home: 'home',
    outdoor: 'walk',          // 🔥 updated
    gym: 'fitness',
    studio: 'people',
    anywhere: 'globe-outline',
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceAccent, // gray circle
          width: containerSize[size],
          height: containerSize[size],
          borderRadius: containerSize[size] / 2,
        },
      ]}
    >
      <Ionicons
        name={iconMap[type]}
        size={iconSize[size]}
        color={colors.textPrimary} // white
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