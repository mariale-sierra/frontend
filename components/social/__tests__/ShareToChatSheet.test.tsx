import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ShareToChatSheet } from '../ShareToChatSheet';
import { getConversations, getOrCreateConversation, sendMessage } from '../../../services/chats/chats.service';
import { searchUsers } from '../../../services/user/user.service';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ userId: 'viewer-1' }),
}));
jest.mock('../../../services/chats/chats.service', () => ({
  getConversations: jest.fn(),
  getOrCreateConversation: jest.fn(),
  sendMessage: jest.fn(),
}));
jest.mock('../../../services/user/user.service', () => ({
  searchUsers: jest.fn(),
}));

const mockedGetConversations = getConversations as jest.Mock;
const mockedGetOrCreate = getOrCreateConversation as jest.Mock;
const mockedSend = sendMessage as jest.Mock;
const mockedSearch = searchUsers as jest.Mock;

const participant = (id: string, username: string) => ({ id, username, displayName: null, profileImageUrl: null });

describe('ShareToChatSheet (B5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSend.mockResolvedValue({ id: 1 });
    mockedGetConversations.mockResolvedValue([
      { id: 'conv-bob', otherParticipant: participant('user-bob', 'bob'), isPending: false },
      // A request the viewer hasn't accepted: they can't send there yet.
      { id: 'conv-eve', otherParticipant: participant('user-eve', 'eve'), isPending: true },
    ]);
  });

  it('lists recent chats, minus unaccepted requests', async () => {
    const screen = await renderWithTheme(
      <ShareToChatSheet visible onClose={jest.fn()} content={{ workoutPostId: 'post-1' }} />,
    );

    await waitFor(() => expect(screen.getByText('@bob')).toBeTruthy());
    expect(screen.queryByText('@eve')).toBeNull();
  });

  it('sends the post into an existing conversation and marks it sent', async () => {
    const screen = await renderWithTheme(
      <ShareToChatSheet visible onClose={jest.fn()} content={{ workoutPostId: 'post-1' }} />,
    );
    await waitFor(() => expect(screen.getByTestId('share-send-user-bob')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('share-send-user-bob'));

    await waitFor(() => expect(screen.getByText('share.sent')).toBeTruthy());
    expect(mockedGetOrCreate).not.toHaveBeenCalled();
    expect(mockedSend).toHaveBeenCalledWith('conv-bob', '', { workoutPostId: 'post-1' });
  });

  it('resolves a conversation for a searched user before sending', async () => {
    mockedSearch.mockResolvedValue([
      { id: 'user-ana', username: 'ana', display_name: 'Ana', profile_image_url: null },
      { id: 'viewer-1', username: 'me', display_name: 'Me', profile_image_url: null },
    ]);
    mockedGetOrCreate.mockResolvedValue({ id: 'conv-ana' });
    const screen = await renderWithTheme(
      <ShareToChatSheet visible onClose={jest.fn()} content={{ challengeId: 'ch-1' }} />,
    );
    await waitFor(() => expect(screen.getByText('@bob')).toBeTruthy());

    await fireEvent.changeText(screen.getByPlaceholderText('share.searchPlaceholder'), 'an');
    await waitFor(() => expect(screen.getByTestId('share-send-user-ana')).toBeTruthy(), { timeout: 2000 });
    // Never offers sharing to yourself.
    expect(screen.queryByTestId('share-send-viewer-1')).toBeNull();

    await fireEvent.press(screen.getByTestId('share-send-user-ana'));

    await waitFor(() => expect(mockedSend).toHaveBeenCalledWith('conv-ana', '', { challengeId: 'ch-1' }));
    expect(mockedGetOrCreate).toHaveBeenCalledWith('user-ana');
  });

  it('offers the native share sheet only when given one', async () => {
    const onShareExternally = jest.fn();
    const screen = await renderWithTheme(
      <ShareToChatSheet
        visible
        onClose={jest.fn()}
        content={{ challengeId: 'ch-1' }}
        onShareExternally={onShareExternally}
      />,
    );

    await fireEvent.press(screen.getByTestId('share-externally'));
    expect(onShareExternally).toHaveBeenCalled();
  });
});
