import { act } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { UploadSuccessPopup } from '../UploadSuccessPopup';
import { ChallengeFinishedPopup } from '../ChallengeFinishedPopup';
import { useUploadSuccessStore } from '../../../store/uploadSuccessStore';
import { useChallengeFinishedStore } from '../../../store/challengeFinishedStore';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => undefined },
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values && Object.keys(values).length > 0 ? `${key}(${Object.values(values).join(',')})` : key,
  }),
}));
jest.mock('../../challenge/progress/ConfettiBurst', () => ({ ConfettiBurst: () => null }));

// Sprint 10, B2: "logged" and "photo state" are separate lines, and the photo
// line only appears when the server said something about it.
describe('UploadSuccessPopup', () => {
  beforeEach(() => useUploadSuccessStore.setState({ visible: false, data: null }));

  it('says the day is logged and, on its own line, that the photo is in review', async () => {
    const screen = await renderWithTheme(<UploadSuccessPopup />);
    await act(async () => {
      useUploadSuccessStore.getState().show({
        challengeName: 'Iron Will',
        currentDay: 3,
        totalDays: 30,
        photo: { status: 'pending', isPrivate: false },
      });
    });

    expect(
      screen.getByText('camera.uploadSuccessMessageWithChallenge(Iron Will,3,30)\n\ncamera.photoStatus.pending'),
    ).toBeTruthy();
  });

  it('has no photo line for a rest day', async () => {
    const screen = await renderWithTheme(<UploadSuccessPopup />);
    await act(async () => {
      useUploadSuccessStore.getState().show({ challengeName: 'Iron Will', currentDay: 3, totalDays: 30, photo: null });
    });

    expect(screen.getByText('camera.uploadSuccessMessageWithChallenge(Iron Will,3,30)')).toBeTruthy();
  });
});

describe('ChallengeFinishedPopup', () => {
  beforeEach(() => useChallengeFinishedStore.setState({ visible: false, challenge: null }));

  it('adds the badge it earned and the photo state', async () => {
    const screen = await renderWithTheme(<ChallengeFinishedPopup />);
    await act(async () => {
      useChallengeFinishedStore.getState().show({
        challengeId: 'c1',
        challengeName: 'Iron Will',
        totalDays: 30,
        reward: { kind: 'earned', badgeCode: 'one_challenge_completed' },
        photo: { status: 'approved', isPrivate: false },
      });
    });

    expect(
      screen.getByText(
        'challenges.completionPopup.descriptionWithDuration(Iron Will,30)\n\n' +
          'challenges.completionPopup.reward.earned(badges.items.one_challenge_completed.name(one_challenge_completed))\n\n' +
          'camera.photoStatus.approved',
      ),
    ).toBeTruthy();
  });

  it('says how many challenges are left when this one earned nothing new', async () => {
    const screen = await renderWithTheme(<ChallengeFinishedPopup />);
    await act(async () => {
      useChallengeFinishedStore.getState().show({
        challengeId: 'c1',
        challengeName: 'Iron Will',
        reward: { kind: 'next', badgeCode: 'three_challenges_completed', remaining: 1 },
      });
    });

    expect(screen.getByText(/challenges\.completionPopup\.reward\.next\(.*,1\)$/)).toBeTruthy();
  });

  it('promises nothing when the reward is unknown (e.g. the Challenges tab found the completion later)', async () => {
    const screen = await renderWithTheme(<ChallengeFinishedPopup />);
    await act(async () => {
      useChallengeFinishedStore.getState().show({ challengeId: 'c1', challengeName: 'Iron Will' });
    });

    expect(screen.getByText('challenges.completionPopup.description(Iron Will)')).toBeTruthy();
  });
});
