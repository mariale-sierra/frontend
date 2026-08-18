/** GET /follows/followers | /follows/following row (backend FollowUserSummaryDto). */
export interface FollowUserSummaryContract {
  id: string;
  username: string;
  followed_at: string;
}
