import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import ChallengeDetail from '../[id]/index';
import {
  closeChallenge,
  getChallenge,
  getMyChallengeJoinRequest,
  joinChallenge,
  reopenChallenge,
} from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';
import { markChallengeMembershipSeen } from '../../../utils/seenChallengeMemberships';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({ id: 'ch-1' }),
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
    t: (key: string, values?: Record<string, unknown>) => (values?.name ? `${key}:${values.name}` : key),
  }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'owner-1' }) }));
jest.mock('../../../hooks/useIsAdmin', () => ({ useIsAdmin: jest.fn() }));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  closeChallenge: jest.fn(),
  reopenChallenge: jest.fn(),
  joinChallenge: jest.fn(),
  getMyChallengeJoinRequest: jest.fn(),
}));
jest.mock('../../../services/user/user.service', () => ({ getMyChallenges: jest.fn() }));
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

async function renderInfo(
  setup: { challenge?: unknown; enrolled?: unknown[]; admin?: boolean; pendingRequest?: boolean } = {},
) {
  (getChallenge as jest.Mock).mockResolvedValue(setup.challenge ?? challenge());
  (getMyChallenges as jest.Mock).mockResolvedValue(setup.enrolled ?? []);
  (getMyChallengeJoinRequest as jest.Mock).mockResolvedValue({ hasPendingRequest: setup.pendingRequest ?? false });
  (useIsAdmin as jest.Mock).mockReturnValue(setup.admin ?? false);
  const screen = await renderWithTheme(<ChallengeDetail />);
  await waitFor(() => expect(screen.getByText('Morning Run')).toBeTruthy());
  return screen;
}

describe('Challenge info — the owner and admin actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
  });

  describe("the owner's manage button", () => {
    it('is there for the owner, and opens Manage challenge', async () => {
      const screen = await renderInfo({ challenge: challenge({ created_by_user_id: 'owner-1' }) });

      await fireEvent.press(screen.getByLabelText('challengeProgress.manageA11y'));

      expect(router.push).toHaveBeenCalledWith('/challenge/ch-1/manage');
    });

    it('is not there for anyone else', async () => {
      const screen = await renderInfo();

      expect(screen.queryByLabelText('challengeProgress.manageA11y')).toBeNull();
    });
  });

  describe("the admin's close button", () => {
    it('is there for an admin, on a challenge that is open', async () => {
      const screen = await renderInfo({ admin: true });

      expect(screen.getByLabelText('challengeProgress.closeChallengeA11y')).toBeTruthy();
    });

    it('is not there for someone who is not an admin', async () => {
      const screen = await renderInfo();

      expect(screen.queryByLabelText('challengeProgress.closeChallengeA11y')).toBeNull();
    });

    it('is not there once the challenge is closed', async () => {
      const screen = await renderInfo({ admin: true, challenge: challenge({ status: 'closed' }) });

      expect(screen.queryByLabelText('challengeProgress.closeChallengeA11y')).toBeNull();
    });

    it('asks first, and closing it says so on the screen, with a toast', async () => {
      (closeChallenge as jest.Mock).mockResolvedValue(undefined);
      const screen = await renderInfo({ admin: true });
      expect(screen.queryByText('challengeInfo.closedValue')).toBeNull();

      await fireEvent.press(screen.getByLabelText('challengeProgress.closeChallengeA11y'));
      expect(closeChallenge).not.toHaveBeenCalled();
      await fireEvent.press(screen.getByText('challengeProgress.closeChallengeConfirm'));

      await waitFor(() => expect(closeChallenge).toHaveBeenCalledWith('ch-1'));
      await waitFor(() => expect(screen.getByText('challengeInfo.closedValue')).toBeTruthy());
      // The button has done its job, and the change is confirmed.
      expect(screen.queryByLabelText('challengeProgress.closeChallengeA11y')).toBeNull();
      expect(useErrorNotificationStore.getState()).toMatchObject({
        visible: true,
        config: { message: 'challengeProgress.closeChallengeSuccess', variant: 'success' },
      });
    });

    it('leaves the challenge open when closing fails', async () => {
      (closeChallenge as jest.Mock).mockRejectedValue(new Error('server'));
      const screen = await renderInfo({ admin: true });

      await fireEvent.press(screen.getByLabelText('challengeProgress.closeChallengeA11y'));
      await fireEvent.press(screen.getByText('challengeProgress.closeChallengeConfirm'));

      await waitFor(() => expect(closeChallenge).toHaveBeenCalled());
      expect(screen.queryByText('challengeInfo.closedValue')).toBeNull();
      expect(useErrorNotificationStore.getState().visible).toBe(false);
    });
  });

  // B8: reopening is the admin's inverse of closing — never an owner action.
  describe("the admin's reopen button", () => {
    const closed = (overrides: Record<string, unknown> = {}) => challenge({ status: 'closed', ...overrides });

    it('is there for an admin, only on a closed challenge', async () => {
      const screen = await renderInfo({ admin: true, challenge: closed() });

      expect(screen.getByLabelText('challengeProgress.reopenChallengeA11y')).toBeTruthy();
    });

    it('is not there on an open challenge', async () => {
      const screen = await renderInfo({ admin: true });

      expect(screen.queryByLabelText('challengeProgress.reopenChallengeA11y')).toBeNull();
    });

    it('is not there for the owner who is not an admin', async () => {
      const screen = await renderInfo({ challenge: closed({ created_by_user_id: 'owner-1' }) });

      expect(screen.queryByLabelText('challengeProgress.reopenChallengeA11y')).toBeNull();
      expect(screen.getByLabelText('challengeProgress.manageA11y')).toBeTruthy();
    });

    it('asks first, then shows the challenge open again, with a toast and the close button back', async () => {
      (reopenChallenge as jest.Mock).mockResolvedValue(undefined);
      const screen = await renderInfo({ admin: true, challenge: closed() });

      await fireEvent.press(screen.getByLabelText('challengeProgress.reopenChallengeA11y'));
      expect(reopenChallenge).not.toHaveBeenCalled();
      await fireEvent.press(screen.getByText('challengeProgress.reopenChallengeConfirm'));

      await waitFor(() => expect(reopenChallenge).toHaveBeenCalledWith('ch-1'));
      await waitFor(() => expect(screen.queryByText('challengeInfo.closedValue')).toBeNull());
      expect(screen.queryByLabelText('challengeProgress.reopenChallengeA11y')).toBeNull();
      expect(screen.getByLabelText('challengeProgress.closeChallengeA11y')).toBeTruthy();
      expect(useErrorNotificationStore.getState()).toMatchObject({
        visible: true,
        config: { message: 'challengeProgress.reopenChallengeSuccess', variant: 'success' },
      });
    });

    it('leaves the challenge closed when reopening fails', async () => {
      (reopenChallenge as jest.Mock).mockRejectedValue(new Error('server'));
      const screen = await renderInfo({ admin: true, challenge: closed() });

      await fireEvent.press(screen.getByLabelText('challengeProgress.reopenChallengeA11y'));
      await fireEvent.press(screen.getByText('challengeProgress.reopenChallengeConfirm'));

      await waitFor(() => expect(reopenChallenge).toHaveBeenCalled());
      expect(screen.getByText('challengeInfo.closedValue')).toBeTruthy();
      expect(useErrorNotificationStore.getState().visible).toBe(false);
    });
  });

  describe('a closed challenge', () => {
    const closed = { challenge: challenge({ status: 'closed' }) };

    it('says it is closed, in the same rows as the rest of what there is to know about it', async () => {
      const screen = await renderInfo(closed);

      expect(screen.getByText('challengeInfo.statusLabel')).toBeTruthy();
      expect(screen.getByText('challengeInfo.closedValue')).toBeTruthy();
    });

    it('does not offer to join it: there is nothing to join', async () => {
      const screen = await renderInfo(closed);
      await waitFor(() => expect(getMyChallenges).toHaveBeenCalled());

      expect(screen.queryByLabelText('challenges.joinButtonA11y')).toBeNull();
    });

    it('is an open one that offers it, and says nothing about a status', async () => {
      const screen = await renderInfo();

      await waitFor(() => expect(screen.getByLabelText('challenges.joinButtonA11y')).toBeTruthy());
      expect(screen.queryByText('challengeInfo.closedValue')).toBeNull();
    });
  });

  // Real, confirmed bug this fixes: joining a private challenge used to
  // report success and drop the requester straight in, with nothing left
  // for the owner to approve. The backend now returns `{status: 'requested'}`
  // instead of joining directly — this is the frontend half of that fix.
  describe('joining a private challenge', () => {
    it('shows "request sent" and hides the join button once the request is filed', async () => {
      (joinChallenge as jest.Mock).mockResolvedValue({ status: 'requested', message: 'Join request sent' });
      const screen = await renderInfo({ challenge: challenge({ visibility: 'private' }) });

      await fireEvent.press(screen.getByLabelText('challenges.joinButtonA11y'));
      await fireEvent.press(screen.getByText('challenges.joinConfirm.confirm'));

      await waitFor(() => expect(joinChallenge).toHaveBeenCalledWith('ch-1'));
      expect(screen.queryByLabelText('challenges.joinButtonA11y')).toBeNull();
      expect(screen.getByText('challenges.requestPendingLabel')).toBeTruthy();
      // Not actually a member yet — never redirected to Mine.
      expect(router.replace).not.toHaveBeenCalled();
      expect(useErrorNotificationStore.getState()).toMatchObject({
        visible: true,
        config: { message: 'challenges.joinConfirm.requestSent:Morning Run', variant: 'success' },
      });
    });

    it('joins directly and redirects to Mine for a public challenge', async () => {
      (joinChallenge as jest.Mock).mockResolvedValue({ status: 'joined', message: 'Joined successfully' });
      const screen = await renderInfo({ challenge: challenge({ visibility: 'public' }) });

      await fireEvent.press(screen.getByLabelText('challenges.joinButtonA11y'));
      await fireEvent.press(screen.getByText('challenges.joinConfirm.confirm'));

      await waitFor(() => expect(joinChallenge).toHaveBeenCalledWith('ch-1'));
      await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/challenges?view=mine'));
      expect(screen.queryByText('challenges.requestPendingLabel')).toBeNull();
      // So the Challenges tab's own "You're in!" popup (for an approval
      // found out about asynchronously) never also fires for this same
      // membership — this device already has its own immediate feedback.
      expect(markChallengeMembershipSeen).toHaveBeenCalledWith('ch-1');
    });

    // Regression (INC-02): reopening the screen offered Join again even though
    // the request was still pending, and tapping it got a 409.
    it('shows "request sent" again when the screen is reopened with the request still pending', async () => {
      const screen = await renderInfo({ challenge: challenge({ visibility: 'private' }), pendingRequest: true });

      await waitFor(() => expect(screen.getByText('challenges.requestPendingLabel')).toBeTruthy());
      expect(getMyChallengeJoinRequest).toHaveBeenCalledWith('ch-1');
      expect(screen.queryByLabelText('challenges.joinButtonA11y')).toBeNull();
    });

    it('offers Join on a private challenge without a pending request', async () => {
      const screen = await renderInfo({ challenge: challenge({ visibility: 'private' }) });

      await waitFor(() => expect(screen.getByLabelText('challenges.joinButtonA11y')).toBeTruthy());
      expect(screen.queryByText('challenges.requestPendingLabel')).toBeNull();
    });

    it('does not mark the membership seen for a private request that is still pending — there is nothing to find out yet', async () => {
      (joinChallenge as jest.Mock).mockResolvedValue({ status: 'requested', message: 'Join request sent' });
      const screen = await renderInfo({ challenge: challenge({ visibility: 'private' }) });

      await fireEvent.press(screen.getByLabelText('challenges.joinButtonA11y'));
      await fireEvent.press(screen.getByText('challenges.joinConfirm.confirm'));

      await waitFor(() => expect(joinChallenge).toHaveBeenCalledWith('ch-1'));
      expect(markChallengeMembershipSeen).not.toHaveBeenCalled();
    });
  });
});
