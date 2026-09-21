import { StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import UserProfile from '../[userId]';
import { banUser, getPublicProfile } from '../../../services/user/user.service';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';
import { colors, fillOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

const USER_ID = '11111111-1111-4111-8111-111111111111';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({ userId: '11111111-1111-4111-8111-111111111111' }),
    useFocusEffect: (callback: () => void | (() => void)) => require('react').useEffect(callback, [callback]),
    useIsFocused: () => true,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'admin-1' }) }));
jest.mock('../../../hooks/useIsAdmin', () => ({ useIsAdmin: jest.fn() }));
jest.mock('../../../hooks/usePullToRefresh', () => ({ usePullToRefresh: () => ({ refreshing: false, onRefresh: jest.fn() }) }));
jest.mock('../../../services/user/user.service', () => ({ getPublicProfile: jest.fn(), banUser: jest.fn() }));
// The profile's own parts are tested on their own; here they are markers, and the follow button is
// the one thing the admin's button sits under.
jest.mock('../../../components/profile', () => {
  const { Text, View } = require('react-native');
  return {
    ProfileHeader: ({ actions }: { actions?: React.ReactNode }) => <View>{actions}</View>,
    FollowButton: () => <Text>follow-button</Text>,
    UserPostsGrid: () => null,
    ProfilePhotoModal: () => null,
  };
});

// The rendered tree holds the theme provider, which refers back to itself.
const stringify = (value: unknown) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === 'object' && item !== null) {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }
    return item;
  });
};

const flat = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

async function renderProfile(admin: boolean) {
  (useIsAdmin as jest.Mock).mockReturnValue(admin);
  (getPublicProfile as jest.Mock).mockResolvedValue({
    id: USER_ID,
    username: 'carlos',
    is_following: false,
    followers_count: 3,
    following_count: 1,
  });
  const screen = await renderWithTheme(<UserProfile />);
  await waitFor(() => expect(screen.getByText('follow-button')).toBeTruthy());
  return screen;
}

describe("Another user's profile — the admin's ban action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
  });

  it('is only for an admin', async () => {
    const other = await renderProfile(false);
    expect(other.queryByText('profile.banUserButton')).toBeNull();

    const admin = await renderProfile(true);
    expect(admin.getByText('profile.banUserButton')).toBeTruthy();
  });

  it("is the app's soft destructive button — a translucent `error` fill and rim — not a bare red link", async () => {
    const screen = await renderProfile(true);
    const button = screen.getByLabelText('profile.banUserA11y');

    expect(flat(button)).toMatchObject({
      backgroundColor: withAlpha(colors.error, fillOpacity.chip),
      borderColor: colors.error,
    });
    expect(stringify(screen.toJSON())).toContain(`"name":"ban-outline","size":16,"color":"${colors.error}"`);
  });

  it('asks first, in a popup with a ban icon', async () => {
    const screen = await renderProfile(true);

    await fireEvent.press(screen.getByLabelText('profile.banUserA11y'));

    expect(screen.getByText('profile.banUserTitle')).toBeTruthy();
    expect(screen.getByText('profile.banUserDescription')).toBeTruthy();
    // One ban icon on the button, one on the popup, in the destructive color.
    expect(stringify(screen.toJSON())).toContain(`"icon":"ban-outline","iconColor":"${colors.error}"`);
    expect(banUser).not.toHaveBeenCalled();
  });

  it('bans once confirmed, closes the popup, and says it was done', async () => {
    (banUser as jest.Mock).mockResolvedValue(undefined);
    const screen = await renderProfile(true);

    await fireEvent.press(screen.getByLabelText('profile.banUserA11y'));
    await fireEvent.press(screen.getByText('profile.banUserConfirm'));

    await waitFor(() => expect(banUser).toHaveBeenCalledWith(USER_ID));
    await waitFor(() => expect(screen.queryByText('profile.banUserTitle')).toBeNull());
    expect(useErrorNotificationStore.getState()).toMatchObject({
      visible: true,
      config: { message: 'profile.banUserSuccess', variant: 'success' },
    });
  });

  it('bans no one when it is cancelled', async () => {
    const screen = await renderProfile(true);

    await fireEvent.press(screen.getByLabelText('profile.banUserA11y'));
    await fireEvent.press(screen.getByText('profile.banUserCancel'));

    expect(banUser).not.toHaveBeenCalled();
    expect(useErrorNotificationStore.getState().visible).toBe(false);
  });

  it('says nothing was done when the ban fails: the popup stays, with no success toast', async () => {
    (banUser as jest.Mock).mockRejectedValue(new Error('server'));
    const screen = await renderProfile(true);

    await fireEvent.press(screen.getByLabelText('profile.banUserA11y'));
    await fireEvent.press(screen.getByText('profile.banUserConfirm'));

    await waitFor(() => expect(banUser).toHaveBeenCalled());
    expect(useErrorNotificationStore.getState().visible).toBe(false);
    expect(screen.getByText('profile.banUserTitle')).toBeTruthy();
  });
});
