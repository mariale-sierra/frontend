import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import ModerationScreen from '../moderation';
import { listPendingReports } from '../../../services/reports/reports.service';
import { listBannedUsers, unbanUser } from '../../../services/user/user.service';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';

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
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) => (values?.username ? `${key}:${values.username}` : key),
  }),
}));
jest.mock('../../../hooks/useIsAdmin', () => ({ useIsAdmin: jest.fn() }));
jest.mock('../../../services/reports/reports.service', () => ({
  listPendingReports: jest.fn(),
  resolveReport: jest.fn(),
}));
jest.mock('../../../services/user/user.service', () => ({
  listBannedUsers: jest.fn(),
  unbanUser: jest.fn(),
}));

const BANNED = [
  { id: 'u-1', username: 'ana', display_name: 'Ana', profile_image_url: null },
  { id: 'u-2', username: 'beto', display_name: null, profile_image_url: null },
];

async function renderScreen(setup: { admin?: boolean; banned?: unknown; bannedFails?: boolean } = {}) {
  (useIsAdmin as jest.Mock).mockReturnValue(setup.admin ?? true);
  (listPendingReports as jest.Mock).mockResolvedValue({ reports: [], nextAfter: null });
  if (setup.bannedFails) (listBannedUsers as jest.Mock).mockRejectedValue(new Error('server'));
  else (listBannedUsers as jest.Mock).mockResolvedValue(setup.banned ?? BANNED);
  return renderWithTheme(<ModerationScreen />);
}

// B8: unbanning existed server-side but was unreachable from the app — a banned
// user's public profile 404s, so the admin had nowhere to find them.
describe('Moderation — banned users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
  });

  it('lists the banned users above the report queue', async () => {
    const screen = await renderScreen();

    await waitFor(() => expect(screen.getByText('moderation.bannedTitle')).toBeTruthy());
    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('@beto')).toBeTruthy();
    expect(screen.getByText('moderation.emptyMessage')).toBeTruthy();
  });

  it('asks first, then unbans, drops the row and confirms with a toast', async () => {
    (unbanUser as jest.Mock).mockResolvedValue({ message: 'User unbanned successfully' });
    const screen = await renderScreen();

    await fireEvent.press(await screen.findByLabelText('moderation.bannedA11y:ana'));
    expect(unbanUser).not.toHaveBeenCalled();
    expect(screen.getByText('moderation.confirmUnbanTitle:ana')).toBeTruthy();
    const confirmButtons = screen.getAllByText('moderation.unbanCta');
    await fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(unbanUser).toHaveBeenCalledWith('u-1'));
    await waitFor(() => expect(screen.queryByText('Ana')).toBeNull());
    expect(screen.getByText('@beto')).toBeTruthy();
    expect(useErrorNotificationStore.getState()).toMatchObject({
      visible: true,
      config: { message: 'moderation.unbannedMessage', variant: 'success' },
    });
  });

  it('keeps the user in the list when unbanning fails', async () => {
    (unbanUser as jest.Mock).mockRejectedValue(new Error('server'));
    const screen = await renderScreen();

    await fireEvent.press(await screen.findByLabelText('moderation.bannedA11y:ana'));
    const confirmButtons = screen.getAllByText('moderation.unbanCta');
    await fireEvent.press(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(unbanUser).toHaveBeenCalled());
    expect(screen.getByText('Ana')).toBeTruthy();
  });

  it('shows no section when nobody is banned', async () => {
    const screen = await renderScreen({ banned: [] });

    await waitFor(() => expect(screen.getByText('moderation.emptyMessage')).toBeTruthy());
    expect(screen.queryByText('moderation.bannedTitle')).toBeNull();
  });

  it('still shows the report queue when the banned list fails to load', async () => {
    const screen = await renderScreen({ bannedFails: true });

    await waitFor(() => expect(screen.getByText('moderation.emptyMessage')).toBeTruthy());
    expect(screen.queryByText('moderation.bannedTitle')).toBeNull();
  });

  it('never asks for the banned list when the viewer is not an admin', async () => {
    const screen = await renderScreen({ admin: false });

    expect(screen.getByText('moderation.adminOnly')).toBeTruthy();
    expect(listBannedUsers).not.toHaveBeenCalled();
  });
});
