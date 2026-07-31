export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

/** Raw backend contract for a challenge invite (see GET /challenge-invites/*). */
export interface InviteUserSummaryContract {
  id: string;
  username: string;
}

export interface InviteChallengeSummaryContract {
  id: string;
  name: string;
  duration_days?: number;
}

export interface ChallengeInviteContract {
  id: string;
  status: InviteStatus;
  message?: string | null;
  created_at: string;
  responded_at?: string | null;
  expires_at?: string | null;
  challenge: InviteChallengeSummaryContract | null;
  sender: InviteUserSummaryContract | null;
  recipient: InviteUserSummaryContract | null;
}
