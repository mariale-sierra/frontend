import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { MessageBubble } from '../MessageBubble';
import { ConversationListItem } from '../ConversationListItem';
import type { ConversationSummaryContract, MessageContract } from '../../../types/chat';

// A shared challenge loads the full challenge to draw the real Explore card;
// stand-ins for that request and for the card itself.
const mockGetChallenge = jest.fn();
jest.mock('../../../services/challenge/challenge.service', () => ({
  getChallenge: (...args: unknown[]) => mockGetChallenge(...args),
}));
jest.mock('../../challenge/list/challengeCards', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    ExploreCard: ({ challenge, onPress, onLongPress }: { challenge: { title: string }; onPress: () => void; onLongPress?: () => void }) =>
      React.createElement(
        Pressable,
        { testID: 'explore-card', onPress, onLongPress },
        React.createElement(Text, null, challenge.title),
      ),
  };
});

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key}:${Object.values(params).join(',')}` : key),
  }),
}));

const buildMessage = (overrides: Partial<MessageContract> = {}): MessageContract => ({
  id: 1,
  conversationId: 'conv-1',
  senderId: 'user-2',
  content: '',
  sentAt: new Date().toISOString(),
  readAt: null,
  sharedPost: null,
  sharedChallenge: null,
  ...overrides,
});

const visiblePost = {
  id: 'post-1',
  available: true,
  imageUrl: 'https://example.com/a.jpg',
  caption: 'Día 3 #legday',
  author: { id: 'user-3', username: 'carla', displayName: 'Carla', profileImageUrl: null },
};

describe('MessageBubble — shared content (B5)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetChallenge.mockReset();
    mockGetChallenge.mockResolvedValue({
      id: 'ch-1',
      name: '30 días de fuerza',
      duration_days: 30,
      cycle_length_days: 3,
      dominant_activity_category: 'strength',
    });
  });

  it('renders a shared post as a card, with no empty text bubble', async () => {
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ sharedPost: visiblePost })} isMine={false} />,
    );

    expect(screen.getByTestId('shared-post-card')).toBeTruthy();
    expect(screen.getByText('Carla')).toBeTruthy();
    expect(screen.getByText('#legday')).toBeTruthy();
  });

  it("opens the post on its author's profile when the card is tapped", async () => {
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ sharedPost: visiblePost })} isMine={false} />,
    );

    await fireEvent.press(screen.getByTestId('shared-post-card'));

    // Opens the author's profile with this very post open on it.
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/profile/[userId]', params: { userId: 'user-3', postId: 'post-1' } });
  });

  it('shows the comment sent along with the share', async () => {
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ sharedPost: visiblePost, content: 'mira esto' })} isMine />,
    );

    expect(screen.getByTestId('shared-post-card')).toBeTruthy();
    expect(screen.getByText('mira esto')).toBeTruthy();
  });

  it('never shows content of a post the viewer cannot see', async () => {
    const screen = await renderWithTheme(
      <MessageBubble
        message={buildMessage({
          sharedPost: { id: 'post-2', available: false, imageUrl: null, caption: null, author: null },
        })}
        isMine={false}
      />,
    );

    expect(screen.queryByTestId('shared-post-card')).toBeNull();
    expect(screen.getByText('chats.sharedPostUnavailable')).toBeTruthy();
  });

  // A share with no comment has no text bubble — the card itself must take
  // the long-press, or your own share could never be deleted.
  it('long-pressing a shared card (no comment) triggers the delete action', async () => {
    const onLongPress = jest.fn();
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ sharedPost: visiblePost })} isMine onLongPress={onLongPress} />,
    );

    await fireEvent(screen.getByTestId('shared-post-card'), 'longPress');

    expect(onLongPress).toHaveBeenCalled();
  });

  it('renders a shared challenge and opens it on tap', async () => {
    const screen = await renderWithTheme(
      <MessageBubble
        message={buildMessage({
          sharedChallenge: {
            id: 'ch-1',
            available: true,
            name: '30 días de fuerza',
            description: null,
            durationDays: 30,
            visibility: 'public',
            membersJoined: 4,
            dominantActivityCategory: 'strength',
          },
        })}
        isMine={false}
      />,
    );

    // The same card as Explore, built from the full challenge.
    await waitFor(() => expect(screen.getByText('30 días de fuerza')).toBeTruthy());
    expect(mockGetChallenge).toHaveBeenCalledWith('ch-1');
    await fireEvent.press(screen.getByTestId('explore-card'));
    expect(mockPush).toHaveBeenCalledWith('/challenge/ch-1');
  });

  it('shows "no longer available" when the challenge can no longer be loaded', async () => {
    mockGetChallenge.mockRejectedValueOnce(new Error('404'));
    const screen = await renderWithTheme(
      <MessageBubble
        message={buildMessage({
          sharedChallenge: {
            id: 'ch-gone',
            available: true,
            name: 'x',
            description: null,
            durationDays: 30,
            visibility: 'public',
            membersJoined: 0,
            dominantActivityCategory: null,
          },
        })}
        isMine={false}
      />,
    );

    await waitFor(() => expect(screen.getByText('chats.sharedChallengeUnavailable')).toBeTruthy());
  });
});

describe('ConversationListItem — shared content preview (B5)', () => {
  const conversation = (lastMessage: ConversationSummaryContract['lastMessage']): ConversationSummaryContract => ({
    id: 'conv-1',
    createdAt: '2026-08-01T00:00:00Z',
    otherParticipant: { id: 'user-2', username: 'bob', displayName: null, profileImageUrl: null },
    lastMessage,
    unreadCount: 0,
    isPending: false,
  });

  it('describes a share sent without a comment', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={conversation({
          id: 1,
          content: '',
          senderId: 'user-2',
          sentAt: '2026-08-01T00:00:00Z',
          kind: 'post',
        })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('chats.sharedPostPreview')).toBeTruthy();
  });

  it('prefixes your own shared challenge with "you"', async () => {
    const screen = await renderWithTheme(
      <ConversationListItem
        conversation={conversation({
          id: 1,
          content: '',
          senderId: 'user-1',
          sentAt: '2026-08-01T00:00:00Z',
          kind: 'challenge',
        })}
        currentUserId="user-1"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText('chats.lastMessageFromYou:chats.sharedChallengePreview')).toBeTruthy();
  });
});
