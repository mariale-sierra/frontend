import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarIconProps {
  size?: AvatarSize;
}

export function AvatarIcon({ size = 'md' }: AvatarIconProps) {
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

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize[size],
          height: containerSize[size],
          borderRadius: containerSize[size] / 2,
          backgroundColor: colors.surfaceHighlight, // neutral gray
        },
      ]}
    >
      <Ionicons
        name="person"
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