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