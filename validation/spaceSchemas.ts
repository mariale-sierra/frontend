import { z } from 'zod';
import type { TFunction } from 'i18next';

/** Mirrors components/spaces/SpaceForm.tsx's previous hand-written name check. */
export function createSpaceNameSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('spaces.nameRequiredError')),
  });
}

export type SpaceNameFormValues = z.infer<ReturnType<typeof createSpaceNameSchema>>;
