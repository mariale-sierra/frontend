import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Mirrors app/profile/edit.tsx's previous hand-written `validate()`: display
 * name required (not only spaces), bio always optional (its own maxLength is enforced natively
 * by the Input's `maxLength` prop, not re-validated here).
 */
export function createProfileEditSchema(t: TFunction) {
  return z.object({
    // Trimmed: only spaces is empty (the backend rejects an empty display_name).
    displayName: z.string().trim().min(1, t('profileEdit.displayNameRequired')),
    bio: z.string(),
  });
}

export type ProfileEditFormValues = z.infer<ReturnType<typeof createProfileEditSchema>>;
