import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import ChallengeDetail from '../[id]/index';
import { getChallenge } from '../../../services/challenge/challenge.service';
import { acceptInvite, declineInvite, getReceivedInvites } from '../../../services/invites/invite.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';
import { markChallengeMembershipSeen } from '../../../utils/seenChallengeMemberships';
import { invalidateChallengeProgressCache } from '../../../hooks/useChallengeProgress';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
let mockParams: Record<string, string> = { id: 'ch-1' };
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: (callback: () => void | (() => void)) => require('react').useEffect(callback, [callback]),
    useIsFocused: () => true,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values?.username ? `${key}:${values.username}` : values?.name ? `${key}:${values.name}` : key,
  }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'owner-1' }) }));
jest.mock('../../../hooks/useIsAdmin', () => ({ useIsAdmin: jest.fn() }));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  closeChallenge: jest.fn(),
  joinChallenge: jest.fn(),
}));
jest.mock('../../../services/user/user.service', () => ({ getMyChallenges: jest.fn() }));
jest.mock('../../../services/invites/invite.service', () => ({
  getReceivedInvites: jest.fn(),
  acceptInvite: jest.fn(),
  declineInvite: jest.fn(),
}));
jest.mock('../../../hooks/useChallengeProgress', () => ({ invalidateChallengeProgressCache: jest.fn() }));
jest.mock('../../../components/challenge/challengeAccentBackdrop', () => ({ ChallengeAccentBackdrop: () => null }));
jest.mock('../../../utils/seenChallengeMemberships', () => ({ markChallengeMembershipSeen: jest.fn() }));
// Stage 4's join callout — not under test here, and pulls in the real
// AsyncStorage native module (via utils/storage.ts) if left unmocked.
jest.mock('../../../utils/challengeJoinCallout', () => ({
  hasSeenChallengeJoinCallout: jest.fn().mockResolvedValue(true),
  markChallengeJoinCalloutSeen: jest.fn(),
}));

const challenge = (overrides: Record<string, unknown> = {}) => ({
  id: 'ch-1',
  name: 'Morning Run',
  duration_days: 30,
  created_by_user_id: 'someone-else',
  ...overrides,
});

async function renderInfo(setup: { challenge?: unknown; enrolled?: unknown[]; admin?: boolean } = {}) {
  (getChallenge as jest.Mock).mockResolvedValue(setup.challenge ?? challenge());
  (getMyChallenges as jest.Mock).mockResolvedValue(setup.enrolled ?? []);
  (useIsAdmin as jest.Mock).mockReturnValue(setup.admin ?? false);
  const screen = await renderWithTheme(<ChallengeDetail />);
  await waitFor(() => expect(screen.getByText('Morning Run')).toBeTruthy());
  return screen;
}

const invite = (overrides: Record<string, unknown> = {}) => ({
  id: 'inv-1',
  status: 'pending',
  created_at: '2026-10-20T00:00:00Z',
  challenge: { id: 'ch-1', name: 'Morning Run' },
  sender: { id: 'u-2', username: 'ana' },
  recipient: { id: 'owner-1', username: 'me' },
  ...overrides,
});

describe('Challenge info — opened from an invite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: 'ch-1', inviteId: 'inv-1' };
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
  });

  it('shows who invited you, with Decline and Accept instead of Join', async () => {
    (getReceivedInvites as jest.Mock).mockResolvedValue([invite()]);
    const screen = await renderInfo();

    await waitFor(() => expect(screen.getByTestId('challenge-invite-bar')).toBeTruthy());
    expect(screen.getByText('invites.invitedYou:ana')).toBeTruthy();
    expect(screen.getByText('invites.actions.accept')).toBeTruthy();
    expect(screen.getByText('invites.actions.decline')).toBeTruthy();
    expect(screen.queryByText('challengeInfo.joinChallengeButton')).toBeNull();
  });

  it('Accept accepts the invite, refreshes the challenge tabs and lands on Mine', async () => {
    (getReceivedInvites as jest.Mock).mockResolvedValue([invite()]);
    (acceptInvite as jest.Mock).mockResolvedValue(invite({ status: 'accepted' }));
    const screen = await renderInfo();
    await waitFor(() => expect(screen.getByTestId('challenge-invite-accept')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('challenge-invite-accept'));

    await waitFor(() => expect(acceptInvite).toHaveBeenCalledWith('inv-1'));
    expect(invalidateChallengeProgressCache).toHaveBeenCalled();
    expect(markChallengeMembershipSeen).toHaveBeenCalledWith('ch-1');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/challenges?view=mine');
  });

  it('Decline declines it, and the regular Join button comes back', async () => {
    (getReceivedInvites as jest.Mock).mockResolvedValue([invite()]);
    (declineInvite as jest.Mock).mockResolvedValue(invite({ status: 'declined' }));
    const screen = await renderInfo();
    await waitFor(() => expect(screen.getByTestId('challenge-invite-decline')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('challenge-invite-decline'));

    await waitFor(() => expect(declineInvite).toHaveBeenCalledWith('inv-1'));
    await waitFor(() => expect(screen.queryByTestId('challenge-invite-bar')).toBeNull());
    expect(screen.getByText('challengeInfo.joinChallengeButton')).toBeTruthy();
  });

  it('ignores an invite that was already answered, or is for another challenge', async () => {
    (getReceivedInvites as jest.Mock).mockResolvedValue([
      invite({ status: 'accepted' }),
      invite({ id: 'inv-2', challenge: { id: 'ch-9', name: 'Other' } }),
    ]);
    const screen = await renderInfo();

    await waitFor(() => expect(getReceivedInvites).toHaveBeenCalled());
    expect(screen.queryByTestId('challenge-invite-bar')).toBeNull();
    expect(screen.getByText('challengeInfo.joinChallengeButton')).toBeTruthy();
  });

  it('shows a pending invite for this challenge even when opened some other way', async () => {
    mockParams = { id: 'ch-1' };
    (getReceivedInvites as jest.Mock).mockResolvedValue([invite()]);
    const screen = await renderInfo();

    await waitFor(() => expect(screen.getByTestId('challenge-invite-bar')).toBeTruthy());
  });

  it('is not shown to someone already in the challenge', async () => {
    (getReceivedInvites as jest.Mock).mockResolvedValue([invite()]);
    const screen = await renderInfo({ enrolled: [{ id: 'ch-1', status: 'active' }] });

    await waitFor(() => expect(getReceivedInvites).toHaveBeenCalled());
    expect(screen.queryByTestId('challenge-invite-bar')).toBeNull();
  });
});
