import { normalizeKey } from './adapterUtils';
import { formatRelativeTime } from '../../utils/time';
import type { ActivityType } from '../../types/activity';
import type { FeedPostContract } from '../../types/feed';

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
   * people, not the count (Sprint 10, B5). */
  recentReactors: ReactorViewModel[];
  hashtags: string[];
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
  };
}

export function toFeedPostViewModels(posts: FeedPostContract[]): FeedPostViewModel[] {
  return posts.map(toFeedPostViewModel);
}
