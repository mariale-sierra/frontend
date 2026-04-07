import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { ViewProps } from 'react-native';

interface GradientBoxProps extends Omit<LinearGradientProps, 'colors'> {
  colors: readonly [string, string];
}

/**
 * GradientBox - A reusable gradient container
 * 
 * This component wraps expo-linear-gradient and provides a clean, type-safe interface
 * for applying gradient backgrounds. It accepts color arrays and gradient direction.
 * 
 * Usage:
 * <GradientBox
 *   colors={[colors.surfaceHighlight, colors.surface]}
 *   start={{ x: 0, y: 0 }}
 *   end={{ x: 1, y: 1 }}
 * >
 *   {children}
 * </GradientBox>
 */
export function GradientBox({
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  children,
  ...props
}: GradientBoxProps) {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[{ overflow: 'hidden' }, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}
