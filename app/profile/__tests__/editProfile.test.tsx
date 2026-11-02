import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import EditProfile from '../edit';
import { loadMyProfile } from '../../../services/cache/loaders';
import { updateMyProfile } from '../../../services/user/user.service';
import { storage } from '../../../utils/storage';
import i18n from '../../../i18n';
import { safeBack } from '../../../utils/navigation';

// Sprint 10, B10: pins Edit profile's behavior around the refactor (language
// toggle extracted to LanguageToggle; log out / delete account moved to
// Settings by B2). Written so it passes against the screen before and after.
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
jest.mock('../../../i18n', () => ({
  __esModule: true,
  default: { language: 'es', changeLanguage: jest.fn() },
  PREFERRED_LANGUAGE_KEY: 'preferredLanguage',
}));
jest.mock('../../../utils/storage', () => ({
  storage: { getItem: jest.fn(), setItem: jest.fn().mockResolvedValue(undefined), removeItem: jest.fn() },
}));
jest.mock('../../../utils/navigation', () => ({ safeBack: jest.fn() }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('../../../services/uploads/upload.service', () => ({
  uploadImageAsync: jest.fn(),
  // B5/CP6: edit.tsx now also imports this — real behavior is covered in
  // upload.service.test.ts, not here.
  normalizeUploadMimeType: jest.fn(() => 'image/jpeg'),
}));
jest.mock('../../../services/cache/loaders', () => ({ loadMyProfile: jest.fn() }));
jest.mock('../../../services/user/user.service', () => ({ updateMyProfile: jest.fn(), updateMyProfilePhoto: jest.fn() }));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ logout: jest.fn() }) }));

const profile = {
  id: 'u1',
  username: 'emily',
  display_name: 'Emily',
  bio: 'hola',
  profile_image_url: null,
  preferred_language: 'es',
  is_private: false,
};

describe('Edit profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadMyProfile as jest.Mock).mockResolvedValue(profile);
    (updateMyProfile as jest.Mock).mockImplementation(async (payload) => ({ ...profile, ...payload }));
  });

  it('applies and persists a language change right away', async () => {
    const screen = await renderWithTheme(<EditProfile />);
    await waitFor(() => expect(screen.getByText('profileEdit.languageEn')).toBeTruthy());

    await fireEvent.press(screen.getByText('profileEdit.languageEn'));

    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
    expect(storage.setItem).toHaveBeenCalledWith('preferredLanguage', 'en');
  });

  it('saves only what changed (PATCH semantics) and goes back', async () => {
    const screen = await renderWithTheme(<EditProfile />);
    await waitFor(() => expect(screen.getByText('profileEdit.languageEn')).toBeTruthy());

    await fireEvent.press(screen.getByText('profileEdit.languageEn'));
    await fireEvent.press(screen.getByText('profileEdit.save'));

    await waitFor(() => expect(updateMyProfile).toHaveBeenCalledWith({ preferred_language: 'en' }));
    expect(safeBack).toHaveBeenCalledWith('/(tabs)/profile');
  });

  it('goes back without a request when nothing changed', async () => {
    const screen = await renderWithTheme(<EditProfile />);
    await waitFor(() => expect(screen.getByText('profileEdit.save')).toBeTruthy());

    await fireEvent.press(screen.getByText('profileEdit.save'));

    await waitFor(() => expect(safeBack).toHaveBeenCalledWith('/(tabs)/profile'));
    expect(updateMyProfile).not.toHaveBeenCalled();
  });

  it('still offers log out when the profile cannot be loaded', async () => {
    (loadMyProfile as jest.Mock).mockRejectedValue(new Error('offline'));
    const screen = await renderWithTheme(<EditProfile />);

    await waitFor(() => expect(screen.getByText('profileEdit.loadError')).toBeTruthy());
    expect(screen.getByText('profile.logoutButton')).toBeTruthy();
  });
});
