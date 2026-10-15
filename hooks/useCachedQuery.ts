import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  fetchQuery,
  getQueryEntry,
  observeQuery,
  subscribeQuery,
  type FetchQueryOptions,
} from '../services/cache/queryCache';

interface UseCachedQueryOptions {
  staleTime?: number;
  persist?: boolean;
  /** false = don't fetch (e.g. no user id yet). */
  enabled?: boolean;
}

const noopSubscribe = () => () => {};

/**
 * Reads `key` from the shared query cache (services/cache/queryCache.ts) and
 * fetches it when it is missing or older than `staleTime`. Every screen asking
 * for the same key shares one entry and one request, so moving between tabs
 * reuses what is already loaded instead of refetching it.
 *
 * - `isLoading`: nothing to show yet (first load) — the only time to render a skeleton.
 * - `revalidate()`: fetch only if stale — call it from a screen's `useFocusEffect`.
 * - `refetch()`: always ask the server — pull-to-refresh.
 */
export function useCachedQuery<T>(key: string | null, fetcher: () => Promise<T>, options: UseCachedQueryOptions = {}) {
  const { staleTime = 0, persist = false, enabled = true } = options;
  const activeKey = enabled ? key : null;

  // Latest fetcher without re-running effects every render (callers pass inline lambdas).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const subscribe = useCallback(
    (listener: () => void) => (activeKey ? subscribeQuery(activeKey, listener) : noopSubscribe()),
    [activeKey],
  );
  const entry = useSyncExternalStore(
    subscribe,
    () => getQueryEntry<T>(activeKey ?? ''),
    () => getQueryEntry<T>(activeKey ?? ''),
  );

  const run = useCallback(
    (force: boolean) => {
      if (!activeKey) return Promise.resolve(undefined);
      const fetchOptions: FetchQueryOptions = { staleTime, persist, force };
      return fetchQuery<T>(activeKey, () => fetcherRef.current(), fetchOptions).catch(() => undefined);
    },
    [activeKey, staleTime, persist],
  );

  useEffect(() => {
    if (!activeKey) return;
    void run(false);
    return observeQuery(activeKey, {
      fetcher: () => fetcherRef.current(),
      options: { staleTime, persist },
    });
  }, [activeKey, run, staleTime, persist]);

  const revalidate = useCallback(() => run(false), [run]);
  const refetch = useCallback(() => run(true), [run]);

  const data = activeKey ? entry.data : undefined;
  const hasData = Boolean(activeKey) && entry.hasData;
  const error = hasData ? undefined : entry.error;

  return {
    data,
    error,
    isLoading: Boolean(activeKey) && !hasData && !entry.error,
    isFetching: entry.isFetching,
    revalidate,
    refetch,
  };
}
