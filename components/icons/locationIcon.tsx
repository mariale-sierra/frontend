import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export type LocationType =
  | 'home'
  | 'outdoor'
  | 'gym'
  | 'studio'
  | 'anywhere';

interface LocationIconProps {
  type: LocationType;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'circle' | 'plain';
  color?: string;
}

const containerSize = { xs: 18, sm: 28, md: 36, lg: 48 };
const iconSize = { xs: 12, sm: 18, md: 22, lg: 26 };

// Outline-only, per design system → Icons. No per-location color — icon +
// name only, same treatment ActivityIcon already established for workout
// category (see design system → Explicitly Rejected Patterns).
const iconMap: Record<LocationType, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  outdoor: 'trail-sign-outline',
  gym: 'barbell-outline',
  studio: 'business-outline',
  anywhere: 'checkmark-circle-outline',
};

export function LocationIcon({ type, size = 'md', variant = 'circle', color }: LocationIconProps) {
  if (variant === 'plain') {
    return (
      <Ionicons
        name={iconMap[type]}
        size={iconSize[size]}
        color={color ?? colors.paper}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          width: containerSize[size],
          height: containerSize[size],
          borderRadius: containerSize[size] / 2,
        },
      ]}
    >
      <Ionicons name={iconMap[type]} size={iconSize[size]} color={colors.paper} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
