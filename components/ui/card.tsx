import {
  View,
  StyleSheet,
  ViewProps,
  Pressable,
  PressableProps,
} from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

/**
 * CardVariant defines the available card styles:
 * - basic: `surface` background, for standard cards
 * - basicGlass: slightly lighter surface with subtle translucency and soft shadow
 * - outline: `ink` background with a neutral `paper`-hairline border
 * - outlineGlow: `outline`, plus a soft shadow
 *
 * `activityOutline`/`activityOutlineGlow` (bordered/glowing per workout
 * category color) are retired — see design system → Explicitly Rejected
 * Patterns. `outline`/`outlineGlow` are their flat, non-color-coded
 * replacements; the old variant names still resolve to them below so
 * existing call sites keep compiling during migration.
 */
type CardVariant =
  | 'basic'
  | 'basicGlass'
  | 'outline'
  | 'outlineGlow'
  | 'activityOutline'
  | 'activityOutlineGlow';

interface CardProps extends Omit<ViewProps, 'onPress'> {
  variant?: CardVariant;
  /** @deprecated category is never color-coded now — this prop has no effect. Kept for call-site compatibility. */
  activityType?: string;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  radius?: keyof typeof radius;
}

export function Card({
  variant = 'basic',
  activityType: _activityType,
  onPress,
  padding = 'md',
  radius: radiusSize = 'medium',
  style,
  children,
  ...props
}: CardProps) {
  const baseStyle = {
    padding: spacing[padding],
    borderRadius: radius[radiusSize],
  };

  const variantStyle = getVariantStyle(variant);

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

function getVariantStyle(variant: CardVariant) {
  switch (variant) {
    case 'basic':
      return {
        backgroundColor: colors.surface,
      };

    case 'basicGlass':
      return {
        backgroundColor: withAlpha(colors.surface, 0.42),
        borderWidth: 1,
        borderColor: withAlpha(colors.paper, 0.14),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 14,
        overflow: 'visible' as const,
      };

    case 'outline':
    case 'activityOutline':
      return {
        backgroundColor: colors.ink,
        borderWidth: 1,
        borderColor: withAlpha(colors.paper, 0.08),
      };

    case 'outlineGlow':
    case 'activityOutlineGlow':
      return {
        backgroundColor: colors.ink,
        borderWidth: 1,
        borderColor: withAlpha(colors.paper, 0.08),
        shadowColor: '#000',
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
