import { normalizeKey } from './adapterUtils';
import { formatRelativeTime } from '../../utils/time';
import type { ActivityType } from '../../types/activity';
import type { FeedPostContract } from '../../types/feed';
import type { ChallengePhoto } from '../../types/challenge';

export interface FeedPostViewModel {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  challengeId: string;
  challengeName: string;
  activityType?: ActivityType;
  day: number;
  imageUrl?: string;
  caption?: string;
  postedAt: string;
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
  /** Who reacted (up to 3, never the viewer) — the reactions UI leads with
   * people, not the count (Sprint 9, B5). */
  recentReactors: ReactorViewModel[];
  hashtags: string[];
  /** Exercise + logged value rows, shown collapsed under the actions. */
  metrics: Array<{ label: string; value: string }>;
  /** Only known for your own posts (profile): drawn on the photo's corner. */
  visibility?: 'public' | 'private';
}

export interface ReactorViewModel {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

const ACTIVITY_MAP: Record<string, ActivityType> = {
  strength: 'strength',
  cardiointense: 'cardioIntense',
  cardiolow: 'cardioLow',
  flexibility: 'flexibility',
  mindbody: 'mindBody',
  functional: 'functional',
};

function toActivityType(raw?: string): ActivityType | undefined {
  if (!raw) return undefined;
  return ACTIVITY_MAP[normalizeKey(raw)];
}

export function toFeedPostViewModel(post: FeedPostContract): FeedPostViewModel {
  return {
    id: post.id,
    userId: post.user_id,
    userName: post.user_name || 'Unknown',
    userAvatarUrl: post.user_avatar_url,
    challengeId: post.challenge_id,
    challengeName: post.challenge_name || 'Challenge',
    activityType: toActivityType(post.activity_type),
    day: post.challenge_day ?? 1,
    imageUrl: post.image_url,
    caption: post.caption,
    postedAt: formatRelativeTime(post.posted_at),
    likesCount: post.likes_count ?? 0,
    likedByMe: post.liked_by_me ?? false,
    commentsCount: post.comments_count ?? 0,
    recentReactors: (post.recent_reactors ?? []).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.display_name,
      avatarUrl: r.avatar_url,
    })),
    hashtags: post.hashtags ?? [],
    metrics: post.metrics ?? [],
  };
}

/**
 * A profile/gallery photo (GET /workout-posts/mine | /user/:id) as a feed post,
 * so the profile's post viewer can reuse FeedPostCard — reactions, comments,
 * share. `visibility` is kept so your own posts can show it on the photo.
 */
export function challengePhotoToFeedPost(photo: ChallengePhoto): FeedPostViewModel {
  return {
    id: photo.id,
    userId: photo.userId ?? '',
    userName: photo.userName || 'Unknown',
    userAvatarUrl: photo.userAvatarUrl ?? undefined,
    challengeId: photo.challengeId,
    challengeName: photo.challengeName ?? 'Challenge',
    day: photo.day ?? 1,
    imageUrl: photo.imageUrl ?? undefined,
    caption: photo.description || undefined,
    postedAt: photo.postedAt ? formatRelativeTime(photo.postedAt) : '',
    likesCount: photo.likesCount ?? 0,
    likedByMe: photo.likedByMe ?? false,
    commentsCount: photo.commentsCount ?? 0,
    recentReactors: (photo.recentReactors ?? []).map((r) => ({
      id: r.id,
      username: r.username,
      displayName: r.displayName,
      avatarUrl: r.profileImageUrl,
    })),
    hashtags: photo.hashtags ?? [],
    metrics: photo.metrics ?? [],
    visibility: photo.visibility,
  };
}

export function toFeedPostViewModels(posts: FeedPostContract[]): FeedPostViewModel[] {
  return posts.map(toFeedPostViewModel);
}
