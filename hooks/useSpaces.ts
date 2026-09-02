import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSpaces } from '../services/spaces/spaces.service';
import type { SpaceContract } from '../types/space';

export function useSpaces() {
  const [spaces, setSpaces] = useState<SpaceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getSpaces()
      .then(setSpaces)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { spaces, loading, error, reload: load };
}
