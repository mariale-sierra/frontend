import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import Profile from '../profile';

// Sprint 10, B2: Neurolab participants looked for settings and log out behind
// the pencil, which only opened Edit profile. Now a gear opens Settings and
// Edit profile is a visible button under the header.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return { router, useRouter: () => router, useFocusEffect: () => undefined, useLocalSearchParams: () => ({}) };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ username: 'emily', userId: 'u1' }) }));
jest.mock('../../../hooks/useIsAdmin', () => ({ useIsAdmin: () => false }));
jest.mock('../../../hooks/useCachedQuery', () => ({
  useCachedQuery: () => ({
    data: {
      username: 'emily',
      display_name: 'Emily',
      bio: null,
      profile_image_url: null,
      streak_days: 0,
      followers_count: 0,
      following_count: 0,
      practice_preferences: [],
    },
    isLoading: false,
    revalidate: jest.fn(),
    refetch: jest.fn(),
  }),
}));
jest.mock('../../../hooks/useUserPosts', () => ({
  useUserPosts: () => ({
    photos: [],
    isLoading: false,
    hasMore: false,
    loadingMore: false,
    loadMore: jest.fn(),
    revalidate: jest.fn(),
    refetch: jest.fn(),
  }),
}));
jest.mock('../../../components/badges', () => ({ BadgesSection: () => null }));

describe('Profile tab — settings entry (B2)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('the gear opens Settings', async () => {
    const screen = await renderWithTheme(<Profile />);

    await fireEvent.press(screen.getByTestId('open-settings'));

    expect(router.push).toHaveBeenCalledWith('/profile/settings');
    expect(screen.getByTestId('open-settings').props.accessibilityLabel).toBe('settings.openA11y');
  });

  it('keeps Edit profile one tap away, as a labelled button', async () => {
    const screen = await renderWithTheme(<Profile />);

    expect(screen.getByText('profile.editButton')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('profile-edit-button'));

    expect(router.push).toHaveBeenCalledWith('/profile/edit');
  });
});
