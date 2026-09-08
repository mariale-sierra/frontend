import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../constants/theme';

// `variant` used to pick between several LinearGradient treatments (default/
// top/activity/challenges). Gradients-as-surface-fills are a rejected
// pattern in the design system (see havit-design-system-SKILL.md →
// Explicitly Rejected Patterns), and per-activity coloring is retired too,
// so every variant still renders the same base — just now with two soft
// `react-native-svg` radial glows behind it. This is the one confirmed
// exception to "no gradients" in the whole app — a single shared background
// treatment, not a per-component decoration — see the skill's Explicitly
// Rejected Patterns section. The prop itself is kept inert purely so the
// ~25 screens that already pass it don't need editing.
type ScreenBackgroundVariant = 'default' | 'top' | 'activity' | 'challenges';

interface ScreenBackgroundProps extends ViewProps {
  children: ReactNode;
  variant?: ScreenBackgroundVariant;
  contentStyle?: StyleProp<ViewStyle>;
  applyTopInset?: boolean;
}

export default function ScreenBackground({
  children,
  variant: _variant = 'default',
  style,
  contentStyle,
  applyTopInset = true,
  ...props
}: ScreenBackgroundProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, style]} {...props}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="glowPrimary" cx="15%" cy="0%" r="85%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.05} />
              <Stop offset="55%" stopColor={colors.primary} stopOpacity={0.025} />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="glowRest" cx="85%" cy="8%" r="80%">
              <Stop offset="0%" stopColor={colors.rest} stopOpacity={0.045} />
              <Stop offset="55%" stopColor={colors.rest} stopOpacity={0.023} />
              <Stop offset="100%" stopColor={colors.rest} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#glowPrimary)" />
          <Rect width="100%" height="100%" fill="url(#glowRest)" />
        </Svg>
      </View>

      <View
        style={[styles.content, applyTopInset && { paddingTop: insets.top }, contentStyle]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flex: 1,
  },
});
