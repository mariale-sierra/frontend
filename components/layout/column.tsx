import {
  View,
  Pressable,
  StyleSheet,
  ViewProps,
  PressableProps,
  FlexAlignType,
} from 'react-native';
import { spacing } from '../../constants/theme';

// Main axis distribution for a column layout.

type Justify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around';

// Cross axis alignment for a column layout.

type Align = Extract<FlexAlignType, 'flex-start' | 'center' | 'flex-end' | 'stretch'>;

interface ColumnProps extends ViewProps {
  justify?: Justify;
  align?: Align;

  gap?: keyof typeof spacing;
  padding?: keyof typeof spacing;

  pressable?: boolean;
  onPress?: () => void;
}

export function Column({
  children,
  justify = 'flex-start',
  align = 'stretch',
  gap = 'sm',
  padding,
  pressable = false,
  onPress,
  style,
  ...props
}: ColumnProps) {
  const baseStyle = [
    styles.column,
    {
      justifyContent: justify,
      alignItems: align,
      gap: spacing[gap],
      ...(padding && { padding: spacing[padding] }),
    },
    style,
  ];

  if (pressable) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          pressed && styles.pressed,
        ]}
        {...(props as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={baseStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  pressed: {
    opacity: 0.8,
  },
});