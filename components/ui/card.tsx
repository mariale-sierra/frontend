import {
  View,
  StyleSheet,
  ViewProps,
  Pressable,
  PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, ActivityType } from '../../constants/theme';

/**
 * CardVariant defines the available card styles:
 * - basic: Dark gray background (#1C1C1E), for standard cards
 * - info: Black background with white border, for informational cards
 * - infoGradient: Light dark gray gradient (#3C3C3E), for highlighted info cards
 * - streak: Black background with colored border (based on activityType), for streak cards
 * - activity: Black background with colored border (based on activityType), for activity cards
 */
type CardVariant =
  | 'basic'
  | 'info'
  | 'infoGradient'
  | 'streak'
  | 'activity';

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
  radius: radiusSize = 'md',
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

  if (variant === 'infoGradient') {
    const gradientProps = {
      colors: [colors.surfaceHighlight, colors.surface] as const,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      style: [styles.card, cardStyles],
    };

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => pressed && styles.pressed}
          {...(props as PressableProps)}
        >
          <LinearGradient {...gradientProps}>
            {children}
          </LinearGradient>
        </Pressable>
      );
    }

    return (
      <LinearGradient {...gradientProps} {...props}>
        {children}
      </LinearGradient>
    );
  }

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

    case 'info':
      return {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.textPrimary,
      };

    case 'infoGradient':
      return {};

    case 'streak':
      return {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: activityType
          ? colors.activityType[activityType]
          : colors.border,
      };

    case 'activity':
      return {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: activityType
          ? colors.activityType[activityType]
          : colors.border,

        // Subtle glow effect matching the activity category color
        shadowColor: activityType
          ? colors.activityType[activityType]
          : '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
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