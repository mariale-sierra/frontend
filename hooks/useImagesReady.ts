import { useEffect, useRef, useState } from 'react';
import { Image } from 'react-native';

/** The longest a screen waits for its photos before showing anyway. */
export const IMAGES_READY_TIMEOUT_MS = 6000;

/**
 * Sprint 10: a screen with photos (Explore's cards, a challenge's header) keeps
 * its loading skeleton until those photos are downloaded too, so everything
 * appears at once instead of the content first and the photos seconds later.
 *
 * Downloads `urls` into the image cache (`Image.prefetch`) once `enabled` (the
 * screen's data has loaded) and returns true when they are all done — loaded or
 * failed — or after IMAGES_READY_TIMEOUT_MS, so a slow or broken photo never
 * keeps the screen waiting. Only the first load waits: once ready it stays
 * ready, so a refresh (which can bring new signed URLs) never brings the
 * skeleton back.
 */
export function useImagesReady(
  urls: Array<string | null | undefined>,
  { enabled = true, timeoutMs = IMAGES_READY_TIMEOUT_MS }: { enabled?: boolean; timeoutMs?: number } = {},
): boolean {
  const key = urls.filter((url): url is string => !!url).join('\n');
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const everReady = useRef(false);

  useEffect(() => {
    if (!enabled || everReady.current) return;
    if (key === '') {
      setReadyKey(key);
      return;
    }

    let cancelled = false;
    const done = () => {
      if (!cancelled) setReadyKey(key);
    };
    const timer = setTimeout(done, timeoutMs);
    Promise.allSettled(
      key.split('\n').map((url) => (typeof Image.prefetch === 'function' ? Image.prefetch(url) : undefined)),
    ).then(done);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, key, timeoutMs]);

  if (enabled && readyKey === key) everReady.current = true;
  return everReady.current;
}
