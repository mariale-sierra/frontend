//divider component
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface DividerProps extends ViewProps {
  marginVertical?: keyof typeof spacing;
  marginHorizontal?: keyof typeof spacing;
  /** @deprecated hairlines always use the same opacity now — see design system → Components → Dividers. Kept only for call-site compatibility. */
  variant?: 'default' | 'section';
}

export function Divider({
  marginVertical,
  marginHorizontal,
  variant: _variant,
  style,
  ...props
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        marginVertical && { marginVertical: spacing[marginVertical] },
        marginHorizontal && { marginHorizontal: spacing[marginHorizontal] },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  // Hairlines ALWAYS use this exact opacity — see design system → Components → Dividers.
  divider: {
    height: 1,
    backgroundColor: withAlpha(colors.paper, 0.08),
    alignSelf: 'stretch',
  },
});
