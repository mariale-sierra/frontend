import type { TFunction } from 'i18next';
import { notificationText, notificationTextKey } from '../notificationText';
import type { NotificationContract } from '../../../types/notification';

// Echoes the key and name so assertions read exactly what was asked for.
const t = ((key: string, opts?: { name?: string; defaultValue?: string }) => {
  if (key === 'notifications.types.unknown_code') return opts?.defaultValue ?? '';
  if (key === 'notifications.deletedUser') return 'Deleted user';
  return opts?.name !== undefined ? `${key}|${opts.name}` : key;
}) as unknown as TFunction;

const base: NotificationContract = {
  id: '1',
  type: 'post_comment',
  category: 'social',
  isRead: false,
  createdAt: '2026-10-05T10:00:00.000Z',
  actor: { id: 'u2', username: 'bob', displayName: 'Bob B', profileImageUrl: null },
  entity: { type: 'workout_post', id: 'p1' },
  data: {},
  title: 'Nuevo comentario',
  body: 'Alguien comentó tu publicación.',
};

describe('notificationText', () => {
  it('uses the actor display name, or @username without one', () => {
    expect(notificationText(base, t)).toBe('notifications.types.post_comment|Bob B');
    expect(
      notificationText({ ...base, actor: { ...base.actor!, displayName: null } }, t),
    ).toBe('notifications.types.post_comment|@bob');
  });

  it('shows "Deleted user" when the actor account is gone or pending deletion', () => {
    expect(notificationText({ ...base, actor: null }, t)).toBe(
      'notifications.types.post_comment|Deleted user',
    );
  });

  it('does not call system events a deleted user', () => {
    expect(
      notificationText({ ...base, type: 'challenge_closed', actor: null }, t),
    ).toBe('notifications.types.challenge_closed|');
  });

  it.each([
    [{ type: 'space_join_response', data: { approved: 'true' } }, 'space_join_response_approved'],
    [{ type: 'space_join_response', data: { approved: 'false' } }, 'space_join_response_rejected'],
    [{ type: 'challenge_join_response', data: {} }, 'challenge_join_response_rejected'],
    [{ type: 'challenge_invite_response', data: { accepted: 'true' } }, 'challenge_invite_response_accepted'],
    [{ type: 'report_resolved', data: { outcome: 'actioned' } }, 'report_resolved_actioned'],
    [{ type: 'report_resolved', data: { outcome: 'dismissed' } }, 'report_resolved_dismissed'],
    [{ type: 'content_hidden', data: { strike: 'true' } }, 'content_hidden_strike'],
    [{ type: 'content_hidden', data: { strike: 'false' } }, 'content_hidden'],
  ])('picks the variant for %o', (input, key) => {
    expect(notificationTextKey(input as NotificationContract)).toBe(key);
  });

  it("falls back to the server's generic text for a type this app doesn't know", () => {
    expect(notificationText({ ...base, type: 'unknown_code' }, t)).toBe(
      'Alguien comentó tu publicación.',
    );
  });
});
