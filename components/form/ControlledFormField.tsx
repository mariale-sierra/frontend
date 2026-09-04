import type { ComponentProps } from 'react';
import { Controller } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { FormField } from '../ui/formField';

type FormFieldProps = ComponentProps<typeof FormField>;

interface ControlledFormFieldProps<TFieldValues extends FieldValues>
  extends Omit<FormFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
}

/**
 * Connects a react-hook-form field to the shared `FormField` (label + Input +
 * inline error). Validation itself lives entirely in the zod schema passed to
 * `useForm`'s resolver — this component only wires react-hook-form's field
 * state to the visual component, it never validates anything itself.
 */
export function ControlledFormField<TFieldValues extends FieldValues>({
  control,
  name,
  ...fieldProps
}: ControlledFormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <FormField
          {...fieldProps}
          value={typeof value === 'string' ? value : (value ?? '')}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
}
