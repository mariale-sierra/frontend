import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getUserPosts } from '../../services/challenge/challenge.service';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { PhotoGrid } from './PhotoGrid';
import type { ChallengePhoto } from '../../types/challenge';

interface PostsGridProps {
  view: 'posts' | 'photos';
  /** The tapped photo plus the list it was in (as shown), for the post viewer. */
  onPhotoPress?: (photo: ChallengePhoto, photos: ChallengePhoto[]) => void;
  /** Bumped by the parent screen's pull-to-refresh (a value change, any
   * value) to force a refetch outside the normal focus-effect cycle — this
   * component owns its own fetch, so a parent-level refresh has no other way
   * to reach it. */
  refreshSignal?: number;
}

function haveSamePhotos(current: ChallengePhoto[], next: ChallengePhoto[]) {
  return (
    current.length === next.length &&
    current.every((photo, index) => {
      const candidate = next[index];

      return (
        photo.id === candidate.id &&
        photo.challengeId === candidate.challengeId &&
        photo.userName === candidate.userName &&
        photo.imageUrl === candidate.imageUrl &&
        photo.day === candidate.day &&
        photo.visibility === candidate.visibility &&
        photo.description === candidate.description &&
        photo.metrics.length === candidate.metrics.length &&
        photo.metrics.every(
          (metric, metricIndex) =>
            metric.label === candidate.metrics[metricIndex].label && metric.value === candidate.metrics[metricIndex].value,
        )
      );
    })
  );
}

export const PostsGrid = memo(function PostsGrid({ view, onPhotoPress, refreshSignal }: PostsGridProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { userId } = useAuth();
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
  // Own posts come a page at a time (GET /workout-posts/user/:me): the unpaginated
  // /workout-posts/mine returns and enriches the whole history, which is what made this slow.
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);

  // Refetches on focus (not just on mount) so a photo uploaded elsewhere
  // shows up here when the user comes back to the profile tab.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      // Keep the previously rendered grid while a focus refresh is in
      // flight. Resetting this flag on every tab switch unmounted every
      // image tile, re-mounted the skeleton, and restarted image prefetches
      // even when the server returned the same photos.
      if (!userId) return;
      getUserPosts(userId)
        .then(({ photos: data, nextCursor: cursor }) => {
          if (!active) return;
          setNextCursor(cursor);

          // Service responses contain fresh object identities on every
          // request. Preserve the existing array when its visible content
          // did not change so PhotoGrid's memoized tiles and image cache do
          // not redo work just because this tab was focused again.
          setPhotos((current) => (haveSamePhotos(current, data) ? current : data));
        })
        .catch(() => {
          if (active) setPhotos((current) => (current.length === 0 ? current : []));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  // Parent's pull-to-refresh — outside the normal focus cycle above, so it
  // needs its own effect. No loading-flag flip here either, same reasoning.
  useEffect(() => {
    if (refreshSignal === undefined || !userId) return;
    let active = true;
    getUserPosts(userId)
      .then(({ photos: data, nextCursor: cursor }) => {
        if (!active) return;
        setNextCursor(cursor);
        setPhotos((current) => (haveSamePhotos(current, data) ? current : data));
      })
      .catch(() => {
        // Leave the currently displayed photos as-is on a failed refresh.
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  // 'posts' = only photos visible to followers; 'photos' = everything,
  // including private ones (only the owner ever hits this screen).
  const visiblePhotos = useMemo(
    () => (view === 'posts' ? photos.filter((photo) => photo.visibility === 'public') : photos),
    [photos, view],
  );

  function loadMore() {
    if (!userId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    getUserPosts(userId, nextCursor)
      .then(({ photos: more, nextCursor: cursor }) => {
        setPhotos((current) => [...current, ...more.filter((photo) => !current.some((c) => c.id === photo.id))]);
        setNextCursor(cursor);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  return (
    <View>
    <PhotoGrid
      photos={visiblePhotos}
      loading={loading}
      emptyLabel={view === 'posts' ? t('profile.emptyPublicPhotos') : t('profile.emptyAllPhotos')}
      emptyTitle={t('profile.emptyPostsTitle')}
      emptyActions={[
        { label: t('profile.emptyPostsExplore'), onPress: () => router.push('/(tabs)/challenges?view=explore'), testID: 'empty-posts-explore' },
        { label: t('profile.emptyPostsLog'), onPress: () => router.push('/log'), testID: 'empty-posts-log' },
      ]}
      onPhotoPress={onPhotoPress ? (photo) => onPhotoPress(photo, visiblePhotos) : undefined}
    />
    {nextCursor ? (
      <Button variant="outline" size="sm" loading={loadingMore} onPress={loadMore} testID="posts-load-more">
        {t('profile.loadMorePosts')}
      </Button>
    ) : null}
    </View>
  );
});
