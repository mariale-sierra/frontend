/** GET /follows/followers | /follows/following row (backend FollowUserSummaryDto). */
export interface FollowUserSummaryContract {
  id: string;
  username: string;
  followed_at: string;
}

/** GET /follows/following/streaks row (Home → Streaks today). */
export interface FriendStreakContract {
  userId: string;
  username: string;
  avatarUrl?: string;
  streakDays: number;
  loggedToday: boolean;
}
