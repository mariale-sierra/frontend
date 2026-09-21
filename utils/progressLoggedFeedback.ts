import { completeChallenge, getChallengeProgress } from '../services/challenge/challenge.service';
import { isChallengeFinished } from '../services/adapters/challengeState';
import { useChallengeFinishedStore } from '../store/challengeFinishedStore';
import type { ChallengeFinishedData } from '../store/challengeFinishedStore';
import { useUploadSuccessStore } from '../store/uploadSuccessStore';
import { markCompletionShown } from './shownCompletions';

/**
 * If the day that was just logged was the challenge's LAST one, marks the
 * challenge completed (`PATCH /challenges/:id/complete` — nothing else in the app
 * ever calls it, so without this a challenge never finishes) and returns it.
 * Any failure returns `null`: the day itself is already saved by now, so this
 * must never turn into a "could not save" error.
 */
async function completeChallengeIfFinished(challengeId: string): Promise<ChallengeFinishedData | null> {
  try {
    const progress = await getChallengeProgress(challengeId);
    if (!progress || !isChallengeFinished(progress)) return null;
    await completeChallenge(challengeId);
    return { challengeId, challengeName: progress.challenge.name, totalDays: progress.totalDays };
  } catch (error) {
    console.error('[progressLoggedFeedback] could not check or complete the challenge:', error);
    return null;
  }
}

/**
 * The popup after a day has been logged (a photo, or a rest day): the "Challenge
 * complete" one when that was the challenge's last day — the challenge is marked
 * completed first, so it becomes a "Finished" card in Challenges-Mine (and leaves
 * Home) — and the usual "logged!"
 * one otherwise. Only one of the two ever shows.
 */
export async function showProgressLoggedFeedback(challengeId: string): Promise<void> {
  const finished = await completeChallengeIfFinished(challengeId);
  if (finished) {
    await markCompletionShown(finished.challengeId);
    useChallengeFinishedStore.getState().show(finished);
    return;
  }
  useUploadSuccessStore.getState().show();
}
