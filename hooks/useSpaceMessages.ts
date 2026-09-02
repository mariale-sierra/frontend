import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSpaceMessages, sendSpaceMessage } from '../services/spaces/spaces.service';
import type { SpaceMessageContract } from '../types/space';

const POLL_INTERVAL_MS = 5000;
const POLL_PAGE_SIZE = 50;

/**
 * Message thread for one space: initial load, "load older" pagination,
 * sending, and a focus-scoped poll for new incoming messages — the same
 * shape as `useConversationMessages` (1:1 chat), since there's no
 * websocket/push infra in this app yet and polling is the simplest way to
 * see a new message without leaving and re-entering the screen. Doesn't call
 * a "mark read" endpoint — unlike 1:1 conversations, spaces don't currently
 * surface an unread count anywhere in the UI (see the Spaces list/card),
 * so there's nothing for it to update yet.
 */
export function useSpaceMessages(spaceId: string | null) {
  const [messages, setMessages] = useState<SpaceMessageContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const oldestIdRef = useRef<number | null>(null);
  const latestIdRef = useRef<number | null>(null);

  const loadLatest = useCallback(() => {
    if (!spaceId) return;
    setLoading(true);
    setError(false);
    getSpaceMessages(spaceId)
      .then((page) => {
        setMessages(page.messages);
        oldestIdRef.current = page.messages[0]?.id ?? null;
        latestIdRef.current = page.messages[page.messages.length - 1]?.id ?? null;
        setHasMore(page.nextBefore !== null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [spaceId]);

  const poll = useCallback(() => {
    if (!spaceId) return;
    getSpaceMessages(spaceId, { limit: POLL_PAGE_SIZE })
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
      })
      .catch(() => {
        // Silent — a missed poll tick isn't worth surfacing as an error.
      });
  }, [spaceId]);

  useFocusEffect(
    useCallback(() => {
      if (!spaceId) return;
      loadLatest();
      const interval = setInterval(poll, POLL_INTERVAL_MS);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spaceId]),
  );

  const loadOlder = useCallback(() => {
    if (!spaceId || loadingOlder || !hasMore || oldestIdRef.current === null) return;
    setLoadingOlder(true);
    getSpaceMessages(spaceId, { before: oldestIdRef.current })
      .then((page) => {
        if (page.messages.length > 0) {
          oldestIdRef.current = page.messages[0].id;
          setMessages((prev) => [...page.messages, ...prev]);
        }
        setHasMore(page.nextBefore !== null);
      })
      .finally(() => setLoadingOlder(false));
  }, [spaceId, hasMore, loadingOlder]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!spaceId || !trimmed || sending) return;
      setSending(true);
      try {
        const message = await sendSpaceMessage(spaceId, trimmed);
        setMessages((prev) => [...prev, message]);
        latestIdRef.current = message.id;
        if (oldestIdRef.current === null) oldestIdRef.current = message.id;
      } finally {
        setSending(false);
      }
    },
    [spaceId, sending],
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
