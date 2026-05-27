import { normalizeKey } from './adapterUtils';
import type { ActivityType } from '../../constants/theme';
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

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
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
  };
}

export function toFeedPostViewModels(posts: FeedPostContract[]): FeedPostViewModel[] {
  return posts.map(toFeedPostViewModel);
}
