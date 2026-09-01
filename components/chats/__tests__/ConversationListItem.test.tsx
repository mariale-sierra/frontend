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

  it('shows the unread count, capped at "9+"', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={buildConversation({ unreadCount: 12 })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('9+')).toBeTruthy();
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
