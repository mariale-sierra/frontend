import { StyleSheet, TextInput, ViewProps, View } from 'react-native';
import { Text } from '../../ui/text';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface ExerciseInputProps extends Omit<ViewProps, 'children'> {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}

/**
 * ExerciseInput - Reusable input field component for exercise metrics
 * with the consistent styling used throughout the routine builder.
 * Combines field wrapper + TextInput with exercise-specific styling.
 */

export function ExerciseInput({
  label,
  value,
  onChangeText,
  placeholder = '0',
  keyboardType = 'numeric',
  style,
  ...props
}: ExerciseInputProps) {
  return (
    <View style={[styles.field, style]} {...props}>
      <Text variant="label" tone="secondary">{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={withAlpha(colors.paper, textOpacity.tertiary)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 40,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.12),
    color: colors.paper,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
