import { useCallback, useEffect, useRef, useState } from 'react';
import { IMAGES_READY_TIMEOUT_MS } from './useImagesReady';

/**
 * Sprint 10: like `useImagesReady`, but waits for the images to be actually
 * drawn, not just downloaded — a full-size profile photo still takes a moment
 * to decode and shrink into its circle after the download. The screen renders
 * its real content invisibly under a skeleton, each image reports `onDrawn(id)`
 * from its `onLoadEnd`, and this returns ready once every id in `ids` has (or
 * after `timeoutMs`, so a slow photo never keeps it waiting). Only the first
 * load waits: once ready it stays ready, so a refresh never brings the
 * skeleton back.
 */
export function useImagesDrawn(
  ids: string[],
  { enabled = true, timeoutMs = IMAGES_READY_TIMEOUT_MS }: { enabled?: boolean; timeoutMs?: number } = {},
): { ready: boolean; onDrawn: (id: string) => void } {
  const [drawn, setDrawn] = useState<ReadonlySet<string>>(() => new Set());
  const [timedOut, setTimedOut] = useState(false);
  const everReady = useRef(false);

  useEffect(() => {
    if (!enabled || everReady.current) return;
    const timer = setTimeout(() => setTimedOut(true), timeoutMs);
    return () => clearTimeout(timer);
  }, [enabled, timeoutMs]);

  const onDrawn = useCallback((id: string) => {
    setDrawn((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);

  if (enabled && (timedOut || ids.every((id) => drawn.has(id)))) everReady.current = true;
  return { ready: everReady.current, onDrawn };
}
