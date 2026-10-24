import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Mirrors the backend DTOs (src/auth/dto): an email, a password and — on
 * registration only — the password policy of B4 (backend
 * src/auth/password-policy.ts), so its rules show next to the field instead
 * of as a server error after submitting: at least `PASSWORD_MIN_LENGTH`
 * characters, at most `PASSWORD_MAX_BYTES` bytes, not a trivial sequence or
 * repetition, and not containing the username or the email. The
 * common-password list stays on the server only
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
/** Characters (code points), not UTF-16 units: "🔥🍕🎉🚀🌙" is 5 (post-audit B4-03-F02). */
const characterCount = (value: string) => [...value].length;

/**
 * Same rule as the backend's isTrivialPattern (post-audit B4-03-F01): fewer
 * than 4 distinct characters, at least 80% of adjacent pairs being a repeat
 * or a ±1 step (alphabet, digits with 9↔0 wrap, keyboard-row neighbours) —
 * also when odd and even positions are each such a run ("q1w2e3r4t5y6") — or
 * one block repeated ("1234512345"). Answered as "too common".
 */
const KEYBOARD_ROWS = ['1234567890', 'qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const SEQUENCE_STEP_RATIO = 0.8;
const MIN_INTERLEAVED_RUN = 4;
const MIN_DISTINCT_CHARACTERS = 4;

function isTrivialStep(a: string, b: string) {
  if (a === b) return true;
  if (/^[a-z]$/.test(a) && /^[a-z]$/.test(b) && Math.abs(a.charCodeAt(0) - b.charCodeAt(0)) === 1) {
    return true;
  }
  if (/^\d$/.test(a) && /^\d$/.test(b)) {
    const step = (Number(b) - Number(a) + 10) % 10;
    if (step === 1 || step === 9) return true;
  }
  return KEYBOARD_ROWS.some((row) => {
    const i = row.indexOf(a);
    const j = row.indexOf(b);
    return i >= 0 && j >= 0 && Math.abs(i - j) === 1;
  });
}

function isMostlySteps(chars: string[]) {
  if (chars.length < 2) return true;
  let steps = 0;
  for (let i = 1; i < chars.length; i += 1) {
    if (isTrivialStep(chars[i - 1], chars[i])) steps += 1;
  }
  return steps / (chars.length - 1) >= SEQUENCE_STEP_RATIO;
}

function isRepeatedBlock(chars: string[]) {
  for (let period = 1; period <= chars.length / 2; period += 1) {
    if (chars.every((c, i) => i < period || c === chars[i - period])) return true;
  }
  return false;
}

export function isTrivialPassword(password: string) {
  const chars = [...password.toLowerCase()];
  if (new Set(chars).size < MIN_DISTINCT_CHARACTERS) return true;
  if (isMostlySteps(chars) || isRepeatedBlock(chars)) return true;
  const even = chars.filter((_, i) => i % 2 === 0);
  const odd = chars.filter((_, i) => i % 2 === 1);
  return odd.length >= MIN_INTERLEAVED_RUN && isMostlySteps(even) && isMostlySteps(odd);
}

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
        .refine((value) => characterCount(value) >= PASSWORD_MIN_LENGTH, {
          message: t('common.validation.passwordMin', { min: PASSWORD_MIN_LENGTH }),
        })
        .refine((value) => utf8Bytes(value) <= PASSWORD_MAX_BYTES, {
          message: t('common.errors.known.passwordTooLong'),
        })
        // One message at a time, in the backend's order: length, bytes, then this.
        .refine(
          (value) =>
            characterCount(value) < PASSWORD_MIN_LENGTH ||
            utf8Bytes(value) > PASSWORD_MAX_BYTES ||
            !isTrivialPassword(value),
          { message: t('common.errors.known.passwordTooCommon') },
        ),
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
