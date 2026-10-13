import { router } from 'expo-router';
import { challengePhotoToFeedPost } from '../services/adapters/feedAdapter';
import { usePostViewerStore } from '../store/postViewerStore';
import type { ChallengePhoto } from '../types/challenge';

/**
 * Opens a profile's posts as a feed (react, comment, share), starting on the
 * tapped one and scrolling through the rest — what tapping a photo in a
 * profile grid does (Sprint 9, B5). `ownerId`: set when these are YOUR posts
 * (your own profile) — each post then shows its visibility on the photo, and
 * is stamped with your id so its "..." menu offers Delete, never Message /
 * Report, even if the API response doesn't carry `userId` (an older backend
 * didn't: your own posts showed "Send a message", real reported bug).
 */
export function openPostViewer(
  photos: ChallengePhoto[],
  tapped: ChallengePhoto,
  options: { ownerId?: string | null; replace?: boolean } = {},
) {
  const posts = photos.map((photo) => {
    const post = challengePhotoToFeedPost(photo);
    return options.ownerId
      ? { ...post, userId: post.userId || options.ownerId }
      : { ...post, visibility: undefined };
  });
  usePostViewerStore.getState().open(posts, String(tapped.id));
  if (options.replace) router.replace('/profile/posts');
  else router.push('/profile/posts');
}
