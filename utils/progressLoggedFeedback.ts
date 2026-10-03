import { completeChallenge, getChallengeProgress } from '../services/challenge/challenge.service';
import { isChallengeFinished } from '../services/adapters/challengeState';
import { useChallengeFinishedStore } from '../store/challengeFinishedStore';
import type { ChallengeFinishedData } from '../store/challengeFinishedStore';
import { useUploadSuccessStore } from '../store/uploadSuccessStore';
import { markCompletionShown } from './shownCompletions';

/**
 * The popup after a day has been logged (a photo, or a rest day): the "Challenge
 * complete" one when that was the challenge's last day — the challenge is marked
 * completed first, so it becomes a "Finished" card in Challenges-Mine (and leaves
 * Home) — and the usual "logged!" one otherwise, now passed the challenge's name
 * and day count for the richer message (Stage 6 of onboarding — see
 * `store/uploadSuccessStore.ts`'s `UploadSuccessData`; falls back to the plain
 * generic copy in `UploadSuccessPopup.tsx` if any piece is missing). Only one of
 * the two popups ever shows.
 */
export async function showProgressLoggedFeedback(challengeId: string): Promise<void> {
  let progress: Awaited<ReturnType<typeof getChallengeProgress>> | null = null;
  try {
    progress = await getChallengeProgress(challengeId);
  } catch (error) {
    console.error('[progressLoggedFeedback] could not fetch challenge progress:', error);
  }

  if (progress && isChallengeFinished(progress)) {
    try {
      await completeChallenge(challengeId);
      const finished: ChallengeFinishedData = {
        challengeId,
        challengeName: progress.challenge.name,
        totalDays: progress.totalDays,
      };
      await markCompletionShown(finished.challengeId);
      useChallengeFinishedStore.getState().show(finished);
      return;
    } catch (error) {
      console.error('[progressLoggedFeedback] could not complete the challenge:', error);
      // The day is already saved either way — fall through to the usual
      // "logged!" popup below rather than surfacing this as an error.
    }
  }

  useUploadSuccessStore.getState().show({
    challengeName: progress?.challenge.name,
    currentDay: progress?.currentDay,
    totalDays: progress?.totalDays,
  });
}
