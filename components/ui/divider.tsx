//divider component
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface DividerProps extends ViewProps {
  marginVertical?: keyof typeof spacing;
  marginHorizontal?: keyof typeof spacing;
  variant?: 'default' | 'section';
}

export function Divider({
  marginVertical,
  marginHorizontal,
  variant = 'default',
  style,
  ...props
}: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        variant === 'section' && styles.sectionDivider,
        marginVertical && { marginVertical: spacing[marginVertical] },
        marginHorizontal && { marginHorizontal: spacing[marginHorizontal] },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
  sectionDivider: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});