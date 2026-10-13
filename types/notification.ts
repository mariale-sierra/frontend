/** Stable notification type codes (backend src/notifications/notification-catalog.ts). */
export type NotificationTypeCode =
  | 'new_follower'
  | 'post_reaction'
  | 'post_comment'
  | 'direct_message'
  | 'space_message'
  | 'space_join_request'
  | 'space_join_response'
  | 'challenge_invite'
  | 'challenge_invite_response'
  | 'challenge_join_request'
  | 'challenge_join_response'
  | 'challenge_participant_joined'
  | 'challenge_closed'
  | 'challenge_removed'
  | 'report_resolved'
  | 'content_hidden';

export type NotificationCategory = 'social' | 'messages' | 'challenges' | 'spaces' | 'moderation';

/** The resource a notification opens — never the event itself. */
export type NotificationEntityType =
  | 'workout_post'
  | 'direct_message'
  | 'space'
  | 'user_follow'
  | 'challenge'
  | 'direct_conversation'
  | 'challenge_invite'
  | 'content_report'
  | 'user';

export interface NotificationActorContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

/** GET /notifications row (backend NotificationDto). */
export interface NotificationContract {
  id: string;
  /** A code this app version doesn't know yet is possible after a backend deploy. */
  type: NotificationTypeCode | string;
  category: NotificationCategory | string;
  isRead: boolean;
  createdAt: string;
  /** null for system events, or when the actor's account was deleted / is pending deletion. */
  actor: NotificationActorContract | null;
  entity: { type: NotificationEntityType | string; id: string | null };
  /** Navigation ids only (e.g. challengeId, approved, accepted). */
  data: Record<string, string>;
  /** Generic server-side fallback text, used only for unknown types. */
  title: string | null;
  body: string | null;
}

export interface NotificationsPage {
  notifications: NotificationContract[];
  nextCursor: string | null;
}

/** GET/PATCH /notifications/preferences row. */
export interface NotificationPreferenceContract {
  category: NotificationCategory;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  /** false: the inbox for this category can't be turned off (moderation acting on your content). */
  inAppConfigurable: boolean;
}

export interface NotificationPreferenceUpdate {
  category: NotificationCategory;
  inAppEnabled?: boolean;
  pushEnabled?: boolean;
}

/** `data` of a push notification (backend NotificationsService.sendPush). All values are strings. */
export interface PushNotificationData {
  notificationId?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}
