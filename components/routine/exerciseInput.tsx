import { StyleSheet, TextInput, ViewProps, View } from 'react-native';
import { Text } from '../ui/text';
import { colors, radius, spacing } from '../../constants/theme';

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
      <Text variant="label" style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  fieldLabel: {
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  input: {
    minHeight: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.24)',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
