import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getUserPosts } from '../../services/challenge/challenge.service';
import { PhotoGrid } from './PhotoGrid';
import type { ChallengePhoto } from '../../types/challenge';

interface UserPostsGridProps {
  userId: string;
  onPhotoPress?: (photo: ChallengePhoto) => void;
}

/**
 * First page of :userId's progress photos (GET /workout-posts/user/:userId).
 * The backend already applies visibility rules for the viewer (public posts,
 * plus 'followers'-visibility posts if the viewer follows them) — nothing to
 * filter client-side.
 */
export function UserPostsGrid({ userId, onPhotoPress }: UserPostsGridProps) {
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

  return (
    <PhotoGrid
      photos={photos}
      loading={loading}
      emptyLabel={t('profile.emptyUserPhotos')}
      onPhotoPress={onPhotoPress}
    />
  );
}
