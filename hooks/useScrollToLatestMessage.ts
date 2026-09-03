import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlatList } from 'react-native';

// Larger than any realistic chat thread's rendered content height — scrolling
// to it clamps to the ACTUAL end regardless of whether the native side has
// fully "settled" on the true `contentSize` yet. `scrollToEnd()` computes an
// offset from that same `contentSize` internally, which is exactly the value
// this whole hook exists to work around being stale/wrong on a first render.
const SCROLL_TO_LATEST_OFFSET = 1_000_000;

// Debounce window for the initial load: revealed once `onLayout`/
// `onContentSizeChange` have gone QUIET for this long, not a fixed delay
// from the first event — see the doc comment below for why a flat delay
// wasn't enough (FlatList keeps progressively rendering rows well past any
// single early event).
const INITIAL_SETTLE_MS = 150;

// Safety net only — reveals the list even if content-size events never
// settle within a reasonable time (shouldn't happen, but hiding content
// forever is worse than one imperfectly-scrolled frame would have been).
const READY_FALLBACK_MS = 1200;

/**
 * Keeps a message thread's FlatList scrolled to its latest message — used by
 * both 1:1 chat (`app/messaging/[conversationId].tsx`) and a space's thread
 * (`app/messaging/spaces/[id]/index.tsx`).
 *
 * Real, reported bug history, in order:
 * 1. An effect + one `requestAnimationFrame` calling `scrollToEnd()` — not
 *    reliable; the native side's `contentSize` isn't guaranteed settled
 *    just because a JS frame passed.
 * 2. `onContentSizeChange`/`onLayout` calling `scrollToEnd()`, list always
 *    visible — fixed landing at the bottom (via `scrollToOffset` past any
 *    realistic content height, sidestepping `scrollToEnd()`'s own
 *    `contentSize` dependency), but left a one-frame flash of the TOP
 *    before the jump, since content painted at its natural position before
 *    either event fired.
 * 3. Hid the list (`ready` state, opacity) until the FIRST of either event
 *    fired, revealing one frame later — STILL flashed, because `onLayout`
 *    can fire based on the FlatList's OWN measured viewport, before any
 *    row inside it has been rendered/measured at all.
 * 4. Hid the list until `INITIAL_SETTLE_MS` after the FIRST event — no more
 *    flash, but landed in "an awkward middle" instead of the true bottom:
 *    FlatList keeps progressively rendering/measuring more rows for a
 *    while (well past any single early event), so content height was still
 *    growing after that one-shot timer fired and revealed the list.
 *
 * The actual fix: debounce, not a one-shot delay. While not yet "ready",
 * EVERY `onLayout`/`onContentSizeChange` call re-issues the scroll AND
 * resets the same settle timer — so the list only reveals once those
 * events have gone quiet for `INITIAL_SETTLE_MS`, however many rounds of
 * layout that actually takes, instead of assuming one timer window is
 * always enough.
 *
 * Tracks the last message's own id (not just "did the array change") so
 * anything AFTER the initial reveal only re-scrolls when something is
 * genuinely appended at the tail — sending, or a new message arriving via
 * poll. Loading OLDER messages prepends at the HEAD instead (the last id
 * doesn't change), which deliberately does NOT re-trigger a scroll —
 * forcing the view back down to the bottom every time would make
 * "Load older messages" pointless.
 */
export function useScrollToLatestMessage<T extends { id: number }>(messages: T[]) {
  const listRef = useRef<FlatList<T>>(null);
  const lastIdRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  // Read inside the handlers via a ref, not the `messages` closed-over
  // value — `onContentSizeChange`/`onLayout` are stable callbacks (no
  // dependency on `messages`), so they always need the CURRENT array, not
  // whatever it was when the FlatList last re-rendered.
  const messagesRef = useRef<T[]>(messages);
  messagesRef.current = messages;

  const reveal = useCallback(() => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    readyRef.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    const fallback = setTimeout(reveal, READY_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, [reveal]);

  const jumpToLatest = useCallback((animated: boolean) => {
    listRef.current?.scrollToOffset({ offset: SCROLL_TO_LATEST_OFFSET, animated });
  }, []);

  const scrollToLatest = useCallback(() => {
    const current = messagesRef.current;
    if (current.length === 0) {
      // Nothing to scroll to (empty thread) — reveal the "No messages yet"
      // state instead of hiding it forever.
      reveal();
      return;
    }

    const latestId = current[current.length - 1].id;
    const isNewTail = lastIdRef.current !== latestId;
    if (isNewTail) {
      lastIdRef.current = latestId;
    }

    if (!readyRef.current) {
      // Not yet trusted to be at the true bottom — nudge again on every
      // single call (content may still be growing) and push the reveal
      // timer back out each time, so it only actually fires once these
      // events stop coming for a full `INITIAL_SETTLE_MS` stretch.
      jumpToLatest(false);
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
      settleTimeoutRef.current = setTimeout(() => {
        jumpToLatest(false);
        reveal();
      }, INITIAL_SETTLE_MS);
      return;
    }

    // Already settled — only a genuinely new message at the tail (send,
    // poll) should animate the view down; a "Load older" prepend (or an
    // unrelated layout event, e.g. the keyboard opening) leaves `latestId`
    // unchanged and is deliberately ignored here.
    if (isNewTail) {
      jumpToLatest(true);
    }
  }, [jumpToLatest, reveal]);

  return { listRef, ready, onContentSizeChange: scrollToLatest, onLayout: scrollToLatest };
}
