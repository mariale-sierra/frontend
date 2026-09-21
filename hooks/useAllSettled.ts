import { useCallback, useEffect, useRef } from 'react';

/**
 * Waits for a group of things that each report in when they are done — the photos of a deck
 * of cards, each one loaded or failed — and calls `onAllSettled` ONCE, when every one of
 * `keys` has, or once `timeoutMs` has passed since the group appeared, whichever comes
 * first: a slow one should cost its card its picture, not the screen its cards. Returns
 * `settle(key)`, for each of them to call (as often as it likes: a repeat is nothing).
 * With no keys there is nothing to wait for: it is settled at once.
 */
export function useAllSettled(keys: readonly string[], onAllSettled: (() => void) | undefined, timeoutMs: number) {
  const settled = useRef(new Set<string>());
  const finished = useRef(false);
  // The latest of these, so a late `settle` or the timer never calls a stale one.
  const latest = useRef({ keys, onAllSettled });
  latest.current = { keys, onAllSettled };

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    latest.current.onAllSettled?.();
  }, []);

  const check = useCallback(() => {
    if (latest.current.keys.every((key) => settled.current.has(key))) finish();
  }, [finish]);

  useEffect(() => {
    check();
    const timer = setTimeout(finish, timeoutMs);
    return () => clearTimeout(timer);
  }, [check, finish, timeoutMs]);

  return useCallback(
    (key: string) => {
      settled.current.add(key);
      check();
    },
    [check],
  );
}
