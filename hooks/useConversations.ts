import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getConversations } from '../services/chats/chats.service';
import type { ConversationSummaryContract } from '../types/chat';

/** Conversation list, reloaded every time the screen regains focus — same
 * pattern as FollowListScreen, so returning from a chat thread (where an
 * unread count or last-message preview may have changed) shows fresh data. */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummaryContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getConversations()
      .then(setConversations)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { conversations, loading, error, reload: load };
}
