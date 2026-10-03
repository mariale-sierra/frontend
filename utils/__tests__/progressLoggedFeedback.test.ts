import { completeChallenge, getChallengeProgress } from '../../services/challenge/challenge.service';
import { useChallengeFinishedStore } from '../../store/challengeFinishedStore';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';
import { showProgressLoggedFeedback } from '../progressLoggedFeedback';
import { hasShownCompletion, resetShownCompletionsCache } from '../shownCompletions';

jest.mock('../../services/challenge/challenge.service', () => ({
  getChallengeProgress: jest.fn(),
  completeChallenge: jest.fn(),
}));
jest.mock('../storage', () => ({
  storage: { getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(undefined), removeItem: jest.fn() },
}));

const getProgress = getChallengeProgress as jest.Mock;
const complete = completeChallenge as jest.Mock;

const lastDayLogged = { challenge: { id: 'c1', name: 'Iron Will' }, currentDay: 75, totalDays: 75, completedToday: true };

describe('showProgressLoggedFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetShownCompletionsCache();
    useChallengeFinishedStore.setState({ visible: false, challenge: null });
    useUploadSuccessStore.setState({ visible: false });
    complete.mockResolvedValue({});
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
});
