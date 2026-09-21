import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getChallengeJoinRequests } from '../services/challenge/challenge.service';
import type { ChallengeJoinRequestContract } from '../types/challenge';

/** Owner-only. Mirrors useSpaceJoinRequests.ts exactly. */
export function useChallengeJoinRequests(challengeId: string | null) {
  const [requests, setRequests] = useState<ChallengeJoinRequestContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!challengeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getChallengeJoinRequests(challengeId)
      .then(setRequests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [challengeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { requests, loading, error, reload: load };
}
