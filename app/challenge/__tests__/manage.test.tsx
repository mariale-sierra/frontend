import { StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import ManageChallengeScreen from '../[id]/manage';
import {
  approveChallengeJoinRequest,
  getChallenge,
  getChallengeJoinRequests,
  getChallengeUsers,
  rejectChallengeJoinRequest,
  removeChallengeParticipant,
} from '../../../services/challenge/challenge.service';
import { activityColors, colors } from '../../../constants/theme';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({ id: 'ch-1' }),
    // Runs the focus effect when the screen mounts, as focusing it would.
    useFocusEffect: (callback: () => void | (() => void)) => require('react').useEffect(callback, [callback]),
    useIsFocused: () => true,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  // The real services import the app's i18n setup, which registers with this.
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({
    t: (key: string, values?: { username?: string }) => (values?.username ? `${key}:${values.username}` : key),
  }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'owner-1' }) }));
// The service module is only kept for its pure `isChallengeOwner`; its client (and the storage
// under it) is not needed.
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  getChallengeUsers: jest.fn(),
  getChallengeJoinRequests: jest.fn(),
  approveChallengeJoinRequest: jest.fn(),
  rejectChallengeJoinRequest: jest.fn(),
  removeChallengeParticipant: jest.fn(),
}));
// What the backdrop is told is what matters here; the light itself is tested on its own.
jest.mock('../../../components/challenge/challengeAccentBackdrop', () => ({
  ChallengeAccentBackdrop: ({ color }: { color: string }) => {
    const { Text } = require('react-native');
    return <Text testID="accent-backdrop">{color}</Text>;
  },
}));

const challenge = (overrides: Record<string, unknown> = {}) => ({
  id: 'ch-1',
  name: 'Morning Run',
  created_by_user_id: 'owner-1',
  visibility: 'public',
  categories: [],
  ...overrides,
});

const person = (id: string, role = 'member') => ({ id, username: `user-${id}`, role, status: 'active' });

const request = (id: string, username: string) => ({
  id,
  status: 'pending',
  user: { id: `u-${id}`, username, displayName: null, profileImageUrl: null },
  requestedAt: '2026-09-21T10:00:00.000Z',
  respondedAt: null,
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

async function renderManage(setup: { challenge?: unknown; users?: unknown[]; requests?: unknown[] } = {}) {
  (getChallenge as jest.Mock).mockResolvedValue(setup.challenge ?? challenge());
  (getChallengeUsers as jest.Mock).mockResolvedValue(setup.users ?? []);
  (getChallengeJoinRequests as jest.Mock).mockResolvedValue(setup.requests ?? []);
  return renderWithTheme(<ManageChallengeScreen />);
}

describe('Manage challenge', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('while it loads', () => {
    it('is skeleton rows, not a spinner', async () => {
      (getChallenge as jest.Mock).mockReturnValue(new Promise(() => undefined));
      (getChallengeUsers as jest.Mock).mockReturnValue(new Promise(() => undefined));
      const screen = await renderWithTheme(<ManageChallengeScreen />);

      expect(screen.getByText('challengeProgress.manageScreenTitle')).toBeTruthy();
      expect(stringify(screen.toJSON())).not.toContain('ActivityIndicator');
      expect(screen.queryByTestId('accent-backdrop')).toBeNull();
    });
  });

  describe('its look', () => {
    it("is in the challenge's own colors: its name under the title and its backdrop", async () => {
      const screen = await renderManage({ challenge: challenge({ dominant_activity_category: 'mindBody' }) });

      await waitFor(() => expect(screen.getByText('Morning Run')).toBeTruthy());
      expect(flat(screen.getByText('Morning Run'))).toMatchObject({ color: activityColors.mindBody, opacity: 1 });
      expect(screen.getByTestId('accent-backdrop')).toHaveTextContent(activityColors.mindBody);
    });

    it('has the neutral color for a challenge with no activity yet', async () => {
      const screen = await renderManage();

      await waitFor(() => expect(screen.getByTestId('accent-backdrop')).toHaveTextContent(colors.primary));
    });
  });

  describe('a public challenge: removing a participant', () => {
    const users = [person('owner-1', 'owner'), person('ana'), person('bruno')];

    it('lists its participants under a Members label, but not its owner', async () => {
      const screen = await renderManage({ users });

      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());
      expect(screen.getByText('@user-bruno')).toBeTruthy();
      expect(screen.queryByText('@user-owner-1')).toBeNull();
      expect(screen.getByText('challengeProgress.manageMembersRow')).toBeTruthy();
    });

    it('does not ask for join requests: a public challenge has none, and asking would raise an error toast', async () => {
      const screen = await renderManage({ users });
      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());

      expect(getChallengeJoinRequests).not.toHaveBeenCalled();
    });

    it('has no way to admit anyone: no join-requests list', async () => {
      const screen = await renderManage({ users });
      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());

      expect(screen.queryByText('challengeProgress.joinRequestsTitle')).toBeNull();
      expect(screen.queryByLabelText('challengeProgress.joinRequestApproveA11y')).toBeNull();
    });

    it('asks first, naming who, in a popup with an icon', async () => {
      const screen = await renderManage({ users });
      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());

      await fireEvent.press(screen.getAllByLabelText('challengeProgress.removeParticipantA11y')[0]);

      expect(screen.getByText('challengeProgress.removeParticipantTitle:user-ana')).toBeTruthy();
      expect(stringify(screen.toJSON())).toContain('person-remove-outline');
      expect(removeChallengeParticipant).not.toHaveBeenCalled();
    });

    it('removes them once confirmed, and their row goes', async () => {
      (removeChallengeParticipant as jest.Mock).mockResolvedValue(undefined);
      const screen = await renderManage({ users });
      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());

      await fireEvent.press(screen.getAllByLabelText('challengeProgress.removeParticipantA11y')[0]);
      await fireEvent.press(screen.getByText('challengeProgress.removeParticipantConfirm'));

      await waitFor(() => expect(screen.queryByText('@user-ana')).toBeNull());
      expect(removeChallengeParticipant).toHaveBeenCalledWith('ch-1', 'ana');
      expect(screen.getByText('@user-bruno')).toBeTruthy();
    });

    it('keeps them when it is cancelled', async () => {
      const screen = await renderManage({ users });
      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());

      await fireEvent.press(screen.getAllByLabelText('challengeProgress.removeParticipantA11y')[0]);
      await fireEvent.press(screen.getByText('challengeProgress.removeParticipantCancel'));

      expect(removeChallengeParticipant).not.toHaveBeenCalled();
      expect(screen.getByText('@user-ana')).toBeTruthy();
    });

    it('keeps them when removing fails, and can be tried again', async () => {
      (removeChallengeParticipant as jest.Mock).mockRejectedValue(new Error('server'));
      const screen = await renderManage({ users });
      await waitFor(() => expect(screen.getByText('@user-ana')).toBeTruthy());

      await fireEvent.press(screen.getAllByLabelText('challengeProgress.removeParticipantA11y')[0]);
      await fireEvent.press(screen.getByText('challengeProgress.removeParticipantConfirm'));

      await waitFor(() => expect(removeChallengeParticipant).toHaveBeenCalled());
      expect(screen.getByText('@user-ana')).toBeTruthy();
    });

    it('says so, with an icon, when there is no one to remove', async () => {
      const screen = await renderManage({ users: [person('owner-1', 'owner')] });

      await waitFor(() => expect(screen.getByText('challengeProgress.membersEmpty')).toBeTruthy());
      expect(stringify(screen.toJSON())).toContain('people-outline');
    });
  });

  // Per explicit feedback: two screens for one job (Manage, then a tap
  // through to a separate Join-requests screen) was redundant — the
  // requests now render directly here, no extra tap needed. Same row
  // (JoinRequestListItem) and approve/reject behavior the old standalone
  // app/challenge/[id]/join-requests.tsx used to test on its own.
  describe('a private challenge: admitting people, inline', () => {
    const asPrivate = { challenge: challenge({ visibility: 'private' }) };

    it('lists each pending request under a Join requests label, with approve/reject buttons', async () => {
      const screen = await renderManage({ ...asPrivate, requests: [request('r1', 'ana'), request('r2', 'bruno')] });

      await waitFor(() => expect(screen.getByText('@ana')).toBeTruthy());
      expect(screen.getByText('@bruno')).toBeTruthy();
      expect(screen.getByText('challengeProgress.joinRequestsTitle')).toBeTruthy();
      expect(screen.getAllByLabelText('challengeProgress.joinRequestApproveA11y')).toHaveLength(2);
      expect(screen.getAllByLabelText('challengeProgress.joinRequestRejectA11y')).toHaveLength(2);
    });

    it('has no participant list: a private challenge is admitted to, not removed from', async () => {
      const screen = await renderManage({ ...asPrivate, users: [person('ana')], requests: [request('r1', 'carla')] });
      await waitFor(() => expect(screen.getByText('@carla')).toBeTruthy());

      expect(screen.queryByText('@user-ana')).toBeNull();
      expect(screen.queryByText('challengeProgress.manageMembersRow')).toBeNull();
    });

    it('asks for the requests, since the owner of a private challenge can have them', async () => {
      await renderManage(asPrivate);

      await waitFor(() => expect(getChallengeJoinRequests).toHaveBeenCalledWith('ch-1'));
    });

    it('approves, and reads the list again — right here, no navigation', async () => {
      (approveChallengeJoinRequest as jest.Mock).mockResolvedValue({});
      const screen = await renderManage({ ...asPrivate, requests: [request('r1', 'ana'), request('r2', 'bruno')] });
      await waitFor(() => expect(screen.getByText('@ana')).toBeTruthy());
      (getChallengeJoinRequests as jest.Mock).mockResolvedValue([request('r2', 'bruno')]);

      await fireEvent.press(screen.getAllByLabelText('challengeProgress.joinRequestApproveA11y')[0]);

      await waitFor(() => expect(screen.queryByText('@ana')).toBeNull());
      expect(approveChallengeJoinRequest).toHaveBeenCalledWith('ch-1', 'r1');
      expect(screen.getByText('@bruno')).toBeTruthy();
      expect(router.push).not.toHaveBeenCalled();
    });

    it('rejects, and reads the list again', async () => {
      (rejectChallengeJoinRequest as jest.Mock).mockResolvedValue({});
      const screen = await renderManage({ ...asPrivate, requests: [request('r1', 'ana'), request('r2', 'bruno')] });
      await waitFor(() => expect(screen.getByText('@ana')).toBeTruthy());
      (getChallengeJoinRequests as jest.Mock).mockResolvedValue([request('r1', 'ana')]);

      await fireEvent.press(screen.getAllByLabelText('challengeProgress.joinRequestRejectA11y')[1]);

      await waitFor(() => expect(screen.queryByText('@bruno')).toBeNull());
      expect(rejectChallengeJoinRequest).toHaveBeenCalledWith('ch-1', 'r2');
      expect(approveChallengeJoinRequest).not.toHaveBeenCalled();
    });

    it('says so, with an icon, when there is nothing to answer', async () => {
      const screen = await renderManage(asPrivate);

      await waitFor(() => expect(screen.getByText('challengeProgress.joinRequestsEmpty')).toBeTruthy());
      expect(stringify(screen.toJSON())).toContain('person-add-outline');
    });

    it('says so, with an icon, when the requests could not be loaded', async () => {
      (getChallenge as jest.Mock).mockResolvedValue(asPrivate.challenge);
      (getChallengeJoinRequests as jest.Mock).mockRejectedValue(new Error('offline'));
      const screen = await renderWithTheme(<ManageChallengeScreen />);

      await waitFor(() => expect(screen.getByText('challengeProgress.joinRequestsLoadError')).toBeTruthy());
      expect(stringify(screen.toJSON())).toContain('cloud-offline-outline');
    });
  });

  describe("someone else's challenge", () => {
    it('goes back: a link to it has nothing to manage', async () => {
      await renderManage({ challenge: challenge({ created_by_user_id: 'someone-else' }) });

      await waitFor(() => expect(router.back).toHaveBeenCalled());
    });

    it('asks for no join requests either', async () => {
      await renderManage({ challenge: challenge({ created_by_user_id: 'someone-else', visibility: 'private' }) });
      await waitFor(() => expect(router.back).toHaveBeenCalled());

      expect(getChallengeJoinRequests).not.toHaveBeenCalled();
    });
  });
});
