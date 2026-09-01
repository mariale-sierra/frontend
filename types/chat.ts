/** Public shape of a conversation's other participant (backend ConversationParticipantDto). */
export interface ConversationParticipantContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

/** Preview of a conversation's last message (backend LastMessagePreviewDto). */
export interface LastMessagePreviewContract {
  id: number;
  content: string;
  senderId: string;
  sentAt: string;
}

/** GET/POST /chats/conversations row (backend ConversationSummaryDto). */
export interface ConversationSummaryContract {
  id: string;
  createdAt: string;
  otherParticipant: ConversationParticipantContract;
  lastMessage: LastMessagePreviewContract | null;
  unreadCount: number;
}

/** GET/POST /chats/conversations/:id/messages row (backend MessageDto). */
export interface MessageContract {
  id: number;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
}

/** GET /chats/conversations/:id/messages response shape. */
export interface MessagesPageContract {
  messages: MessageContract[];
  nextBefore: number | null;
}
