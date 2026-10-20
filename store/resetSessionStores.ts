import { useChallengeBuilder } from './challengeBuilderStore';
import { useChallengeFinishedStore } from './challengeFinishedStore';
import { useChallengeJoinApprovedStore } from './challengeJoinApprovedStore';
import { useMetricsEntryStore } from './metricsEntryStore';
import { useNotificationsStore } from './notificationsStore';
import { usePostViewerStore } from './postViewerStore';
import { useRoutineBuilder } from './routineBuilderStore';
import { useUploadSuccessStore } from './uploadSuccessStore';
import { useWorkoutAdaptationStore } from './workoutAdaptationStore';

function reset<T>(store: { setState: (state: T, replace: true) => void; getInitialState: () => T }) {
  store.setState(store.getInitialState(), true);
}

/**
 * Every in-memory store that holds one user's work in progress (a half-built challenge or
 * routine, the metrics being typed, a location choice, unread counts...). They live as long as
 * the app process, so without this the next person to sign in on the same device found the
 * previous one's draft in "Create challenge". Called on logout, on an expired session and right
 * before a new login/registration, so a session never starts from another one's leftovers.
 */
export function resetSessionStores() {
  reset(useChallengeBuilder);
  reset(useChallengeFinishedStore);
  reset(useChallengeJoinApprovedStore);
  reset(useMetricsEntryStore);
  reset(useNotificationsStore);
  reset(usePostViewerStore);
  reset(useRoutineBuilder);
  reset(useUploadSuccessStore);
  reset(useWorkoutAdaptationStore);
}
