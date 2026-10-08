import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { MessageBubble } from '../MessageBubble';
import type { MessageContract } from '../../../types/chat';

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

const buildMessage = (overrides: Partial<MessageContract> = {}): MessageContract => ({
  id: 1,
  conversationId: 'conv-1',
  senderId: 'user-2',
  content: 'hola!',
  sentAt: new Date().toISOString(),
  readAt: null,
  ...overrides,
});

describe('MessageBubble', () => {
  it('renders the message content regardless of sender', async () => {
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage()} isMine={false} />,
    );

    expect(screen.getByText('hola!')).toBeTruthy();
  });

  it('renders a message sent by the caller the same way (own bubble styling)', async () => {
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ senderId: 'user-1' })} isMine />,
    );

    expect(screen.getByText('hola!')).toBeTruthy();
  });

  // B4: your own messages are deleted via long-press — no extra chrome.
  it('calls onLongPress when the bubble is long-pressed', async () => {
    const onLongPress = jest.fn();
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ id: 7, senderId: 'user-1' })} isMine onLongPress={onLongPress} />,
    );

    await fireEvent(screen.getByTestId('message-bubble-7'), 'longPress');

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('is not long-pressable at all without onLongPress (someone else\'s message)', async () => {
    const screen = await renderWithTheme(
      <MessageBubble message={buildMessage({ id: 8 })} isMine={false} />,
    );

    expect(screen.queryByTestId('message-bubble-8')).toBeNull();
    expect(screen.getByText('hola!')).toBeTruthy();
  });
});
