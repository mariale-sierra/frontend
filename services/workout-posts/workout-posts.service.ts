import api from '../api';
import type {
  CommentContract,
  ListCommentsResponse,
  ReactionSummaryContract,
} from '../../types/workout-post-social';

export async function reactToPost(postId: string): Promise<void> {
  await api.post(`/workout-posts/${postId}/reactions`);
}

export async function unreactToPost(postId: string): Promise<void> {
  await api.delete(`/workout-posts/${postId}/reactions`);
}

export async function getReactionSummary(
  postId: string,
): Promise<ReactionSummaryContract> {
  const { data } = await api.get<ReactionSummaryContract>(
    `/workout-posts/${postId}/reactions`,
  );
  return data;
}

export async function listComments(
  postId: string,
  after?: number,
): Promise<ListCommentsResponse> {
  const { data } = await api.get<ListCommentsResponse>(
    `/workout-posts/${postId}/comments`,
    { params: after !== undefined ? { after } : undefined },
  );
  return data;
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
