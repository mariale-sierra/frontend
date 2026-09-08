import { ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../constants/theme';

interface RestDayScreenBackgroundProps extends ViewProps {
  children: ReactNode;
  applyTopInset?: boolean;
}

/**
 * Solid `rest`-purple base with a soft `paper`-white radial highlight,
 * top-center, fading to transparent — the Rest-Or-Plan-28C wireframe's
 * background. A second, deliberate exception to "no gradients" beyond
 * `ScreenBackground` itself (see design system → Explicitly Rejected
 * Patterns), confirmed by the user specifically for the rest-day
 * configuration and plan-rest-days screens — not a general-purpose
 * background, don't reuse elsewhere without checking first. Same
 * `react-native-svg` mechanism `ScreenBackground` already uses, just a
 * different shape (one solid-color base + one highlight, not two glows over
 * a dark base).
 */
export function RestDayScreenBackground({
  children,
  applyTopInset = true,
  style,
  ...props
}: RestDayScreenBackgroundProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="restHighlight" cx="50%" cy="0%" r="60%">
              <Stop offset="0%" stopColor={colors.paper} stopOpacity={0.55} />
              <Stop offset="100%" stopColor={colors.paper} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#restHighlight)" />
        </Svg>
      </View>

      <View style={[styles.content, applyTopInset && { paddingTop: insets.top }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.rest,
  },
  content: {
    flex: 1,
  },
});
