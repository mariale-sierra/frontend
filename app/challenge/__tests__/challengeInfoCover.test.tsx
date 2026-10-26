import { waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import ChallengeDetail from '../[id]/index';
import { getChallenge, getMyChallengeJoinRequest } from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { useIsAdmin } from '../../../hooks/useIsAdmin';

// Sprint 10: the challenge photo on its info screen — the approved photo, or
// the gray placeholder while it is in review/rejected, with a line for its creator.
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
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ userId: 'owner-1' }) }));
jest.mock('../../../hooks/useIsAdmin', () => ({ useIsAdmin: jest.fn() }));
jest.mock('../../../services/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
jest.mock('../../../services/challenge/challenge.service', () => ({
  ...jest.requireActual('../../../services/challenge/challenge.service'),
  getChallenge: jest.fn(),
  getMyChallengeJoinRequest: jest.fn(),
}));
jest.mock('../../../services/user/user.service', () => ({ getMyChallenges: jest.fn() }));
jest.mock('../../../components/challenge/challengeAccentBackdrop', () => ({ ChallengeAccentBackdrop: () => null }));
jest.mock('../../../utils/seenChallengeMemberships', () => ({ markChallengeMembershipSeen: jest.fn() }));
jest.mock('../../../utils/challengeJoinCallout', () => ({
  hasSeenChallengeJoinCallout: jest.fn().mockResolvedValue(true),
  markChallengeJoinCalloutSeen: jest.fn(),
}));

const PHOTO = 'https://cdn.test/photo.jpeg';

async function renderInfo(overrides: Record<string, unknown>) {
  (getChallenge as jest.Mock).mockResolvedValue({
    id: 'ch-1',
    name: 'Morning Run',
    duration_days: 30,
    created_by_user_id: 'someone-else',
    ...overrides,
  });
  (getMyChallenges as jest.Mock).mockResolvedValue([]);
  (getMyChallengeJoinRequest as jest.Mock).mockResolvedValue({ hasPendingRequest: false });
  (useIsAdmin as jest.Mock).mockReturnValue(false);
  const screen = await renderWithTheme(<ChallengeDetail />);
  await waitFor(() => expect(screen.getByText('Morning Run')).toBeTruthy());
  return screen;
}

describe('Challenge info — the challenge photo (Sprint 10)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an approved photo', async () => {
    const screen = await renderInfo({ imageUrl: PHOTO, imageStatus: 'approved' });

    expect(screen.getByTestId('challenge-info-cover-image').props.source).toEqual({ uri: PHOTO });
    expect(screen.queryByTestId('challenge-info-cover-notice')).toBeNull();
  });

  it('keeps the header with the placeholder for a challenge without a photo (or from before photos existed)', async () => {
    const screen = await renderInfo({ imageStatus: 'none', imageUrl: null });

    expect(screen.getByTestId('challenge-info-cover-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('challenge-info-cover-notice')).toBeNull();
  });

  it('draws the top bar on the photo, with the dark shadow so it reads on a light photo', async () => {
    const screen = await renderInfo({ imageUrl: PHOTO, imageStatus: 'approved' });

    expect(screen.getByLabelText('challengeInfo.shareA11y')).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain('"textShadowColor":"#050604"');
  });

  it.each(['pending', 'rejected'])('shows the placeholder to everyone while the photo is %s', async (status) => {
    const screen = await renderInfo({ imageStatus: status, imageUrl: null });

    expect(screen.getByTestId('challenge-info-cover-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('challenge-info-cover-notice')).toBeNull();
  });

  it.each([
    ['pending', 'challengeInfo.coverPending'],
    ['rejected', 'challengeInfo.coverRejected'],
  ])('tells its creator why the photo is not showing (%s)', async (status, notice) => {
    const screen = await renderInfo({ imageStatus: status, imageUrl: null, created_by_user_id: 'owner-1' });

    expect(screen.getByTestId('challenge-info-cover-placeholder')).toBeTruthy();
    expect(screen.getByText(notice)).toBeTruthy();
  });

  it('never shows a URL for a photo that is not approved, even if one came back', async () => {
    const screen = await renderInfo({ imageStatus: 'pending', imageUrl: PHOTO });

    expect(screen.queryByTestId('challenge-info-cover-image')).toBeNull();
    expect(screen.getByTestId('challenge-info-cover-placeholder')).toBeTruthy();
  });
});
