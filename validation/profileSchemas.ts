import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Mirrors app/profile/edit.tsx's previous hand-written `validate()`: display
 * name required, bio always optional (its own maxLength is enforced natively
 * by the Input's `maxLength` prop, not re-validated here).
 */
export function createProfileEditSchema(t: TFunction) {
  return z.object({
    displayName: z.string().min(1, t('profileEdit.displayNameRequired')),
    bio: z.string(),
  });
}

export type ProfileEditFormValues = z.infer<ReturnType<typeof createProfileEditSchema>>;
