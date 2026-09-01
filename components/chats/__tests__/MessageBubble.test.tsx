import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { MessageBubble } from '../MessageBubble';
import type { MessageContract } from '../../../types/chat';

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
});
