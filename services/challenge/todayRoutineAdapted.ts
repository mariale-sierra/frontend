import { getTodayRoutineForChallenge } from './challenge.service';
import type { TodayRoutineContract } from '../../types/challenge';
import {
  adaptationForRoutine,
  toSubstitutionsParam,
  useWorkoutAdaptationStore,
} from '../../store/workoutAdaptationStore';

/**
 * Today's routine as THIS user will do it: when they picked another location
 * for this very routine (see LocationSwitchSheet), the backend swaps in their
 * chosen exercises. If the backend no longer accepts those swaps (catalog
 * changed, routine edited) the choice is dropped and the routine comes back as
 * written, flagged with `invalidAdaptation` so the screen can say so — the
 * workout never fails over it.
 */
export async function loadTodayRoutine(
  challengeId: string,
): Promise<{ routine: TodayRoutineContract; invalidAdaptation: boolean; base: TodayRoutineContract }> {
  const base = await getTodayRoutineForChallenge(challengeId);
  const { byChallenge, clearAdaptation } = useWorkoutAdaptationStore.getState();
  const adaptation = adaptationForRoutine(byChallenge[challengeId], base.routine_id);
  if (!adaptation) return { routine: base, invalidAdaptation: false, base };

  try {
    const routine = await getTodayRoutineForChallenge(challengeId, {
      locationCode: adaptation.locationCode,
      substitutions: toSubstitutionsParam(adaptation),
    });
    return { routine, invalidAdaptation: false, base };
  } catch {
    clearAdaptation(challengeId);
    return { routine: base, invalidAdaptation: true, base };
  }
}
