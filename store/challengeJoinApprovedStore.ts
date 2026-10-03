import { create } from 'zustand';

/** The private challenge whose join request just turned out to be approved,
 * for the "You're in!" popup. */
export interface ChallengeJoinApprovedData {
  challengeId: string;
  challengeName: string;
}

/**
 * Drives the global "You're in!" popup — shown once per challenge, the
 * first time the Challenges tab notices a private challenge's owner
 * approved a join request this device never got live feedback for (the
 * approval happens on the OWNER's device, at whatever time they get to it —
 * there was no way at all for the requester to find out before this).
 * Global for the same reason `challengeFinishedStore` is: the moment it
 * fires, the user is wherever they happen to be, not on one screen that
 * could own it. See `ChallengeJoinApprovedPopup`, mounted once at the app
 * root, and `utils/seenChallengeMemberships.ts` for the "once ever" bookkeeping.
 */
interface ChallengeJoinApprovedStore {
  visible: boolean;
  challenge: ChallengeJoinApprovedData | null;
  show: (challenge: ChallengeJoinApprovedData) => void;
  hide: () => void;
}

export const useChallengeJoinApprovedStore = create<ChallengeJoinApprovedStore>((set) => ({
  visible: false,
  challenge: null,
  show: (challenge) => set({ visible: true, challenge }),
  // The challenge stays put so the popup keeps its text while it fades out.
  hide: () => set({ visible: false }),
}));
