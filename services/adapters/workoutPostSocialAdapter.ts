import { formatRelativeTime } from '../../utils/time';
import type { CommentContract } from '../../types/workout-post-social';

export interface CommentViewModel {
  id: number;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
}

export function toCommentViewModel(comment: CommentContract): CommentViewModel {
  return {
    id: comment.id,
    authorId: comment.author.id,
    authorName: comment.author.displayName || comment.author.username || 'Unknown',
    authorAvatarUrl: comment.author.profileImageUrl ?? undefined,
    content: comment.content,
    createdAt: formatRelativeTime(comment.createdAt),
  };
}

export function toCommentViewModels(comments: CommentContract[]): CommentViewModel[] {
  return comments.map(toCommentViewModel);
}
