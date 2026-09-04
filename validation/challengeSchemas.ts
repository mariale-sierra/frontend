import { z } from 'zod';
import type { TFunction } from 'i18next';

/**
 * Only the Name step's title field is a real text input — the other Create
 * Challenge steps (Activity & Location, Build the Cycle, Duration &
 * Visibility) are pill grids / day lists / cards, not text fields, and keep
 * their existing step-level Alert summary (see useCreateChallengeFlow.ts).
 */
export function createChallengeNameSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t('challengeCreate.fields.nameRequired')),
  });
}

export type ChallengeNameFormValues = z.infer<ReturnType<typeof createChallengeNameSchema>>;
