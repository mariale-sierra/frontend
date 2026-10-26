import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import SettingsScreen from '../settings';

// Sprint 10, B2: the gear on the profile opens one Settings screen that groups
// what Neurolab participants looked for behind the old pencil.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useLocalSearchParams: () => ({}) };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
const mockLogout = jest.fn();
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ logout: mockLogout }) }));

describe('Settings screen (B2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('groups account, preferences, legal and session', async () => {
    const screen = await renderWithTheme(<SettingsScreen />);

    for (const key of ['settings.sections.account', 'settings.sections.preferences', 'settings.sections.legal', 'settings.sections.session']) {
      expect(screen.getByText(key)).toBeTruthy();
    }
  });

  it.each([
    ['settings-edit-profile', '/profile/edit'],
    ['settings-notifications', '/notification-settings'],
    ['settings-about', '/profile/about'],
    ['settings-delete-account', '/profile/delete-account'],
  ])('%s opens %s (the screen that already existed)', async (testID, route) => {
    const screen = await renderWithTheme(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId(testID));

    expect(router.push).toHaveBeenCalledWith(route);
  });

  it.each(['terms', 'privacy', 'community'])('opens the %s document in the legal viewer', async (doc) => {
    const screen = await renderWithTheme(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId(`settings-legal-${doc}`));

    expect(router.push).toHaveBeenCalledWith({ pathname: '/(auth)/legal', params: { doc } });
  });

  it('keeps the log-out confirmation: nothing happens until it is confirmed', async () => {
    const screen = await renderWithTheme(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('settings-logout'));
    expect(mockLogout).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('profile.logoutConfirmTitle')).toBeTruthy());

    // The confirmation's own button carries the same label as the row.
    const buttons = screen.getAllByText('profile.logoutButton');
    await fireEvent.press(buttons[buttons.length - 1]);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('links Help / FAQ (B9) from the legal and information section', async () => {
    const screen = await renderWithTheme(<SettingsScreen />);

    await fireEvent.press(screen.getByTestId('settings-help'));

    expect(router.push).toHaveBeenCalledWith('/profile/help');
  });
});
