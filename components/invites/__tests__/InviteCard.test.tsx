import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { InviteCard } from '../InviteCard';
import type { ChallengeInviteContract } from '../../../types/invite';

// The card only needs `t` — interpolate so assertions stay readable.
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
  }),
}));

const buildInvite = (
  overrides: Partial<ChallengeInviteContract> = {},
): ChallengeInviteContract => ({
  id: '1',
  status: 'pending',
  message: null,
  created_at: '2026-07-18T00:00:00Z',
  responded_at: null,
  expires_at: null,
  challenge: { id: 'c1', name: 'Test Challenge' },
  sender: { id: 'u1', username: 'alice' },
  recipient: { id: 'u2', username: 'bob' },
  ...overrides,
});

describe('InviteCard', () => {
  it('shows accept/decline for a pending received invite and fires onAction', async () => {
    const onAction = jest.fn();
    const invite = buildInvite();
    const screen = await renderWithTheme(
      <InviteCard
        invite={invite}
        direction="received"
        busy={false}
        processing={false}
        onAction={onAction}
      />,
    );

    await fireEvent.press(screen.getByText('invites.actions.accept'));
    expect(onAction).toHaveBeenCalledWith('accept', invite);

    await fireEvent.press(screen.getByText('invites.actions.decline'));
    expect(onAction).toHaveBeenCalledWith('decline', invite);
  });

  it('asks for confirmation before cancelling a sent invite', async () => {
    const onAction = jest.fn();
    const invite = buildInvite();
    const screen = await renderWithTheme(
      <InviteCard
        invite={invite}
        direction="sent"
        busy={false}
        processing={false}
        onAction={onAction}
      />,
    );

    // First press only opens the confirmation popup — no action yet.
    await fireEvent.press(screen.getByText('invites.actions.cancel'));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText('invites.confirmCancelTitle')).toBeTruthy();

    // Confirming inside the popup fires the cancel action.
    const cancelButtons = screen.getAllByText('invites.actions.cancel');
    await fireEvent.press(cancelButtons[cancelButtons.length - 1]);
    expect(onAction).toHaveBeenCalledWith('cancel', invite);
  });

  it('blocks actions while another invite is processing', async () => {
    const onAction = jest.fn();
    const screen = await renderWithTheme(
      <InviteCard
        invite={buildInvite()}
        direction="received"
        busy
        processing={false}
        onAction={onAction}
      />,
    );

    await fireEvent.press(screen.getByText('invites.actions.accept'));
    expect(onAction).not.toHaveBeenCalled();
  });

  it('hides all action buttons for a non-pending invite', async () => {
    const screen = await renderWithTheme(
      <InviteCard
        invite={buildInvite({ status: 'accepted' })}
        direction="received"
        busy={false}
        processing={false}
        onAction={jest.fn()}
      />,
    );

    expect(screen.queryByText('invites.actions.accept')).toBeNull();
    expect(screen.queryByText('invites.actions.decline')).toBeNull();
  });
});
