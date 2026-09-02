import { useCallback, useRef } from 'react';
import type { FlatList } from 'react-native';

// Larger than any realistic chat thread's rendered content height — scrolling
// to it clamps to the ACTUAL end regardless of whether the native side has
// fully "settled" on the true `contentSize` yet. `scrollToEnd()` computes an
// offset from that same `contentSize` internally, which is exactly the value
// this whole hook exists to work around being stale/wrong on a first render.
const SCROLL_TO_LATEST_OFFSET = 1_000_000;

// A late reflow (async font swap, an image finishing layout, etc.) can grow
// the content AFTER the first scroll already landed at what was, at the
// time, the true end — this second pass catches that without needing to
// diagnose exactly which of those it was.
const SETTLE_RETRY_DELAY_MS = 120;

/**
 * Keeps a message thread's FlatList scrolled to its latest message — used by
 * both 1:1 chat (`app/messaging/[conversationId].tsx`) and a space's thread
 * (`app/messaging/spaces/[id]/index.tsx`). Real, reported bug this fixes:
 * opening a thread dumped you at the TOP instead of the last message —
 * across two earlier attempts at this same fix (an effect + one
 * `requestAnimationFrame`, then `onContentSizeChange`/`onLayout` calling
 * `scrollToEnd()`), so the remaining, well-documented culprit is
 * `scrollToEnd()` itself: it computes its target offset from the native
 * scroll view's own `contentSize`, which on iOS/Android both have known
 * cases of silently under-reporting or no-op'ing on an early call.
 * `scrollToOffset` with a value far past any realistic content height sides
 * steps that — the native scroll view just clamps to the real end — which is
 * the standard workaround for this exact class of RN issue.
 *
 * Tracks the last message's own id (not just "did the array change") so it
 * only jumps to the bottom when something is genuinely appended at the tail
 * — the initial load, sending, or a new message arriving via poll. Loading
 * OLDER messages prepends at the HEAD instead (the last id doesn't change),
 * which deliberately does NOT re-trigger this — forcing the view back down
 * to the bottom every time would make "Load older messages" pointless.
 */
export function useScrollToLatestMessage<T extends { id: number }>(messages: T[]) {
  const listRef = useRef<FlatList<T>>(null);
  const lastIdRef = useRef<number | null>(null);
  // Read inside the handlers via a ref, not the `messages` closed-over
  // value — `onContentSizeChange`/`onLayout` are stable callbacks (no
  // dependency on `messages`), so they always need the CURRENT array, not
  // whatever it was when the FlatList last re-rendered.
  const messagesRef = useRef<T[]>(messages);
  messagesRef.current = messages;

  const jumpToLatest = useCallback((animated: boolean) => {
    listRef.current?.scrollToOffset({ offset: SCROLL_TO_LATEST_OFFSET, animated });
  }, []);

  const scrollToLatest = useCallback(() => {
    const current = messagesRef.current;
    if (current.length === 0) return;
    const latestId = current[current.length - 1].id;
    if (lastIdRef.current === latestId) return;

    // Jump instantly on the initial load (an animated scroll through a
    // whole history reads as jank) — animate for anything appended after.
    const isInitialLoad = lastIdRef.current === null;
    lastIdRef.current = latestId;
    jumpToLatest(!isInitialLoad);

    if (isInitialLoad) {
      setTimeout(() => jumpToLatest(false), SETTLE_RETRY_DELAY_MS);
    }
  }, [jumpToLatest]);

  return { listRef, onContentSizeChange: scrollToLatest, onLayout: scrollToLatest };
}
