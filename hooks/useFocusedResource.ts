import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Data a screen loads on focus and refreshes every time it is focused again
 * (conversations, spaces, members, join requests, follow lists), with the
 * rules every one of those screens needs:
 *
 * - `loading` only while there is nothing to show yet. Coming back to the
 *   screen refreshes in place instead of swapping the list for its skeleton.
 * - One request at a time: a focus or `reload()` while one is out shares it
 *   instead of sending a second one.
 * - A refresh that fails keeps what is on screen (only a failed first load is
 *   an error), and an answer for a previous `key` is dropped.
 *
 * `key` names what is loaded (e.g. the space id); `null` loads nothing and is
 * not loading. `fetcher` may be an inline function: the latest one is used.
 */
export function useFocusedResource<T>(key: string | null, fetcher: () => Promise<T>, initialData: T) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(key !== null);
  const [error, setError] = useState(false);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const initialRef = useRef(initialData);
  const keyRef = useRef(key);
  const hasDataRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);

  // Another key is another resource: start over from the first load.
  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    hasDataRef.current = false;
    inFlightRef.current = null;
    setData(initialRef.current);
    setError(false);
    setLoading(key !== null);
  }, [key]);

  const load = useCallback((): Promise<void> => {
    if (key === null) {
      setLoading(false);
      return Promise.resolve();
    }
    if (inFlightRef.current) return inFlightRef.current;
    if (!hasDataRef.current) setLoading(true);
    setError(false);

    const promise = Promise.resolve()
      .then(() => fetcherRef.current())
      .then((next) => {
        if (keyRef.current !== key) return;
        hasDataRef.current = true;
        setData(next);
      })
      .catch(() => {
        if (keyRef.current !== key) return;
        if (!hasDataRef.current) setError(true);
      })
      .finally(() => {
        if (inFlightRef.current === promise) inFlightRef.current = null;
        if (keyRef.current === key) setLoading(false);
      });
    inFlightRef.current = promise;
    return promise;
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { data, loading, error, reload: load };
}
