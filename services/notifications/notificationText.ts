import type { TFunction } from 'i18next';
import type { NotificationContract } from '../../types/notification';

/** Types that are system events by design (no actor) — never "Deleted user". */
const SYSTEM_TYPES = new Set(['challenge_closed', 'report_resolved', 'content_hidden']);

/** The i18n key under `notifications.types` for a row, including its variant. */
export function notificationTextKey(n: Pick<NotificationContract, 'type' | 'data'>): string {
  const data = n.data ?? {};
  switch (n.type) {
    case 'space_join_response':
    case 'challenge_join_response':
      return `${n.type}_${data.approved === 'true' ? 'approved' : 'rejected'}`;
    case 'challenge_invite_response':
      return `${n.type}_${data.accepted === 'true' ? 'accepted' : 'declined'}`;
    case 'report_resolved':
      return `${n.type}_${data.outcome === 'actioned' ? 'actioned' : 'dismissed'}`;
    case 'content_hidden':
      return data.strike === 'true' ? 'content_hidden_strike' : 'content_hidden';
    default:
      return n.type;
  }
}

/** Display name for the actor: display name, @username, or "Deleted user" (B2: purged / pending-deletion actors come back as null). */
export function notificationActorName(
  n: Pick<NotificationContract, 'actor' | 'type'>,
  t: TFunction,
): string {
  if (n.actor) return n.actor.displayName || `@${n.actor.username}`;
  return SYSTEM_TYPES.has(n.type) ? '' : t('notifications.deletedUser');
}

/**
 * The row text, localized in the app from the type code. A type this app
 * version doesn't know (newer backend) falls back to the server's generic,
 * already-safe text.
 */
export function notificationText(n: NotificationContract, t: TFunction): string {
  const key = `notifications.types.${notificationTextKey(n)}`;
  const text = t(key, { name: notificationActorName(n, t), defaultValue: '' });
  if (text) return text;
  return n.body || n.title || t('notifications.types.fallback');
}
