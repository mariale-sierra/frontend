import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import type { ActivityType } from '../../types/activity';

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
  strength: 'barbell-outline',
  cardioIntense: 'flash-outline',
  flexibility: 'flower-outline',
  cardioLow: 'leaf-outline',
  mindBody: 'body-outline',
  functional: 'musical-notes-outline',
};

// Category is icon + name only now — no per-category color (see design
// system → Explicitly Rejected Patterns). Every variant renders in the same
// neutral tokens regardless of `type`; the icon glyph is still selected per
// category via iconMap above.
export function ActivityIcon({ type, size = 'md', variant = 'circle', color }: ActivityIconProps) {

  if (variant === 'dot') {
    const sz = dotSize[size];
    return (
      <View
        style={{
          width: sz,
          height: sz,
          borderRadius: sz / 2,
          backgroundColor: colors.paper,
        }}
      />
    );
  }

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
      <Ionicons
        name={iconMap[type]}
        size={iconSize[size]}
        color={colors.paper}
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
