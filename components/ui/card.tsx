import {
  View,
  StyleSheet,
  ViewProps,
  Pressable,
  PressableProps,
} from 'react-native';
import { colors, radius, spacing, ActivityType } from '../../constants/theme';

/**
 * CardVariant defines the available card styles:
 * - basic: Dark gray background (#1C1C1E), for standard cards
 * - activityOutline: Black background with colored border (based on activityType), for streak cards
 * - activityOutlineGlow: Black background with colored border (based on activityType), for activity cards
 */
type CardVariant =
  | 'basic'
  | 'activityOutline'
  | 'activityOutlineGlow';

interface CardProps extends Omit<ViewProps, 'onPress'> {
  variant?: CardVariant;
  activityType?: ActivityType;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  radius?: keyof typeof radius;
}

export function Card({
  variant = 'basic',
  activityType,
  onPress,
  padding = 'md',
  radius: radiusSize = 'xl',
  style,
  children,
  ...props
}: CardProps) {
  const baseStyle = {
    padding: spacing[padding],
    borderRadius: radius[radiusSize],
  };

  const variantStyle = getVariantStyle(variant, activityType);

  const cardStyles = [baseStyle, variantStyle, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, cardStyles, pressed && styles.pressed]}
        {...(props as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, cardStyles]} {...props}>
      {children}
    </View>
  );
}

// VARIANT LOGIC

function getVariantStyle(variant: CardVariant, activityType?: ActivityType) {
  switch (variant) {
    case 'basic':
      return {
        backgroundColor: colors.surface,
      };

    case 'activityOutline':
      return {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: activityType
          ? colors.activityType[activityType]
          : colors.border,
      };

    case 'activityOutlineGlow':
      return {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: activityType
          ? colors.activityType[activityType]
          : colors.border,

        // Strong glow effect matching the activity category color
        shadowColor: activityType
          ? colors.activityType[activityType]
          : '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 15,
        overflow: 'visible' as const,
      };

    default:
      return {};
  }
}

// BASE STYLES

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
});