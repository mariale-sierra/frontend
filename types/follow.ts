/** Raw backend contract for a follow relation (see GET /follows/followers|following). */
export interface FollowUserSummaryContract {
  id: string;
  username: string;
  followed_at: string;
}
