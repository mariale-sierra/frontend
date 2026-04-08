//divider component
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing } from '../../constants/theme';

interface DividerProps extends ViewProps {
  marginVertical?: keyof typeof spacing;
  marginHorizontal?: keyof typeof spacing;
}

export function Divider({
  marginVertical,
  marginHorizontal,
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
  divider: {
    height: 1,
    backgroundColor: colors.border, // gray color for divider
    width: '100%',
  },
});