import {
  openNotificationTarget,
  resolveNotificationTarget,
} from '../notificationRoutes';
import { getConversations } from '../../chats/chats.service';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';

jest.mock('../../chats/chats.service', () => ({ getConversations: jest.fn() }));

const UUID = '3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b';

describe('resolveNotificationTarget', () => {
  it.each([
    ['new_follower', 'user', UUID, {}, `/profile/${UUID}`],
    ['post_reaction', 'workout_post', UUID, {}, '/(tabs)/profile'],
    ['post_comment', 'workout_post', UUID, { commentId: '9' }, '/(tabs)/profile'],
    ['space_message', 'space', UUID, {}, `/messaging/spaces/${UUID}`],
    ['space_join_request', 'space', UUID, {}, `/messaging/spaces/${UUID}/join-requests`],
    ['space_join_response', 'space', UUID, { approved: 'true' }, `/messaging/spaces/${UUID}`],
    ['space_join_response', 'space', UUID, { approved: 'false' }, '/messaging/spaces'],
    ['challenge_invite', 'challenge_invite', '42', { challengeId: UUID }, '/invitations'],
    ['challenge_invite_response', 'challenge', UUID, { accepted: 'true' }, `/challenge/${UUID}`],
    ['challenge_join_request', 'challenge', UUID, {}, `/challenge/${UUID}/manage`],
    ['challenge_join_response', 'challenge', UUID, { approved: 'false' }, `/challenge/${UUID}`],
    ['challenge_participant_joined', 'challenge', UUID, {}, `/challenge/${UUID}`],
    ['challenge_closed', 'challenge', UUID, {}, `/challenge/${UUID}`],
    ['challenge_removed', 'challenge', UUID, {}, `/challenge/${UUID}`],
  ])('%s -> existing route', (type, entityType, entityId, data, href) => {
    expect(resolveNotificationTarget({ type, entityType, entityId, data })).toEqual({
      kind: 'route',
      href,
    });
  });

  it('opens a conversation through its id', () => {
    expect(
      resolveNotificationTarget({
        type: 'direct_message',
        entityType: 'direct_conversation',
        entityId: UUID,
      }),
    ).toEqual({ kind: 'conversation', conversationId: UUID });
  });

  it.each(['report_resolved', 'content_hidden'])('%s opens nothing', (type) => {
    expect(
      resolveNotificationTarget({ type, entityType: 'content_report', entityId: '3' }),
    ).toEqual({ kind: 'none' });
  });

  it('falls back to the entity for a type this app version does not know', () => {
    expect(
      resolveNotificationTarget({ type: 'brand_new_type', entityType: 'challenge', entityId: UUID }),
    ).toEqual({ kind: 'route', href: `/challenge/${UUID}` });
    expect(resolveNotificationTarget({ type: 'brand_new_type', entityType: 'weird' })).toEqual({
      kind: 'none',
    });
  });

  it('never builds a route from an id that is not a plain id (push payload is untrusted)', () => {
    for (const entityId of ['../settings', 'abc?x=1', 'a/b', '', null]) {
      expect(
        resolveNotificationTarget({ type: 'new_follower', entityType: 'user', entityId }),
      ).toEqual({ kind: 'none' });
    }
  });
});

describe('openNotificationTarget', () => {
  const router = { push: jest.fn() };

  beforeEach(() => {
    router.push.mockReset();
    (getConversations as jest.Mock).mockReset();
    useErrorNotificationStore.getState().hide?.();
  });

  it('pushes a plain route', async () => {
    await expect(
      openNotificationTarget(router, { kind: 'route', href: '/invitations' }),
    ).resolves.toBe(true);
    expect(router.push).toHaveBeenCalledWith('/invitations');
  });

  it('returns false and navigates nowhere for no target', async () => {
    await expect(openNotificationTarget(router, { kind: 'none' })).resolves.toBe(false);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('opens a conversation with the header data the chat screen needs', async () => {
    (getConversations as jest.Mock).mockResolvedValue([
      {
        id: UUID,
        isPending: true,
        otherParticipant: { id: 'u2', username: 'bob', displayName: null, profileImageUrl: null },
      },
    ]);

    await openNotificationTarget(router, { kind: 'conversation', conversationId: UUID });

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/messaging/[conversationId]',
      params: {
        conversationId: UUID,
        otherUserId: 'u2',
        otherUsername: 'bob',
        otherDisplayName: '',
        otherProfileImageUrl: '',
        isPending: '1',
      },
    });
  });

  it('lands on the messages inbox when the conversation is gone or not accessible', async () => {
    (getConversations as jest.Mock).mockResolvedValue([]);

    await openNotificationTarget(router, { kind: 'conversation', conversationId: UUID });

    expect(router.push).toHaveBeenCalledWith('/messaging');
    expect(useErrorNotificationStore.getState()).toEqual(
      expect.objectContaining({ visible: true }),
    );
  });

  it('does not crash when the conversations request fails', async () => {
    (getConversations as jest.Mock).mockRejectedValue(new Error('offline'));
    await expect(
      openNotificationTarget(router, { kind: 'conversation', conversationId: UUID }),
    ).resolves.toBe(true);
    expect(router.push).toHaveBeenCalledWith('/messaging');
  });
});
