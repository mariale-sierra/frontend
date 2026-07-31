import { useEffect, useState } from 'react';
import { getChallengeProgress } from '../services/challenge/challenge.service';
import { progressToHomeActiveChallengeViewModel } from '../services/adapters/homeAdapter';
import type { HomeActiveChallengeViewModel } from '../services/adapters/homeAdapter';
import type { ChallengeProgressContract } from '../types/challenge';

// Keyed by challengeId (or '' for "the caller's current active challenge",
// i.e. no id passed) — a single shared value used to cause every challenge's
// progress screen to show the same card regardless of which one was opened.
const progressCache = new Map<string, ChallengeProgressContract | null>();

/**
 * Clears the progress cache. Must be called on login/logout so a new session
 * never renders the previous user's cached challenge progress.
 */
export function invalidateChallengeProgressCache() {
  progressCache.clear();
}

export function useChallengeProgress(challengeId?: string | null) {
  const cacheKey = challengeId ?? '';
  const [progress, setProgress] = useState<ChallengeProgressContract | null>(
    progressCache.has(cacheKey) ? progressCache.get(cacheKey)! : null,
  );
  const [loading, setLoading] = useState(!progressCache.has(cacheKey));

  useEffect(() => {
    let cancelled = false;

    if (progressCache.has(cacheKey)) {
      setProgress(progressCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    getChallengeProgress(challengeId ?? undefined)
      .then((nextProgress) => {
        progressCache.set(cacheKey, nextProgress);
        if (!cancelled) setProgress(nextProgress);
      })
      .catch(() => {
        progressCache.set(cacheKey, null);
        if (!cancelled) setProgress(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, challengeId]);

  const challenge: HomeActiveChallengeViewModel | null = progress
    ? progressToHomeActiveChallengeViewModel(progress)
    : null;

  return {
    progress,
    challenge,
    loading,
  };
}
