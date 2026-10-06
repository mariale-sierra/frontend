import api from '../api';
import type {
  ConversationSummaryContract,
  MessageContract,
  MessagesPageContract,
} from '../../types/chat';

/** Starts a new 1:1 conversation, or returns the existing one if there's already one. */
export async function getOrCreateConversation(
  recipientUserId: string,
): Promise<ConversationSummaryContract> {
  const response = await api.post<ConversationSummaryContract>(
    '/chats/conversations',
    { recipientUserId },
  );
  return response.data;
}

/** The authenticated user's conversations, most recent activity first. */
export async function getConversations(): Promise<ConversationSummaryContract[]> {
  const response = await api.get<ConversationSummaryContract[]>(
    '/chats/conversations',
  );
  return Array.isArray(response.data) ? response.data : [];
}

interface GetMessagesOptions {
  before?: number;
  limit?: number;
}

/** Messages in a conversation, oldest-first. Pass `before` (from the previous page's `nextBefore`) to load older messages. */
export async function getMessages(
  conversationId: string,
  options: GetMessagesOptions = {},
): Promise<MessagesPageContract> {
  const response = await api.get<MessagesPageContract>(
    `/chats/conversations/${conversationId}/messages`,
    { params: options },
  );
  return response.data;
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<MessageContract> {
  const response = await api.post<MessageContract>(
    `/chats/conversations/${conversationId}/messages`,
    { content },
  );
  return response.data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.patch(`/chats/conversations/${conversationId}/read`);
}

/** Accepts a pending message request — only meaningful when the caller is
 * its recipient (`ConversationSummaryContract.isPending`); reveals the
 * composer in place of the Accept/Decline row. */
export async function acceptConversationRequest(
  conversationId: string,
): Promise<ConversationSummaryContract> {
  const response = await api.patch<ConversationSummaryContract>(
    `/chats/conversations/${conversationId}/accept`,
  );
  return response.data;
}

/** Declines a pending message request — removes the conversation for both
 * participants (Instagram-style "immediate delete", not a soft hide). */
export async function declineConversationRequest(conversationId: string): Promise<void> {
  await api.delete(`/chats/conversations/${conversationId}/decline`);
}

/** Deletes one of the caller's own messages (sender only; the rest of the
 * conversation is untouched). */
export async function deleteMessage(conversationId: string, messageId: number): Promise<void> {
  await api.delete(`/chats/conversations/${conversationId}/messages/${messageId}`);
}

/** Removes a conversation from the caller's OWN list only — unlike
 * declineConversationRequest, the other participant keeps it, and it comes
 * back if a new message is sent in it. */
export async function hideConversation(conversationId: string): Promise<void> {
  await api.delete(`/chats/conversations/${conversationId}`);
}
