import { View } from 'react-native';
import { spacing, colors } from '../../constants/theme';
import { Input } from './input';
import { Text } from './text';
import type { ComponentProps } from 'react';

type InputProps = ComponentProps<typeof Input>;

interface FormFieldProps extends Omit<InputProps, 'error'> {
  /** Validation message shown under the field; also tints the counter red. */
  error?: string | null;
}

/**
 * Reusable form field: label + Input + inline validation message. Wraps the
 * shared Input (which already renders the character counter when maxLength
 * is set) so every form in the app shows errors the same way.
 */
export function FormField({ error, ...inputProps }: FormFieldProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Input variant="filled" {...inputProps} error={Boolean(error)} />
      {error ? (
        <Text variant="caption" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
