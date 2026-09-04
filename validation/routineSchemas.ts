import { z } from 'zod';
import type { TFunction } from 'i18next';

/** Mirrors app/challenge/routine/create.tsx's previous `requireName()` Alert. */
export function createRoutineNameSchema(t: TFunction) {
  return z.object({
    routineName: z.string().min(1, t('routineCreate.alerts.nameRequiredMessage')),
  });
}

export type RoutineNameFormValues = z.infer<ReturnType<typeof createRoutineNameSchema>>;
