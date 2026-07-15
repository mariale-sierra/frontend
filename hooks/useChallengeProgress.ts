import { useEffect, useState } from 'react';
import { getChallengeProgress } from '../services/challenge/challenge.service';
import { progressToHomeActiveChallengeViewModel } from '../services/adapters/homeAdapter';
import type { HomeActiveChallengeViewModel } from '../services/adapters/homeAdapter';
import type { ChallengeProgressContract } from '../types/challenge';

let cachedProgress: ChallengeProgressContract | null | undefined;

/**
 * Clears the module-level progress cache. Must be called on login/logout so a
 * new session never renders the previous user's cached challenge progress.
 */
export function invalidateChallengeProgressCache() {
  cachedProgress = undefined;
}

export function useChallengeProgress() {
  const [progress, setProgress] = useState<ChallengeProgressContract | null>(
    cachedProgress === undefined ? null : cachedProgress,
  );
  const [loading, setLoading] = useState(cachedProgress === undefined);

  useEffect(() => {
    let cancelled = false;

    if (cachedProgress !== undefined) {
      setProgress(cachedProgress);
      setLoading(false);
      return;
    }

    getChallengeProgress()
      .then((nextProgress) => {
        cachedProgress = nextProgress;
        if (!cancelled) setProgress(nextProgress);
      })
      .catch(() => {
        cachedProgress = null;
        if (!cancelled) setProgress(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const challenge: HomeActiveChallengeViewModel | null = progress
    ? progressToHomeActiveChallengeViewModel(progress)
    : null;

  return {
    progress,
    challenge,
    loading,
  };
}
