import api from '../api';
import type {
  CommentContract,
  ListCommentsResponse,
  ListReactorsResponse,
  ReactionSummaryContract,
  ReactorContract,
} from '../../types/workout-post-social';

export async function reactToPost(postId: string): Promise<void> {
  await api.post(`/workout-posts/${postId}/reactions`);
}

export async function unreactToPost(postId: string): Promise<void> {
  await api.delete(`/workout-posts/${postId}/reactions`);
}

/** Deletes one of the caller's own posts (soft delete server-side — its
 * comments/reactions are kept, it just stops showing anywhere). */
export async function deleteWorkoutPost(postId: string): Promise<void> {
  await api.delete(`/workout-posts/${postId}`);
}

export async function getReactionSummary(
  postId: string,
): Promise<ReactionSummaryContract> {
  const { data } = await api.get<ReactionSummaryContract>(
    `/workout-posts/${postId}/reactions`,
  );
  return data;
}

/** Who reacted to a post, newest first (Sprint 10, B5). Pass the previous
 * page's `nextCursor` to continue. */
export async function listReactors(postId: string, cursor?: string): Promise<ListReactorsResponse> {
  const { data, headers } = await api.get<ReactorContract[]>(`/workout-posts/${postId}/reactions/users`, {
    params: cursor ? { cursor } : undefined,
  });
  return {
    reactors: Array.isArray(data) ? data : [],
    nextCursor: headers['x-next-cursor'] as string | undefined,
  };
}

export async function listComments(
  postId: string,
  after?: number,
  limit?: number,
): Promise<ListCommentsResponse> {
  const { data } = await api.get<ListCommentsResponse>(
    `/workout-posts/${postId}/comments`,
    { params: { after, limit } },
  );
  return data;
}

// The backend's largest page (`MAX_COMMENTS_LIMIT`): the fewest round trips.
const COMMENTS_PAGE_LIMIT = 50;

/**
 * Every comment on a post, oldest first. The API only pages forward from the OLDEST (by id),
 * so the newest comments are on its last page: showing them first means reading them all.
 * A thread of up to `COMMENTS_PAGE_LIMIT` comments is one request.
 */
export async function listAllComments(postId: string): Promise<CommentContract[]> {
  const all: CommentContract[] = [];
  let after: number | undefined;

  do {
    const { comments, nextAfter } = await listComments(postId, after, COMMENTS_PAGE_LIMIT);
    all.push(...comments);
    // A cursor that does not move on would go on for ever.
    after = nextAfter !== null && (after === undefined || nextAfter > after) ? nextAfter : undefined;
  } while (after !== undefined);

  return all;
}

export async function createComment(
  postId: string,
  content: string,
): Promise<CommentContract> {
  const { data } = await api.post<CommentContract>(
    `/workout-posts/${postId}/comments`,
    { content },
  );
  return data;
}

export async function deleteComment(
  postId: string,
  commentId: number,
): Promise<void> {
  await api.delete(`/workout-posts/${postId}/comments/${commentId}`);
}
