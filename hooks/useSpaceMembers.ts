import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSpaceMembers } from '../services/spaces/spaces.service';
import type { SpaceMemberContract } from '../types/space';

export function useSpaceMembers(spaceId: string | null) {
  const [members, setMembers] = useState<SpaceMemberContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getSpaceMembers(spaceId)
      .then(setMembers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [spaceId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { members, loading, error, reload: load };
}
