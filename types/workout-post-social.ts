/** Backend CommentAuthorDto — restricted user summary, never email/password. */
export interface CommentAuthorContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

/** Backend CommentDto (GET/POST /workout-posts/:postId/comments). */
export interface CommentContract {
  id: number;
  workoutPostId: string;
  author: CommentAuthorContract;
  content: string;
  createdAt: string; // ISO 8601
}

export interface ListCommentsResponse {
  comments: CommentContract[];
  nextAfter: number | null;
}

/** Backend response of GET /workout-posts/:postId/reactions. */
export interface ReactionSummaryContract {
  count: number;
  reactedByMe: boolean;
}
