import { storage } from '../storage';
import { hasShownCompletion, markCompletionShown, resetShownCompletionsCache } from '../shownCompletions';

jest.mock('../storage', () => ({
  storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const getItem = storage.getItem as jest.Mock;
const setItem = storage.setItem as jest.Mock;

describe('shown challenge completions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetShownCompletionsCache();
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);
  });

  it('starts with nothing shown', async () => {
    expect(await hasShownCompletion('a')).toBe(false);
  });

  it('remembers a completion that was marked shown, and keeps it in storage', async () => {
    await markCompletionShown('a');

    expect(await hasShownCompletion('a')).toBe(true);
    expect(await hasShownCompletion('b')).toBe(false);
    expect(setItem).toHaveBeenCalledWith('shown_challenge_completions', JSON.stringify(['a']));
  });

  it('keeps adding to what is already stored, across launches', async () => {
    getItem.mockResolvedValue(JSON.stringify(['old']));

    await markCompletionShown('new');

    expect(await hasShownCompletion('old')).toBe(true);
    expect(setItem).toHaveBeenCalledWith('shown_challenge_completions', JSON.stringify(['old', 'new']));
  });

  it('reads storage only once, however often it is asked', async () => {
    await hasShownCompletion('a');
    await hasShownCompletion('b');
    await markCompletionShown('c');

    expect(getItem).toHaveBeenCalledTimes(1);
  });

  it('treats a corrupt stored value as nothing shown, not a crash', async () => {
    getItem.mockResolvedValue('not json{');

    expect(await hasShownCompletion('a')).toBe(false);
  });

  it('treats storage failing to read as nothing shown, and to write as harmless', async () => {
    getItem.mockRejectedValue(new Error('disk'));
    setItem.mockRejectedValue(new Error('disk'));

    await expect(markCompletionShown('a')).resolves.toBeUndefined();
    expect(await hasShownCompletion('a')).toBe(true);
  });
});
