// stack component
import { View, StyleSheet, ViewProps } from 'react-native';
import { spacing } from '../../constants/theme';

type Justify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around';

type Align = 'flex-start' | 'center' | 'flex-end' | 'stretch';

interface StackProps extends ViewProps {
  gap?: keyof typeof spacing;
  align?: Align;
  justify?: Justify;
}

export function Stack({
  children,
  gap = 'sm',
  align = 'stretch',
  justify = 'flex-start',
  style,
  ...props
}: StackProps) {
  return (
    <View
      style={[
        styles.stack,
        {
          gap: spacing[gap],
          alignItems: align,
          justifyContent: justify,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'column',
  },
});