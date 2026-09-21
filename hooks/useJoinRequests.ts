import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * The pending join requests of a private Space or challenge, refetched every time the
 * screen is focused (so coming back from answering one shows the rest). Owner-only, so
 * only ever called by the owner's screens. `fetchRequests` has to be a stable function
 * (a service function, not one made on each render), or it refetches on every render;
 * give `id` as `null` for none (nothing is fetched and it is not loading).
 *
 * The one hook behind `useSpaceJoinRequests` and `useChallengeJoinRequests`, which were
 * the same hook twice.
 */
export function useJoinRequests<T>(id: string | null, fetchRequests: (id: string) => Promise<T[]>) {
  const [requests, setRequests] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    fetchRequests(id)
      .then(setRequests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, fetchRequests]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { requests, loading, error, reload: load };
}
