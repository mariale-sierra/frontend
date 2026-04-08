import {
  View,
  Pressable,
  StyleSheet,
  ViewProps,
  PressableProps,
} from 'react-native';
import { spacing } from '../../constants/theme';

// Justify content horizontally
type Justify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around';

// Align items vertically
type Align = 'flex-start' | 'center' | 'flex-end';

interface RowProps extends ViewProps {
  justify?: Justify;
  align?: Align;
  gap?: keyof typeof spacing;
  padding?: keyof typeof spacing;

  pressable?: boolean;
  onPress?: () => void;
}

export function Row({
  children,
  justify = 'space-between',
  align = 'center',
  gap = 'sm',
  padding,
  pressable = false,
  onPress,
  style,
  ...props
}: RowProps) {
  const baseStyle = [
    styles.row,
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
  row: {
    flexDirection: 'row',
  },
  pressed: {
    opacity: 0.8,
  },
});