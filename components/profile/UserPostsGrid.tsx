import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getUserPosts } from '../../services/challenge/challenge.service';
import { PhotoGrid } from './PhotoGrid';
import type { ChallengePhoto } from '../../types/challenge';

interface UserPostsGridProps {
  userId: string;
  onPhotoPress?: (photo: ChallengePhoto) => void;
  /** Bumped by the parent screen's pull-to-refresh (a value change, any
   * value) to force a refetch outside the normal focus-effect cycle — this
   * component owns its own fetch, so a parent-level refresh has no other way
   * to reach it. */
  refreshSignal?: number;
}

/**
 * First page of :userId's progress photos (GET /workout-posts/user/:userId).
 * The backend already applies visibility rules for the viewer (public posts,
 * plus 'followers'-visibility posts if the viewer follows them) — nothing to
 * filter client-side.
 */
export function UserPostsGrid({ userId, onPhotoPress, refreshSignal }: UserPostsGridProps) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getUserPosts(userId)
        .then(({ photos: page }) => {
          if (active) setPhotos(page);
        })
        .catch(() => {
          if (active) setPhotos([]);
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
  // needs its own effect. No loading-flag flip: RefreshControl's own spinner
  // already covers this, and toggling it here would also swap PhotoGrid to
  // its skeleton mid-pull.
  useEffect(() => {
    if (refreshSignal === undefined) return;
    let active = true;
    getUserPosts(userId)
      .then(({ photos: page }) => {
        if (active) setPhotos(page);
      })
      .catch(() => {
        // Leave the currently displayed photos as-is on a failed refresh.
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  return (
    <PhotoGrid
      photos={photos}
      loading={loading}
      emptyLabel={t('profile.emptyUserPhotos')}
      onPhotoPress={onPhotoPress}
    />
  );
}
