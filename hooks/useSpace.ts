import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSpace } from '../services/spaces/spaces.service';
import type { SpaceContract } from '../types/space';

export function useSpace(spaceId: string | null) {
  const [space, setSpace] = useState<SpaceContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getSpace(spaceId)
      .then(setSpace)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [spaceId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { space, loading, error, reload: load };
}
