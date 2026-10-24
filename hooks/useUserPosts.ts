import { useCallback, useRef, useState } from 'react';
import { getUserPosts, type UserPostsPage } from '../services/challenge/challenge.service';
import { setQueryData } from '../services/cache/queryCache';
import { queryKeys, staleTimes } from '../services/cache/queries';
import { useCachedQuery } from './useCachedQuery';

/**
 * A user's progress photos, a page at a time (GET /workout-posts/user/:id),
 * cached per user: going back to a profile shows the pages already loaded
 * instead of starting over, and `loadMore` appends the next page when the
 * grid scrolls near its end.
 */
export function useUserPosts(userId: string | null | undefined) {
  const query = useCachedQuery<UserPostsPage>(
    userId ? queryKeys.userPosts(userId) : null,
    () => getUserPosts(userId!),
    { staleTime: staleTimes.social },
  );
  const [loadingMore, setLoadingMore] = useState(false);
  // A ref as well as state: two scroll events in the same frame must not both start a page.
  const loadingMoreRef = useRef(false);
  const nextCursor = query.data?.nextCursor;

  const loadMore = useCallback(() => {
    if (!userId || !nextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    getUserPosts(userId, nextCursor)
      .then(({ photos, nextCursor: cursor }) => {
        setQueryData<UserPostsPage>(queryKeys.userPosts(userId), (previous) => {
          if (!previous) return previous;
          const known = new Set(previous.photos.map((photo) => String(photo.id)));
          return {
            photos: [...previous.photos, ...photos.filter((photo) => !known.has(String(photo.id)))],
            nextCursor: cursor,
          };
        });
      })
      .catch(() => {
        // The global interceptor already told the user; the loaded pages stay.
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [userId, nextCursor]);

  return {
    photos: query.data?.photos,
    isLoading: query.isLoading,
    error: query.error,
    hasMore: Boolean(nextCursor),
    loadingMore,
    loadMore,
    revalidate: query.revalidate,
    refetch: query.refetch,
  };
}
