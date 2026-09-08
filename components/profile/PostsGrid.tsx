import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { PhotoGrid } from './PhotoGrid';
import type { ChallengePhoto } from '../../types/challenge';

interface PostsGridProps {
  view: 'posts' | 'photos';
  onPhotoPress?: (photo: ChallengePhoto) => void;
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
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
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
      getMyProgressPhotos()
        .then((data) => {
          if (!active) return;

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
    }, []),
  );

  // Parent's pull-to-refresh — outside the normal focus cycle above, so it
  // needs its own effect. No loading-flag flip here either, same reasoning.
  useEffect(() => {
    if (refreshSignal === undefined) return;
    let active = true;
    getMyProgressPhotos()
      .then((data) => {
        if (active) setPhotos((current) => (haveSamePhotos(current, data) ? current : data));
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

  return (
    <PhotoGrid
      photos={visiblePhotos}
      loading={loading}
      emptyLabel={view === 'posts' ? t('profile.emptyPublicPhotos') : t('profile.emptyAllPhotos')}
      onPhotoPress={onPhotoPress}
    />
  );
});
