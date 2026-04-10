import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

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
      style={[styles.base, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.surfaceHighlight,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
});
