import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { JoinRequestListItem } from '../JoinRequestListItem';
import { colors, fillOpacity, radius } from '../../../constants/theme';

const request = (user: Partial<{ username: string; displayName: string | null; profileImageUrl: string | null }> = {}) => ({
  user: { username: 'ana', displayName: 'Ana Pérez', profileImageUrl: null, ...user },
});

const baseProps = {
  onApprove: jest.fn(),
  onReject: jest.fn(),
  approveA11yLabel: 'Approve',
  rejectA11yLabel: 'Reject',
};

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('JoinRequestListItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the requester's display name, or their @username when they have none", async () => {
    const named = await renderWithTheme(<JoinRequestListItem {...baseProps} request={request()} />);
    expect(named.getByText('Ana Pérez')).toBeTruthy();

    const bare = await renderWithTheme(<JoinRequestListItem {...baseProps} request={request({ displayName: null })} />);
    expect(bare.getByText('@ana')).toBeTruthy();
  });

  it('is one row for Spaces and challenges: what a screen reader says comes from the screen', async () => {
    const screen = await renderWithTheme(
      <JoinRequestListItem
        {...baseProps}
        request={request()}
        approveA11yLabel="Aprobar solicitud"
        rejectA11yLabel="Rechazar solicitud"
      />,
    );

    expect(screen.getByLabelText('Aprobar solicitud')).toBeTruthy();
    expect(screen.getByLabelText('Rechazar solicitud')).toBeTruthy();
  });

  it('approves and rejects with the buttons', async () => {
    const screen = await renderWithTheme(<JoinRequestListItem {...baseProps} request={request()} />);

    await fireEvent.press(screen.getByLabelText('Approve'));
    expect(baseProps.onApprove).toHaveBeenCalledTimes(1);
    expect(baseProps.onReject).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Reject'));
    expect(baseProps.onReject).toHaveBeenCalledTimes(1);
  });

  it('has a solid red ✕ and a solid green ✓, round: the wireframe (Chats-47E)', async () => {
    const screen = await renderWithTheme(<JoinRequestListItem {...baseProps} request={request()} />);

    expect(flat(screen.getByLabelText('Reject'))).toMatchObject({ backgroundColor: colors.error, borderRadius: radius.big });
    expect(flat(screen.getByLabelText('Approve'))).toMatchObject({ backgroundColor: colors.success, borderRadius: radius.big });
  });

  it('is busy while one is answered: both buttons are disabled, and only that one shows a spinner', async () => {
    const screen = await renderWithTheme(
      <JoinRequestListItem {...baseProps} request={request()} pendingAction="approve" />,
    );

    expect(screen.getByLabelText('Approve').props.accessibilityState?.disabled).toBe(true);
    expect(screen.getByLabelText('Reject').props.accessibilityState?.disabled).toBe(true);
    expect(JSON.stringify(screen.toJSON())).toContain('ActivityIndicator');
    // The reject button keeps its ✕; the approve one has no ✓ while it works.
    expect(JSON.stringify(screen.toJSON())).toContain('close-outline');
    expect(JSON.stringify(screen.toJSON())).not.toContain('checkmark-outline');
  });

  it('dims both buttons while busy, with the scale\'s loading-state dim, not a bare number', async () => {
    const screen = await renderWithTheme(
      <JoinRequestListItem {...baseProps} request={request()} pendingAction="reject" />,
    );

    expect(flat(screen.getByLabelText('Approve')).opacity).toBe(fillOpacity.dim);
    expect(flat(screen.getByLabelText('Reject')).opacity).toBe(fillOpacity.dim);
  });

  it('is not dimmed when nothing is pending', async () => {
    const screen = await renderWithTheme(<JoinRequestListItem {...baseProps} request={request()} />);

    expect(flat(screen.getByLabelText('Approve')).opacity).toBeUndefined();
  });
});
