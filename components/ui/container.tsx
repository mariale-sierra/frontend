import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, Spacing } from '../../constants/theme';

/**
 * ContainerVariant defines the available container background styles:
 * - background: Black background (#000000), for main app background
 * - surface: Dark gray background (#1C1C1E), for elevated surfaces
 * - surfaceElevated: Medium dark gray background (#2C2C2E), for more elevated surfaces
 * - surfaceHighlight: Light dark gray background (#3C3C3E), for highlighted surfaces
 */
type ContainerVariant =
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'surfaceHighlight';

/**
 * ContainerProps defines all configurable props for the Container component.
 *
 * In addition to the custom props below, this interface extends React Native
 * `ViewProps`, so native props like `testID`, accessibility props, and event
 * handlers can also be passed.
 *
 * @property paddingHorizontal - Horizontal spacing token applied as left/right padding
 * @property paddingVertical - Vertical spacing token applied as top/bottom padding
 * @property padding - Shared spacing token used for both axes when axis-specific values are not provided
 * @property centered - When true, centers children on both axes (default: false)
 * @property variant - Background style variant for the container (default: 'background')
 */
interface ContainerProps extends ViewProps {
  paddingHorizontal?: Spacing;
  paddingVertical?: Spacing;
  padding?: Spacing;
  centered?: boolean;
  variant?: ContainerVariant;
}

export function Container({
  padding,
  paddingHorizontal,
  paddingVertical,
  centered = false,
  variant = 'background',
  style,
  children,
  ...props
}: ContainerProps) {
  const paddingH = paddingHorizontal ?? padding ?? 'md';
  const paddingV = paddingVertical ?? padding ?? 'md';

  const backgroundColor =
    variant === 'surface'
      ? colors.surface
      : variant === 'surfaceElevated'
      ? colors.surfaceElevated
      : colors.background;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingHorizontal: spacing[paddingH],
          paddingVertical: spacing[paddingV],
        },
        centered && styles.centered,
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});