import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Mirrors the backend DTOs (src/auth/dto): an email, a password and — on
 * registration only — the password policy of B4 (backend
 * src/auth/password-policy.ts), so its rules show next to the field instead
 * of as a server error after submitting: at least `PASSWORD_MIN_LENGTH`
 * characters, at most `PASSWORD_MAX_BYTES` bytes, and not containing the
 * username or the email. The common-password list stays on the server only
 * (its specific message comes back mapped to the password step). Login keeps
 * no length rule: accounts created under the old 8-character rule must still
 * sign in. Emails are trimmed first, so a trailing space from autofill
 * doesn't read as an invalid address.
 */
export const PASSWORD_MIN_LENGTH = 10;
/** bcrypt ignores everything past 72 bytes (the backend rejects it). */
export const PASSWORD_MAX_BYTES = 72;
/** Shorter usernames / email local parts would match too many passwords. */
const MIN_IDENTITY_LENGTH = 3;

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  '!': 'i',
};
const deleet = (value: string) => value.replace(/[013457@$!]/g, (c) => LEET[c] ?? c);

/** Same rule as the backend's: case-insensitive, leetspeak undone. */
export function passwordContainsIdentity(password: string, username: string, email: string) {
  const lower = password.toLowerCase();
  const leet = deleet(lower);
  return [username.trim().toLowerCase(), email.trim().toLowerCase().split('@')[0]]
    .filter((part) => part.length >= MIN_IDENTITY_LENGTH)
    .some((part) => lower.includes(part) || leet.includes(part));
}

const utf8Bytes = (value: string) => new TextEncoder().encode(value).length;

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
  return z
    .object({
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
        .min(PASSWORD_MIN_LENGTH, t('common.validation.passwordMin', { min: PASSWORD_MIN_LENGTH }))
        .refine((value) => utf8Bytes(value) <= PASSWORD_MAX_BYTES, {
          message: t('common.errors.known.passwordTooLong'),
        }),
    })
    .superRefine((values, ctx) => {
      if (passwordContainsIdentity(values.password, values.username, values.email)) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: t('common.errors.known.passwordContainsIdentity'),
        });
      }
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
