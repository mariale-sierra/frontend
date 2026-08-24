import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

// `variant` used to pick between several LinearGradient treatments (default/
// top/activity/challenges). Gradients are a rejected pattern in the design
// system (see havit-design-system-SKILL.md → Explicitly Rejected Patterns),
// and per-activity coloring is retired too, so every variant now renders the
// same flat `ink` screen background. The prop is kept — inert — purely so
// the ~25 screens that already pass it don't need editing until each of
// them gets its own wireframe pass.
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
