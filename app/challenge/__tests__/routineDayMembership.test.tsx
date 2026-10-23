import { fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import RoutineDayDetail from '../[id]/routine/[day]';
import { getChallenge, getMyChallengeJoinRequest, joinChallenge } from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-router', () => {
  const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({ id: 'ch-1', day: '1' }),
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
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'me' }) }));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  joinChallenge: jest.fn(),
  getMyChallengeJoinRequest: jest.fn(),
}));
jest.mock('../../../services/user/user.service', () => ({ getMyChallenges: jest.fn() }));
jest.mock('../../../services/exercises/exercises.service', () => ({
  getLocationAvailability: jest.fn().mockResolvedValue([]),
  getExerciseAlternatives: jest.fn(),
}));
jest.mock('../../../components/challenge/challengeAccentBackdrop', () => ({ ChallengeAccentBackdrop: () => null }));

const challenge = (overrides: Record<string, unknown> = {}) => ({
  id: 'ch-1',
  name: 'Morning Run',
  duration_days: 30,
  cycle_length_days: 1,
  created_by_user_id: 'someone-else',
  cycle_days: [
    {
      day_number: 1,
      is_rest_day: false,
      routine_id: 5,
      routine_name: 'Legs',
      exercises: [{ exercise_id: 9, name: 'Squat', sets: [{ id: 1, set_number: 1, targets: [] }], targets: [] }],
    },
  ],
  ...overrides,
});

async function renderDay(setup: { challenge?: unknown; pendingRequest?: boolean } = {}) {
  (getChallenge as jest.Mock).mockResolvedValue(setup.challenge ?? challenge());
  (getMyChallenges as jest.Mock).mockResolvedValue([]);
  (getMyChallengeJoinRequest as jest.Mock).mockResolvedValue({ hasPendingRequest: setup.pendingRequest ?? false });
  const screen = await renderWithTheme(<RoutineDayDetail />);
  await waitFor(() => expect(getMyChallenges).toHaveBeenCalled());
  return screen;
}

// The routine-day screen has its own Join button (reachable from Explore without
// passing through Challenge info) — it must follow the same membership rules.
describe('Routine day — joining from this screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useErrorNotificationStore.setState({ visible: false, config: { message: '' } });
  });

  it('a private challenge only files a request: "request sent", no "joined" toast, no redirect', async () => {
    (joinChallenge as jest.Mock).mockResolvedValue({ status: 'requested', message: 'Join request sent' });
    const screen = await renderDay({ challenge: challenge({ visibility: 'private' }) });

    // Sprint 10, B2: the button and its confirmation say it is a request, not a join.
    await fireEvent.press(await screen.findByLabelText('challengeInfo.requestJoinButton'));
    expect(screen.getByText('challenges.requestJoinConfirm.title')).toBeTruthy();
    await fireEvent.press(screen.getByText('challenges.requestJoinConfirm.confirm'));

    await waitFor(() => expect(joinChallenge).toHaveBeenCalledWith('ch-1'));
    await waitFor(() => expect(screen.getByText('challenges.requestPendingLabel')).toBeTruthy());
    expect(screen.queryByLabelText('challengeInfo.requestJoinButton')).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
    expect(useErrorNotificationStore.getState()).toMatchObject({
      config: { message: 'challenges.joinConfirm.requestSent:Morning Run' },
    });
  });

  it('shows "request sent" again when reopened with the request still pending', async () => {
    const screen = await renderDay({ challenge: challenge({ visibility: 'private' }), pendingRequest: true });

    await waitFor(() => expect(screen.getByText('challenges.requestPendingLabel')).toBeTruthy());
    expect(screen.queryByLabelText('challengeInfo.requestJoinButton')).toBeNull();
  });

  it('offers nothing to join on a closed challenge', async () => {
    const screen = await renderDay({ challenge: challenge({ status: 'closed' }) });

    await waitFor(() => expect(screen.getByText('Squat')).toBeTruthy());
    expect(screen.queryByLabelText('challenges.joinButtonA11y')).toBeNull();
    expect(screen.queryByText('challenges.requestPendingLabel')).toBeNull();
  });

  it('still joins a public challenge directly and goes to Mine', async () => {
    (joinChallenge as jest.Mock).mockResolvedValue({ status: 'joined', message: 'Joined successfully' });
    const screen = await renderDay();

    await fireEvent.press(await screen.findByLabelText('challenges.joinButtonA11y'));
    await fireEvent.press(screen.getByText('challenges.joinConfirm.confirm'));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)/challenges?view=mine'));
    expect(getMyChallengeJoinRequest).not.toHaveBeenCalled();
  });
});
