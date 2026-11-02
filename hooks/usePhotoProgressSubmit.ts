import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { uploadImageAsync } from '../services/uploads/upload.service';
import { submitWorkoutProgress } from '../services/workout-log/workout-log.service';
import { applyExerciseMetrics } from '../services/metrics/applyExerciseMetrics';
import { invalidateAfterWorkoutLogged } from '../services/cache/queries';
import { invalidateChallengeProgressCache } from './useChallengeProgress';
import { useErrorNotificationStore } from '../store/errorNotificationStore';
import { useMetricsEntryStore } from '../store/metricsEntryStore';
import {
  adaptationForRoutine,
  toSubstitutionPayload,
  useWorkoutAdaptationStore,
} from '../store/workoutAdaptationStore';
import { showProgressLoggedFeedback } from '../utils/progressLoggedFeedback';
import { photoReviewFromWorkout } from '../utils/photoModeration';
import { safeBackTimes } from '../utils/navigation';
import { getApiErrorMessage, logError } from '../utils/apiError';
import type { WorkoutLogContract } from '../types/workout-log';
import type { CameraPostVisibility } from '../components/add/camera/CameraChips';

// Same cap as the backend's CreateWorkoutProgressDto.caption.
export const MAX_CAPTION_LENGTH = 500;

export interface PhotoProgressInput {
  challengeId: string;
  imageUri: string;
  visibility: CameraPostVisibility;
  caption: string;
  /** Only the challenge owner tags (B8); an empty list sends nothing. */
  taggedUserIds?: string[];
}

export type PhotoProgressPhase = 'idle' | 'uploading' | 'saving';

/**
 * The camera's "confirm" flow: upload the photo, save the day's progress with
 * it, then close the (add) modal and show the logged-day feedback. Returns the
 * message to show inline when a step fails (null on success), so the screen
 * keeps a single error line.
 *
 * Reads the metrics entry and the location choice (B7) at submit time, from
 * their stores, so the screen does not have to thread them through.
 */
export function usePhotoProgressSubmit() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<PhotoProgressPhase>('idle');
  // B5: a double tap fired back-to-back (before React has committed the
  // re-render that disables the button) would both read the same stale
  // `phase` and both call submitWorkoutProgress — `useRef` updates are
  // visible synchronously, so the second tap's check always sees the first
  // tap's write. Same pattern as FeedPostCard's `reactingRef`. This is UX
  // defense only — the actual guarantee against a duplicate is the backend's
  // uq_workout_logs_user_challenge_local_day constraint.
  const busyRef = useRef(false);

  const submit = useCallback(
    async (input: PhotoProgressInput): Promise<string | null> => {
      if (busyRef.current) return null;
      busyRef.current = true;
      try {
        return await uploadAndSave(input, t, setPhase);
      } finally {
        busyRef.current = false;
        setPhase('idle');
      }
    },
    [t],
  );

  return { phase, isSubmitting: phase !== 'idle', submit };
}

async function uploadAndSave(
  { challengeId, imageUri, visibility, caption, taggedUserIds }: PhotoProgressInput,
  t: TFunction,
  setPhase: (phase: PhotoProgressPhase) => void,
): Promise<string | null> {
  const { currentRoutineId, exerciseMetrics } = useMetricsEntryStore.getState();
  // B7: the user's location choice, only when it was made for the routine being logged.
  const adaptation = adaptationForRoutine(
    useWorkoutAdaptationStore.getState().byChallenge[challengeId],
    currentRoutineId,
  );

  setPhase('uploading');
  let publicUrl: string;
  try {
    publicUrl = await uploadImageAsync(imageUri, 'image/jpeg');
  } catch (e: unknown) {
    logError('Camera.upload', e);
    return getApiErrorMessage(e, t, t('camera.uploadError'));
  }

  setPhase('saving');
  let workout: WorkoutLogContract;
  try {
    workout = await submitWorkoutProgress({
      challengeId,
      imageUrl: publicUrl,
      isRestDay: false,
      visibility,
      caption: caption.trim() || undefined,
      routineId: currentRoutineId ?? undefined,
      ...(adaptation
        ? { locationCode: adaptation.locationCode, substitutions: toSubstitutionPayload(adaptation) }
        : {}),
      taggedUserIds: taggedUserIds && taggedUserIds.length > 0 ? taggedUserIds : undefined,
    });
  } catch (e: unknown) {
    logError('Camera.confirm', e);
    // Inline, next to the button; the global toast already covered an API
    // failure, so no Alert on top of it.
    return getApiErrorMessage(e, t, t('camera.saveProgressError'));
  }

  // The workout + photo are already saved server-side at this point —
  // nothing below is allowed to surface as a "failed to save progress"
  // error, since that would misreport a successful save as a failure
  // (confirmed bug: a post-save hiccup, e.g. router.dismissAll() finding
  // nothing left to dismiss, was once caught by the same try/catch as the
  // actual submission and shown as an upload error).

  // The routine copy inside POST /workout-logs/progress only creates
  // target (goal) rows for each exercise — the values actually entered
  // on the metrics screen still need to be saved against them here.
  if (exerciseMetrics.length > 0) {
    try {
      await applyExerciseMetrics(workout, exerciseMetrics, (failed, attempted) => {
        // Progress is saved; tell the user which part was not, instead of a silent "success".
        useErrorNotificationStore.getState().show({
          message: t('camera.metricsPartialError', { failed, total: attempted }),
        });
      });
    } catch (metricsError) {
      // The workout + photo already saved — a metrics save failure must not
      // block the flow or look like data loss.
      logError('Camera.applyExerciseMetrics', metricsError);
    }
  }
  useWorkoutAdaptationStore.getState().clearAdaptation(challengeId);
  invalidateChallengeProgressCache();
  invalidateAfterWorkoutLogged();
  try {
    // Closes the whole (add) modal group, back to the screen the flow
    // started from — NOT router.dismissAll(), which only pops (add)'s own
    // nested stack (metrics -> camera) and left the modal open with the
    // success popup hidden behind it. log.tsx reaches metrics.tsx via
    // router.replace(), so (add) is always exactly 2 screens deep here, and
    // the second back() bubbles up and closes the modal itself.
    safeBackTimes(2);
  } catch (navError) {
    logError('Camera.closeModal', navError);
  }
  // The popup is global (mounted at app root), so it shows on top of wherever
  // the back() calls landed. B2: it also says where the photo stands, from
  // the server's own answer.
  void showProgressLoggedFeedback(challengeId, { photo: photoReviewFromWorkout(workout) });
  return null;
}
