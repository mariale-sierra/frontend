import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Mirrors the backend DTOs (src/auth/dto): an email, a password and — on
 * registration only — a password of at least `PASSWORD_MIN_LENGTH`
 * (RegisterDto's @MinLength(8)), so the rule shows next to the field instead
 * of as a server error after submitting. Login keeps no length rule: existing
 * accounts are checked by the server. Emails are trimmed first, so a trailing
 * space from autofill doesn't read as an invalid address.
 */
export const PASSWORD_MIN_LENGTH = 8;

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t('common.validation.required', { field: t('common.fields.email') }))
      .email(t('common.validation.emailInvalid')),
    password: z
      .string()
      .min(1, t('common.validation.required', { field: t('common.fields.password') })),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t('common.validation.required', { field: t('common.fields.email') }))
      .email(t('common.validation.emailInvalid')),
    username: z
      .string()
      .trim()
      .min(1, t('common.validation.required', { field: t('common.fields.username') })),
    password: z
      .string()
      .min(1, t('common.validation.required', { field: t('common.fields.password') }))
      .min(PASSWORD_MIN_LENGTH, t('common.validation.passwordMin', { min: PASSWORD_MIN_LENGTH })),
  });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
