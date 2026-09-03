import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ConversationListItem } from '../ConversationListItem';
import type { ConversationSummaryContract } from '../../../types/chat';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${Object.values(params).join(',')}` : key,
  }),
}));

const buildConversation = (
  overrides: Partial<ConversationSummaryContract> = {},
): ConversationSummaryContract => ({
  id: 'conv-1',
  createdAt: '2026-08-01T00:00:00Z',
  otherParticipant: {
    id: 'user-2',
    username: 'bob',
    displayName: null,
    profileImageUrl: null,
  },
  lastMessage: null,
  unreadCount: 0,
  isPending: false,
  ...overrides,
});

describe('ConversationListItem', () => {
  it('shows the username when there is no display name, and no unread badge', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation()}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('@bob')).toBeTruthy();
    expect(screen.getByText('chats.noMessagesYet')).toBeTruthy();
  });

  it('prefixes the preview with "you" when the caller sent the last message', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation({
          lastMessage: {
            id: 1,
            content: 'hola!',
            senderId: 'user-1',
            sentAt: '2026-09-01T00:00:00Z',
          },
        })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('chats.lastMessageFromYou:hola!')).toBeTruthy();
  });

  it('shows the raw content (no "you" prefix) when the other participant sent the last message', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation({
          lastMessage: {
            id: 1,
            content: 'hey!',
            senderId: 'user-2',
            sentAt: '2026-09-01T00:00:00Z',
          },
        })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('hey!')).toBeTruthy();
  });

  // Per the Chats-46A wireframe: unread is a small colored dot before the
  // name (+ bold text), NOT a numeric count badge — replaced the old
  // "9+" badge behavior with this, 2026-08-31.
  it('shows a filled unread dot (not a count) once there are unread messages', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation({ unreadCount: 12 })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.queryByText('12')).toBeNull();
    expect(screen.queryByText('9+')).toBeNull();
    const dotStyle = screen.getByTestId('unread-dot').props.style;
    const flatStyle = Array.isArray(dotStyle) ? Object.assign({}, ...dotStyle) : dotStyle;
    expect(flatStyle.backgroundColor).not.toBe('transparent');
  });

  it('keeps the unread dot transparent (a same-size spacer) when there is nothing unread', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation({ unreadCount: 0 })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    const dotStyle = screen.getByTestId('unread-dot').props.style;
    const flatStyle = Array.isArray(dotStyle) ? Object.assign({}, ...dotStyle) : dotStyle;
    expect(flatStyle.backgroundColor).toBe('transparent');
  });

  it('shows a "Message request" label instead of the last message preview when pending', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation({
          isPending: true,
          lastMessage: {
            id: 1,
            content: 'hey, saw your post!',
            senderId: 'user-2',
            sentAt: '2026-09-01T00:00:00Z',
          },
        })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('chats.messageRequestLabel')).toBeTruthy();
    expect(screen.queryByText('hey, saw your post!')).toBeNull();
  });

  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation()}
        currentUserId="user-1"
        onPress={onPress}
      />,
    );

    fireEvent.press(screen.getByText('@bob'));
    expect(onPress).toHaveBeenCalled();
  });
});
