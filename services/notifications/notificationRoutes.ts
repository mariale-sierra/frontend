import type { Href, useRouter } from 'expo-router';
import i18n from '../../i18n';
import { getConversations } from '../chats/chats.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';

type AppRouter = ReturnType<typeof useRouter>;

export type NotificationTarget =
  | { kind: 'route'; href: Href }
  | { kind: 'conversation'; conversationId: string }
  | { kind: 'none' };

/** What a tap needs, whether it came from the inbox row or from a push payload. */
export interface NotificationTargetInput {
  type?: string;
  entityType?: string;
  entityId?: string | null;
  data?: Record<string, unknown>;
}

// Ids arrive from a push payload too: only let plain id characters into a
// route, never path separators or query strings.
const SAFE_ID = /^[A-Za-z0-9-]{1,64}$/;

function safeId(id: string | null | undefined): string | null {
  return id && SAFE_ID.test(id) ? id : null;
}

/**
 * Maps a notification to an existing expo-router route. Pure (no I/O) so the
 * whole table is unit-tested. Types the app doesn't know yet (a newer backend)
 * fall back to the entity they point at; anything else opens nothing.
 */
export function resolveNotificationTarget(input: NotificationTargetInput): NotificationTarget {
  const id = safeId(input.entityId);
  const data = input.data ?? {};
  const none: NotificationTarget = { kind: 'none' };

  switch (input.type) {
    // Reactions/comments are on the recipient's own post; there's no
    // single-post screen, their own profile grid is where it lives.
    case 'post_reaction':
    case 'post_comment':
      return { kind: 'route', href: '/(tabs)/profile' };
    case 'space_join_request':
      return id ? { kind: 'route', href: `/messaging/spaces/${id}/join-requests` } : none;
    case 'space_join_response':
      // A rejected requester can't open the space's thread.
      if (data.approved !== 'true') return { kind: 'route', href: '/messaging/spaces' };
      return id ? { kind: 'route', href: `/messaging/spaces/${id}` } : none;
    case 'challenge_join_request':
      return id ? { kind: 'route', href: `/challenge/${id}/manage` } : none;
    case 'challenge_invite':
      return { kind: 'route', href: '/invitations' };
    case 'report_resolved':
    case 'content_hidden':
      return none;
    default:
      break;
  }

  switch (input.entityType) {
    case 'user':
    case 'user_follow':
      return id ? { kind: 'route', href: `/profile/${id}` } : none;
    case 'challenge':
      return id ? { kind: 'route', href: `/challenge/${id}` } : none;
    case 'space':
      return id ? { kind: 'route', href: `/messaging/spaces/${id}` } : none;
    case 'direct_conversation':
      return id ? { kind: 'conversation', conversationId: id } : none;
    case 'challenge_invite':
      return { kind: 'route', href: '/invitations' };
    case 'workout_post':
      return { kind: 'route', href: '/(tabs)/profile' };
    default:
      return none;
  }
}

/**
 * Navigates to a resolved target. A conversation needs its header data
 * (other participant, pending request state), so it's looked up in the
 * caller's own conversations first; if it no longer exists or isn't theirs
 * (declined, account gone) the user lands on the messages inbox with a short
 * note instead of a broken screen.
 *
 * Returns false when there was nowhere to go.
 */
export async function openNotificationTarget(
  router: Pick<AppRouter, 'push'>,
  target: NotificationTarget,
): Promise<boolean> {
  if (target.kind === 'none') return false;
  if (target.kind === 'route') {
    router.push(target.href);
    return true;
  }

  try {
    const conversation = (await getConversations()).find((c) => c.id === target.conversationId);
    if (conversation) {
      router.push({
        pathname: '/messaging/[conversationId]',
        params: {
          conversationId: conversation.id,
          otherUserId: conversation.otherParticipant.id,
          otherUsername: conversation.otherParticipant.username,
          otherDisplayName: conversation.otherParticipant.displayName ?? '',
          otherProfileImageUrl: conversation.otherParticipant.profileImageUrl ?? '',
          isPending: conversation.isPending ? '1' : '',
        },
      });
      return true;
    }
  } catch {
    // Network trouble: fall through to the inbox.
  }
  useErrorNotificationStore.getState().show({
    message: i18n.t('notifications.unavailable'),
    duration: 4000,
  });
  router.push('/messaging');
  return true;
}
