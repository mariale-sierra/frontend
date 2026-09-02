import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSpaceJoinRequests } from '../services/spaces/spaces.service';
import type { SpaceJoinRequestContract } from '../types/space';

export function useSpaceJoinRequests(spaceId: string | null) {
  const [requests, setRequests] = useState<SpaceJoinRequestContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getSpaceJoinRequests(spaceId)
      .then(setRequests)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [spaceId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { requests, loading, error, reload: load };
}
