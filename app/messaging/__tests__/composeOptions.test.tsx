import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import Messaging from '../index';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useFocusEffect: jest.fn() };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'me' }) }));
jest.mock('../../../hooks/useConversations', () => ({
  useConversations: () => ({ conversations: [], loading: false, error: null, reload: jest.fn() }),
}));
jest.mock('../../../hooks/useSpaces', () => ({
  useSpaces: () => ({ spaces: [], loading: false, error: null, reload: jest.fn() }),
}));
jest.mock('../../../hooks/useSpaceThreadPreviews', () => ({
  useSpaceThreadPreviews: () => ({ previews: [], loading: false }),
}));
jest.mock('../../../hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }),
}));
jest.mock('../../../utils/composeCoachMark', () => ({
  hasSeenComposeCoachMark: jest.fn().mockResolvedValue(true),
  markComposeCoachMarkSeen: jest.fn(),
}));

// Sprint 10: the compose button no longer opens a sheet — the list slides away
// and the two options appear as buttons under the search bar.
describe('Chats — compose options', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with the list showing and the options hidden', async () => {
    const screen = await renderWithTheme(<Messaging />);

    expect(screen.getByTestId('chats-compose-button').props.accessibilityState).toEqual(
      expect.objectContaining({ expanded: false }),
    );
    expect(screen.getByTestId('chats-compose-options', { includeHiddenElements: true }).props.pointerEvents).toBe(
      'none',
    );
    expect(screen.getByTestId('chats-content', { includeHiddenElements: true }).props.pointerEvents).toBe('auto');
  });

  it('swaps the list for the two options, and closes again from the same button', async () => {
    const screen = await renderWithTheme(<Messaging />);

    await fireEvent.press(screen.getByTestId('chats-compose-button'));

    expect(screen.getByTestId('chats-compose-options', { includeHiddenElements: true }).props.pointerEvents).toBe(
      'auto',
    );
    expect(screen.getByTestId('chats-content', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
    expect(screen.getByText('chats.newMessageTitle')).toBeTruthy();
    expect(screen.getByText('spaces.createCta')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('chats-compose-button'));

    expect(screen.getByTestId('chats-compose-options', { includeHiddenElements: true }).props.pointerEvents).toBe(
      'none',
    );
  });

  it('opens New message or Create space from the options', async () => {
    const screen = await renderWithTheme(<Messaging />);

    await fireEvent.press(screen.getByTestId('chats-compose-button'));
    await fireEvent.press(screen.getByTestId('chats-compose-new-message'));
    expect(router.push).toHaveBeenCalledWith('/messaging/new');

    await fireEvent.press(screen.getByTestId('chats-compose-button'));
    await fireEvent.press(screen.getByTestId('chats-compose-new-space'));
    expect(router.push).toHaveBeenCalledWith('/messaging/spaces/create');
  });

  it('closes the options with the back arrow instead of leaving the screen', async () => {
    const screen = await renderWithTheme(<Messaging />);

    await fireEvent.press(screen.getByTestId('chats-compose-button'));
    await fireEvent.press(screen.getByLabelText('common.actions.back'));

    expect(screen.getByTestId('chats-compose-options', { includeHiddenElements: true }).props.pointerEvents).toBe(
      'none',
    );
    expect(router.back).not.toHaveBeenCalled();
  });
});
