import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  getMessages,
  markConversationRead,
  sendMessage as sendMessageRequest,
} from '../services/chats/chats.service';
import type { MessageContract } from '../types/chat';

const POLL_INTERVAL_MS = 5000;
const POLL_PAGE_SIZE = 50;

/**
 * Message thread for one conversation: initial load (marks it read),
 * "load older" pagination, sending, and a focus-scoped poll for new incoming
 * messages. There's no websocket/push infra in this app yet, so polling is
 * the simplest way to see a reply without leaving and re-entering the
 * screen — stops as soon as the screen loses focus.
 */
export function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = useState<MessageContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const oldestIdRef = useRef<number | null>(null);
  const latestIdRef = useRef<number | null>(null);
  // Real, reported bug: "clicking the username to check out the profile
  // works, but when you go back to the chat, you are sent to the beginning
  // of the chat thread again." Root cause traced to this hook, not the
  // scroll logic itself (`useScrollToLatestMessage` correctly declines to
  // re-scroll here, since nothing genuinely changed at the tail): the old
  // `loadLatest` called `setLoading(true)` unconditionally, including from
  // `useFocusEffect` — which fires on EVERY re-focus, not just the first
  // mount, so navigating to the profile screen and back flipped `loading`
  // back to `true`. The chat screen's own JSX is a ternary that fully
  // UNMOUNTS the `FlatList` while `loading` is true (`app/messaging/
  // [conversationId].tsx`) — so returning from the profile screen genuinely
  // remounted a fresh `FlatList` instance with no scroll history, landing
  // at its own default top position. Same class of bug, same fix, as Home's
  // own feed re-focus effect (`app/(tabs)/index.tsx`) already documents:
  // only flip the loading flag for the GENUINE first load; every focus
  // after that refreshes `messages` silently in place.
  const hasLoadedOnceRef = useRef(false);
  // Defensive: resets the "silent refresh" flag if this hook instance were
  // ever reused across a different `conversationId` (e.g. via
  // `router.setParams` instead of pushing a new screen) — otherwise a
  // genuinely different conversation's first load would wrongly skip the
  // spinner using the PREVIOUS conversation's `hasLoadedOnceRef` state.
  const conversationIdRef = useRef(conversationId);
  if (conversationIdRef.current !== conversationId) {
    conversationIdRef.current = conversationId;
    hasLoadedOnceRef.current = false;
  }

  const loadLatest = useCallback(
    (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true);
      setError(false);
      getMessages(conversationId)
        .then((page) => {
          setMessages(page.messages);
          oldestIdRef.current = page.messages[0]?.id ?? null;
          latestIdRef.current =
            page.messages[page.messages.length - 1]?.id ?? null;
          setHasMore(page.nextBefore !== null);
          return markConversationRead(conversationId);
        })
        .catch(() => setError(true))
        .finally(() => {
          if (!options?.silent) setLoading(false);
        });
    },
    [conversationId],
  );

  const poll = useCallback(() => {
    getMessages(conversationId, { limit: POLL_PAGE_SIZE })
      .then((page) => {
        const newer =
          latestIdRef.current === null
            ? page.messages
            : page.messages.filter((m) => m.id > latestIdRef.current!);
        if (newer.length === 0) return;

        setMessages((prev) => [...prev, ...newer]);
        latestIdRef.current = newer[newer.length - 1].id;
        if (oldestIdRef.current === null) {
          oldestIdRef.current = newer[0].id;
        }
        markConversationRead(conversationId).catch(() => {});
      })
      .catch(() => {
        // Silent — a missed poll tick isn't worth surfacing as an error.
      });
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      loadLatest({ silent: hasLoadedOnceRef.current });
      hasLoadedOnceRef.current = true;
      const interval = setInterval(poll, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]),
  );

  const loadOlder = useCallback(() => {
    if (loadingOlder || !hasMore || oldestIdRef.current === null) return;
    setLoadingOlder(true);
    getMessages(conversationId, { before: oldestIdRef.current })
      .then((page) => {
        if (page.messages.length > 0) {
          oldestIdRef.current = page.messages[0].id;
          setMessages((prev) => [...page.messages, ...prev]);
        }
        setHasMore(page.nextBefore !== null);
      })
      .finally(() => setLoadingOlder(false));
  }, [conversationId, hasMore, loadingOlder]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending) return;
      setSending(true);
      try {
        const message = await sendMessageRequest(conversationId, trimmed);
        setMessages((prev) => [...prev, message]);
        latestIdRef.current = message.id;
        if (oldestIdRef.current === null) oldestIdRef.current = message.id;
      } finally {
        setSending(false);
      }
    },
    [conversationId, sending],
  );

  return {
    messages,
    loading,
    error,
    sending,
    hasMore,
    loadingOlder,
    loadOlder,
    send,
    reload: loadLatest,
  };
}
