import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Login/register have never had client-side field validation — every field
 * just got submitted and any failure came back as a server error Alert (see
 * app/(auth)/login.tsx and register.tsx). These schemas add real, minimal
 * validation (required + email format) without inventing password rules the
 * backend doesn't itself enforce (checked src/auth/dto/*.dto.ts — no
 * @MinLength or similar on `password`).
 */
export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
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
      .min(1, t('common.validation.required', { field: t('common.fields.email') }))
      .email(t('common.validation.emailInvalid')),
    username: z
      .string()
      .min(1, t('common.validation.required', { field: t('common.fields.username') })),
    password: z
      .string()
      .min(1, t('common.validation.required', { field: t('common.fields.password') })),
  });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
