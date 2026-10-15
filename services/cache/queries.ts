import { invalidateQueries, updateQueries } from './queryCache';
import type { FeedPage } from '../feed/feed.service';
import type { UserPostsPage } from '../challenge/challenge.service';
import type { ChallengePhoto } from '../../types/challenge';
import type { FeedPostContract } from '../../types/feed';

/**
 * Every shared cache key in one place, so a mutation can name exactly what it
 * makes stale. A trailing `:` key is a prefix (see queryCache.invalidateQueries).
 */
export const queryKeys = {
  /** GET /users/me/challenges — Home cards, Challenges › Mine, Search, Log picker. */
  myChallenges: 'me:challenges',
  /** GET /workout-posts/mine — "did I post for this challenge today" on Home and Challenges. */
  myPhotos: 'me:photos',
  /** GET /users/me/profile */
  myProfile: 'me:profile',
  /** GET /challenges (every page) — Challenges › Explore and Search. */
  allChallenges: 'challenges:all',
  /** GET /feed, the pages loaded so far. */
  feed: 'feed',
  /** GET /follows/following/streaks */
  followingStreaks: 'follow:streaks',
  myBadges: 'badges:me',
  userBadges: (userId: string) => `badges:user:${userId}`,
  publicProfile: (userId: string) => `profile:${userId}`,
  /** GET /workout-posts/user/:id, the pages loaded so far. */
  userPosts: (userId: string) => `user-posts:${userId}`,
  /** Exercise catalog reference data (categories, muscles...). */
  reference: (name: string) => `ref:${name}`,
} as const;

const SECOND = 1000;
const MINUTE = 60 * SECOND;

/**
 * How long each kind of data is reused before a screen asks the server again.
 * Mutations made in the app invalidate their keys right away, so these only
 * bound how long a change made elsewhere (another user, another device) can
 * take to appear without a pull-to-refresh.
 */
export const staleTimes = {
  /** Things that change with every log: the cards' state, the feed. */
  activity: 45 * SECOND,
  /** Other people's activity: streaks, profiles, posts. */
  social: 2 * MINUTE,
  /** The catalog of challenges, badges, your own profile. */
  catalog: 5 * MINUTE,
  /** Seeded reference data (exercise categories, muscles): changes with a deploy. */
  reference: 24 * 60 * MINUTE,
} as const;

function withoutPost<T extends { id: string | number }>(items: T[], postId: string) {
  const next = items.filter((item) => String(item.id) !== postId);
  return next.length === items.length ? items : next;
}

/** Drops a post everywhere it is cached (deleted by its author, or reported by the viewer). */
export function removePostFromCaches(postId: string) {
  updateQueries<FeedPage>(queryKeys.feed, (page) => {
    const posts = withoutPost(page.posts, postId);
    return posts === page.posts ? page : { ...page, posts };
  });
  updateQueries<UserPostsPage>('user-posts:', (page) => {
    const photos = withoutPost(page.photos, postId);
    return photos === page.photos ? page : { ...page, photos };
  });
  updateQueries<ChallengePhoto[]>(queryKeys.myPhotos, (photos) => withoutPost(photos, postId));
}

/** Keeps a reaction/comment change made on a card when the feed is shown again. */
export function patchFeedPost(postId: string, patch: Partial<FeedPostContract>) {
  updateQueries<FeedPage>(queryKeys.feed, (page) => {
    let changed = false;
    const posts = page.posts.map((post) => {
      if (post.id !== postId) return post;
      changed = true;
      return { ...post, ...patch };
    });
    return changed ? { ...page, posts } : page;
  });
}

/** A workout or rest day was just logged: the cards, streaks, feed and own posts all move. */
export function invalidateAfterWorkoutLogged() {
  invalidateQueries(
    queryKeys.myChallenges,
    queryKeys.myPhotos,
    queryKeys.myProfile,
    queryKeys.myBadges,
    queryKeys.feed,
    'user-posts:',
  );
}

/** One of the viewer's posts is gone: what depended on it. */
export function invalidateAfterOwnPostDeleted() {
  invalidateQueries(queryKeys.myChallenges, queryKeys.myPhotos, queryKeys.myProfile, queryKeys.myBadges);
}

/** Joined, left, created, completed or deleted a challenge (or accepted an invite). */
export function invalidateAfterMembershipChanged() {
  invalidateQueries(queryKeys.myChallenges, queryKeys.allChallenges, queryKeys.myBadges);
}

/** Followed or unfollowed someone: who shows up in streaks, the feed and the counters. */
export function invalidateAfterFollowChanged(targetUserId: string) {
  invalidateQueries(
    queryKeys.followingStreaks,
    queryKeys.feed,
    queryKeys.myProfile,
    queryKeys.publicProfile(targetUserId),
    queryKeys.userPosts(targetUserId),
  );
}
