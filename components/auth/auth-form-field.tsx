import { View } from 'react-native';
import type { ComponentProps } from 'react';
import { spacing, colors } from '../../constants/theme';
import { AuthInput } from './auth-input';
import { Text } from '../ui/text';

type AuthInputProps = ComponentProps<typeof AuthInput>;

interface AuthFormFieldProps extends Omit<AuthInputProps, 'error'> {
  /** Validation message shown under the field, same pattern as `FormField`. */
  error?: string | null;
}

/**
 * Auth-screen counterpart to `components/ui/formField.tsx`: wraps `AuthInput`
 * (recessed `ink` fill, `primary` focus border) with the same below-field
 * error message so login/register show validation errors the same way every
 * other form in the app does.
 */
export function AuthFormField({ error, ...inputProps }: AuthFormFieldProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AuthInput {...inputProps} error={Boolean(error)} />
      {error ? (
        <Text variant="caption" style={{ color: colors.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
