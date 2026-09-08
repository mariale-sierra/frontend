import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic pull-to-refresh state: wraps an async reload function with a
 * `refreshing` flag shaped for RefreshControl's `refreshing`/`onRefresh`
 * props, so screens don't each hand-roll the same try/finally toggle (the
 * pattern `hooks/useInvites.ts` already used locally, generalized here for
 * reuse across screens that don't otherwise need a dedicated hook).
 */
export function usePullToRefresh(onReload: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onReload();
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [onReload]);

  return { refreshing, onRefresh };
}
