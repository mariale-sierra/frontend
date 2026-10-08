/** Public shape of a conversation's other participant (backend ConversationParticipantDto). */
export interface ConversationParticipantContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

/** What a message carries: plain text, or a shared post/challenge (with an
 * optional comment in `content`). */
export type MessageKind = 'text' | 'post' | 'challenge';

/** Preview of a conversation's last message (backend LastMessagePreviewDto). */
export interface LastMessagePreviewContract {
  id: number;
  content: string;
  senderId: string;
  sentAt: string;
  /** Optional only for an older API deployment that predates sharing. */
  kind?: MessageKind;
}

/** A workout post shared inside a message (backend SharedPostPreviewDto),
 * resolved for the viewer: `available: false` means deleted, hidden or not
 * visible to them — every other field is then null. */
export interface SharedPostPreviewContract {
  id: string;
  available: boolean;
  imageUrl: string | null;
  caption: string | null;
  author: ConversationParticipantContract | null;
}

/** A challenge shared inside a message (backend SharedChallengePreviewDto). */
export interface SharedChallengePreviewContract {
  id: string;
  available: boolean;
  name: string | null;
  description: string | null;
  durationDays: number | null;
  visibility: string | null;
  membersJoined: number | null;
  dominantActivityCategory: string | null;
}

/** Content to share in a message — at most one of the two. */
export interface SharedContentPayload {
  workoutPostId?: string;
  challengeId?: string;
}

/** GET/POST /chats/conversations row (backend ConversationSummaryDto). */
export interface ConversationSummaryContract {
  id: string;
  createdAt: string;
  otherParticipant: ConversationParticipantContract;
  lastMessage: LastMessagePreviewContract | null;
  unreadCount: number;
  /** True when the CALLER is the recipient of a not-yet-accepted message
   * request (Instagram-style) — the person who started the conversation
   * always sees `false` for their own copy of it. A pending conversation's
   * composer is replaced by an Accept/Decline row (see
   * `app/messaging/[conversationId].tsx`) until accepted. Space threads
   * have their own, separate join-request system (Chats-47E) — this only
   * applies to 1:1 conversations. */
  isPending: boolean;
}

/** GET/POST /chats/conversations/:id/messages row (backend MessageDto). */
export interface MessageContract {
  id: number;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt: string | null;
  sharedPost?: SharedPostPreviewContract | null;
  sharedChallenge?: SharedChallengePreviewContract | null;
}

/** GET /chats/conversations/:id/messages response shape. */
export interface MessagesPageContract {
  messages: MessageContract[];
  nextBefore: number | null;
}
