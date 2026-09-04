import type { ComponentProps } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { AuthFormField } from '../auth/auth-form-field';

type AuthFormFieldProps = ComponentProps<typeof AuthFormField>;

interface ControlledAuthFieldProps<TFieldValues extends FieldValues>
  extends Omit<AuthFormFieldProps, 'value' | 'onChangeText' | 'error'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
}

/**
 * Auth-screen counterpart to `ControlledFormField` — same react-hook-form
 * wiring, rendered through `AuthFormField` (the auth-screen input variant)
 * instead of the default `FormField`. `AuthInput` tracks its own focus
 * state internally and doesn't expose `onBlur` to callers, so this doesn't
 * wire react-hook-form's `field.onBlur` through — validation here runs on
 * submit (via the zod resolver), not on blur.
 */
export function ControlledAuthField<TFieldValues extends FieldValues>({
  control,
  name,
  ...fieldProps
}: ControlledAuthFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <AuthFormField
          {...fieldProps}
          value={typeof value === 'string' ? value : (value ?? '')}
          onChangeText={onChange}
          error={error?.message}
        />
      )}
    />
  );
}
