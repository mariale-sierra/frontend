import { useEffect, useState } from 'react';
import { getPublicChallengePhotos } from '../services/challenge/challenge.service';
import type { ChallengePhoto } from '../types/challenge';

export function usePublicChallengePhotos(challengeId: string | null) {
  const [photos, setPhotos] = useState<ChallengePhoto[]>([]);
  const [loading, setLoading] = useState(challengeId != null);

  useEffect(() => {
    if (!challengeId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getPublicChallengePhotos(challengeId)
      .then((data) => {
        if (!cancelled) setPhotos(data);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  return { photos, loading };
}
