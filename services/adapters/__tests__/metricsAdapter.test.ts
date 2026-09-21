import { adaptChallengesForMetrics, getLogChallengeQuickPicks } from '../metricsAdapter';
import type { ChallengeContract } from '../../../types/challenge';

const contract = (overrides: Record<string, unknown> = {}): ChallengeContract =>
  ({
    id: 7,
    name: 'Morning Strength',
    status: 'active',
    current_day: 4,
    duration_days: 30,
    today_is_rest_day: false,
    today_completed: false,
    dominant_activity_category: 'strength',
    ...overrides,
  }) as unknown as ChallengeContract;

describe('getLogChallengeQuickPicks', () => {
  it('turns an active challenge into a card: its name, its latest photo and its color', () => {
    const photos = new Map([['7', { imageUrl: 'https://example.com/latest.jpg', day: 3 }]]) as never;

    expect(getLogChallengeQuickPicks([contract()], photos)).toEqual([
      {
        id: '7',
        name: 'Morning Strength',
        photoUrl: 'https://example.com/latest.jpg',
        dominantActivityCategory: 'strength',
      },
    ]);
  });

  it('has no photo when the user has not posted one for the challenge', () => {
    const [pick] = getLogChallengeQuickPicks([contract()], new Map());

    expect(pick.photoUrl).toBeNull();
  });

  it('has no color yet for a challenge with no dominant activity', () => {
    const [pick] = getLogChallengeQuickPicks([contract({ dominant_activity_category: null })], new Map());

    expect(pick.dominantActivityCategory).toBeNull();
  });

  it('leaves out what there is nothing to log for: a rest day, a day already done, a finished challenge', () => {
    const picks = getLogChallengeQuickPicks(
      [
        contract({ id: 1 }),
        contract({ id: 2, today_is_rest_day: true }),
        contract({ id: 3, today_completed: true }),
        contract({ id: 4, status: 'completed' }),
      ],
      new Map(),
    );

    expect(picks.map((pick) => pick.id)).toEqual(['1']);
  });

  it('leaves out a challenge whose day is already logged with a photo, even when the server has not flagged it', () => {
    const photos = new Map([['7', { imageUrl: 'https://example.com/today.jpg', day: 4 }]]) as never;

    expect(getLogChallengeQuickPicks([contract({ current_day: 4, today_completed: false })], photos)).toEqual([]);
    // A photo from an earlier day does not count.
    expect(getLogChallengeQuickPicks([contract({ current_day: 5 })], photos)).toHaveLength(1);
  });

  it('leaves out a finished challenge and an abandoned one, whichever way they are marked', () => {
    const picks = getLogChallengeQuickPicks(
      [
        contract({ id: 1, status: 'completed' }),
        contract({ id: 2, status: 'finished' }),
        contract({ id: 3, status: 'left' }),
        contract({ id: 4, status: 'abandoned' }),
        contract({ id: 5, status: 'active' }),
      ],
      new Map(),
    );

    expect(picks.map((pick) => pick.id)).toEqual(['5']);
  });

  it('leaves out a challenge whose days have run out, but keeps one on its very last day', () => {
    const picks = getLogChallengeQuickPicks(
      [
        contract({ id: 1, current_day: 31, duration_days: 30 }),
        contract({ id: 2, current_day: 30, duration_days: 30 }),
      ],
      new Map(),
    );

    expect(picks.map((pick) => pick.id)).toEqual(['2']);
  });

  it('agrees with the state Home and Mine give a challenge: it is listed exactly when that state is `active`', () => {
    const cases = [
      { overrides: {}, listed: true },
      { overrides: { today_is_rest_day: true }, listed: false },
      { overrides: { today_completed: true }, listed: false },
      { overrides: { status: 'completed' }, listed: false },
      { overrides: { status: 'left' }, listed: false },
    ];

    for (const { overrides, listed } of cases) {
      expect(getLogChallengeQuickPicks([contract(overrides)], new Map())).toHaveLength(listed ? 1 : 0);
    }
  });
});

describe('adaptChallengesForMetrics', () => {
  beforeEach(() => {
    // The adapter logs its input and output.
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("carries each challenge's own dominant activity, which is what the Log Metrics screen takes its color from", () => {
    const [strength, cardio] = adaptChallengesForMetrics([
      contract({ id: 1, dominant_activity_category: 'strength' }),
      contract({ id: 2, dominant_activity_category: 'cardioLow' }),
    ]);

    expect(strength.dominantActivityCategory).toBe('strength');
    expect(cardio.dominantActivityCategory).toBe('cardioLow');
  });

  it('has none for a challenge with no dominant activity yet', () => {
    const [option] = adaptChallengesForMetrics([contract({ dominant_activity_category: null })]);

    expect(option.dominantActivityCategory).toBeNull();
  });

  it('keeps what it already had: the id, the name, the categories and the locations', () => {
    const [option] = adaptChallengesForMetrics([contract({ id: 9, name: 'Night Run' })]);

    expect(option).toMatchObject({ id: '9', label: 'Night Run', activityCategories: [], locations: [] });
  });
});
