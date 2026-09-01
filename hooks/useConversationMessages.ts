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

  const loadLatest = useCallback(() => {
    setLoading(true);
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
      .finally(() => setLoading(false));
  }, [conversationId]);

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
      loadLatest();
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
