import { create } from 'zustand';

/** The challenge that just finished, for the "Challenge complete" popup. */
export interface ChallengeFinishedData {
  challengeId: string;
  challengeName: string;
  /** Whole-challenge length in days, e.g. 75 — raw data, not a formatted
   * string, so the popup can pluralize it through i18n. */
  totalDays?: number;
}

/**
 * Drives the global "Challenge complete" success popup — shown once, when a
 * challenge finishes (its last day is logged, or the Challenges tab finds one
 * that finished elsewhere). Global for the same reason the upload-success popup
 * is (`uploadSuccessStore`): the moment it fires the user is on whichever screen
 * the logging flow closed back to, not on one screen that could own it. See
 * `ChallengeFinishedPopup`, mounted once at the app root.
 */
interface ChallengeFinishedStore {
  visible: boolean;
  challenge: ChallengeFinishedData | null;
  show: (challenge: ChallengeFinishedData) => void;
  hide: () => void;
}

export const useChallengeFinishedStore = create<ChallengeFinishedStore>((set) => ({
  visible: false,
  challenge: null,
  show: (challenge) => set({ visible: true, challenge }),
  // The challenge stays put so the popup keeps its text while it fades out.
  hide: () => set({ visible: false }),
}));
