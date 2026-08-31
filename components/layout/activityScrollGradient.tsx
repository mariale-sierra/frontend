import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';
import type { ActivityType } from '../../types/activity';

interface ActivityScrollGradientProps {
  children: ReactNode;
  /** @deprecated per-category gradient hero glow is retired — see design system → Explicitly Rejected Patterns. Kept for call-site compatibility; has no visual effect now. */
  activityType?: ActivityType;
  style?: StyleProp<ViewStyle>;
}

// Used to render a colored gradient glow keyed to the challenge's dominant
// workout category. Gradients (and per-category color) are both retired —
// see design system → Explicitly Rejected Patterns — so this is now a flat
// `ink` wrapper. Kept as its own component (rather than inlined at the call
// site) only so `app/challenge/[id]/index.tsx` doesn't need restructuring
// ahead of its own wireframe pass.
export default function ActivityScrollGradient({
  children,
  style,
}: ActivityScrollGradientProps) {
  return <View style={[styles.wrap, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    flex: 1,
    backgroundColor: colors.ink,
  },
});
