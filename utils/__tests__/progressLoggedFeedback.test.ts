import { completeChallenge, getChallengeProgress } from '../../services/challenge/challenge.service';
import { useChallengeFinishedStore } from '../../store/challengeFinishedStore';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';
import { showProgressLoggedFeedback } from '../progressLoggedFeedback';
import { hasShownCompletion, resetShownCompletionsCache } from '../shownCompletions';
import { getMyBadges } from '../../services/badges/badges.service';

jest.mock('../../services/challenge/challenge.service', () => ({
  getChallengeProgress: jest.fn(),
  completeChallenge: jest.fn(),
}));
jest.mock('../../services/badges/badges.service', () => ({ getMyBadges: jest.fn() }));
jest.mock('../storage', () => ({
  storage: { getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(undefined), removeItem: jest.fn() },
}));

const getProgress = getChallengeProgress as jest.Mock;
const complete = completeChallenge as jest.Mock;
const badges = getMyBadges as jest.Mock;

const lastDayLogged = { challenge: { id: 'c1', name: 'Iron Will' }, currentDay: 75, totalDays: 75, completedToday: true };

describe('showProgressLoggedFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetShownCompletionsCache();
    useChallengeFinishedStore.setState({ visible: false, challenge: null });
    useUploadSuccessStore.setState({ visible: false });
    complete.mockResolvedValue({});
    badges.mockResolvedValue([]);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the usual "logged!" popup on an ordinary day, and does not complete anything', async () => {
    getProgress.mockResolvedValue({ ...lastDayLogged, currentDay: 30 });

    await showProgressLoggedFeedback('c1');

    expect(useUploadSuccessStore.getState().visible).toBe(true);
    expect(useChallengeFinishedStore.getState().visible).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });

  it('marks the challenge completed and shows "Challenge complete" — instead of "logged!" — when the last day is logged', async () => {
    getProgress.mockResolvedValue(lastDayLogged);

    await showProgressLoggedFeedback('c1');

    expect(complete).toHaveBeenCalledWith('c1');
    expect(useChallengeFinishedStore.getState()).toMatchObject({
      visible: true,
      challenge: { challengeId: 'c1', challengeName: 'Iron Will', totalDays: 75 },
    });
    expect(useUploadSuccessStore.getState().visible).toBe(false);
  });

  it('records the celebration as shown, so the Challenges tab does not show it a second time', async () => {
    getProgress.mockResolvedValue(lastDayLogged);

    await showProgressLoggedFeedback('c1');

    expect(await hasShownCompletion('c1')).toBe(true);
  });

  it.each([
    ['the progress cannot be read', () => getProgress.mockRejectedValue(new Error('offline'))],
    ['there is no progress at all', () => getProgress.mockResolvedValue(null)],
    ['completing fails', () => {
      getProgress.mockResolvedValue(lastDayLogged);
      complete.mockRejectedValue(new Error('500'));
    }],
  ])('falls back to the usual popup, never an error, when %s (the day is saved already)', async (_name, arrange) => {
    arrange();

    await expect(showProgressLoggedFeedback('c1')).resolves.toBeUndefined();

    expect(useUploadSuccessStore.getState().visible).toBe(true);
    expect(useChallengeFinishedStore.getState().visible).toBe(false);
  });

  describe('Sprint 10, B2', () => {
    const pending = { status: 'pending', isPrivate: false } as const;

    it('passes the photo state to the "logged!" popup', async () => {
      getProgress.mockResolvedValue({ ...lastDayLogged, currentDay: 30 });

      await showProgressLoggedFeedback('c1', { photo: pending });

      expect(useUploadSuccessStore.getState().data).toMatchObject({ photo: pending, currentDay: 30 });
    });

    it('a rest day (no photo) carries no photo state', async () => {
      getProgress.mockResolvedValue({ ...lastDayLogged, currentDay: 30 });

      await showProgressLoggedFeedback('c1');

      expect(useUploadSuccessStore.getState().data?.photo).toBeNull();
    });

    it('adds the real badge outcome and the photo state to "Challenge complete"', async () => {
      getProgress.mockResolvedValue(lastDayLogged);
      badges.mockResolvedValue([
        { code: 'one_challenge_completed', name: '', description: '', earned: true, progress: 1, target: 1 },
        { code: 'three_challenges_completed', name: '', description: '', earned: false, progress: 1, target: 3 },
      ]);

      await showProgressLoggedFeedback('c1', { photo: pending });

      expect(useChallengeFinishedStore.getState().challenge).toMatchObject({
        photo: pending,
        reward: { kind: 'earned', badgeCode: 'one_challenge_completed' },
      });
    });

    it('still shows "Challenge complete", promising no badge, when the badges cannot be read', async () => {
      getProgress.mockResolvedValue(lastDayLogged);
      badges.mockRejectedValue(new Error('offline'));

      await showProgressLoggedFeedback('c1');

      expect(useChallengeFinishedStore.getState()).toMatchObject({ visible: true, challenge: { reward: null } });
    });
  });
});
