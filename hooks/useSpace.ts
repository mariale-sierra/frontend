import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSpace } from '../services/spaces/spaces.service';
import type { SpaceContract } from '../types/space';

export function useSpace(spaceId: string | null) {
  const [space, setSpace] = useState<SpaceContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Re-focusing (back from Members/Manage/a profile) refreshes the space
  // silently — showing the loading state again flashed the preview skeleton
  // over content that was already on screen. Same pattern as
  // useSpaceMessages / useConversationMessages.
  const loadedSpaceIdRef = useRef<string | null>(null);

  const load = useCallback((options?: { silent?: boolean }) => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    if (!options?.silent) setLoading(true);
    setError(false);
    getSpace(spaceId)
      .then(setSpace)
      .catch(() => {
        if (!options?.silent) setError(true);
      })
      .finally(() => {
        if (!options?.silent) setLoading(false);
      });
  }, [spaceId]);

  useFocusEffect(
    useCallback(() => {
      load({ silent: loadedSpaceIdRef.current === spaceId });
      loadedSpaceIdRef.current = spaceId;
    }, [load, spaceId]),
  );

  const reload = useCallback(() => load(), [load]);

  return { space, loading, error, reload };
}
