import { getConversations } from '../services/chats/chats.service';
import type { ConversationSummaryContract } from '../types/chat';
import { useFocusedResource } from './useFocusedResource';

const NO_CONVERSATIONS: ConversationSummaryContract[] = [];

/** Conversation list, refreshed every time the screen regains focus (an unread
 * count or last-message preview may have changed in the thread just left) —
 * in place, without flashing the skeleton again. */
export function useConversations() {
  const { data, loading, error, reload } = useFocusedResource('conversations', getConversations, NO_CONVERSATIONS);
  return { conversations: data, loading, error, reload };
}
