import { adaptChallengesForMetrics, activityTypeFromMetricCodes, adaptTodayRoutineExercises, getLogChallengeQuickPicks } from '../metricsAdapter';
import type { ChallengeContract, TodayRoutineContract } from '../../../types/challenge';
import type { ChallengeOption } from '../../../types/metrics';

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

describe('activityTypeFromMetricCodes', () => {
  // Each case names the real backend metric profile (exercise-metric-profiles.ts) that
  // produces this exact set of target codes, so a regression here points straight at
  // which kind of exercise broke.
  it.each([
    { profile: 'weighted_reps (e.g. Squat)', codes: ['reps', 'weight'], expected: 'strength' },
    { profile: 'bodyweight_reps (e.g. Push-up)', codes: ['reps'], expected: 'strength' },
    { profile: 'duration (e.g. Plank, Jump Rope)', codes: ['time'], expected: 'flexibility' },
    {
      // The regression this fix is for: previously 'weight' was checked
      // alongside 'reps', so a farmer's walk (time + weight, no reps) landed
      // on 'strength' (reps+lbs columns) — no column existed to log its
      // duration at all.
      profile: "loaded_duration (e.g. Farmer's Walk, Sled Row)",
      codes: ['time', 'weight'],
      expected: 'flexibility',
    },
    { profile: 'distance_duration (e.g. Running)', codes: ['time', 'distance'], expected: 'cardioIntense' },
    { profile: 'no codes at all (defensive default)', codes: [], expected: 'strength' },
  ])('$profile -> $expected', ({ codes, expected }) => {
    expect(activityTypeFromMetricCodes(codes)).toBe(expected);
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

describe('adaptTodayRoutineExercises', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const challenge: ChallengeOption = {
    id: '7',
    label: 'Mind-Body Reset',
    activityCategories: [],
    locations: [],
    dominantActivityCategory: 'mindBody',
  };

  // Real, confirmed bug 2026-09-22, reported directly: a duration-only exercise
  // (Camel Pose) correctly showed just a duration field while being added to the
  // routine (that screen reads the exercise's own real metrics), but the Log
  // Metrics screen showed duration + distance for the same exercise — because
  // this adapter derived its columns from the routine's SAVED targets instead
  // of the exercise's own reviewed metrics, and those two can drift apart.
  it("prefers the exercise's own reviewed metrics over the routine's saved target codes", () => {
    const contract: TodayRoutineContract = {
      routine_id: 1,
      exercises: [
        {
          id: 101,
          exercise: {
            id: 55,
            name: 'Camel Pose',
            // The exercise's real profile: duration only (time).
            exercise_metrics: [{ metricType: { code: 'time' } }],
          },
          sets: [],
          // Stale/incomplete saved targets carrying a 'distance' target this
          // exercise never actually tracks.
          targets: [
            { metricType: { code: 'time' }, target_value_seconds: 60 },
            { metricType: { code: 'distance' }, target_value_decimal: 2 },
          ],
        },
      ],
    };

    const [block] = adaptTodayRoutineExercises(contract, challenge);

    expect(block.activityType).toBe('flexibility');
    expect(block.rows[0]).toMatchObject({ duration: '60' });
    expect(block.rows[0]).not.toHaveProperty('distance');
  });

  it('falls back to the saved target codes when the exercise has no reviewed metrics of its own (older manual exercise)', () => {
    const contract: TodayRoutineContract = {
      routine_id: 1,
      exercises: [
        {
          id: 102,
          exercise: { id: 56, name: 'Legacy Cardio Drill', exercise_metrics: [] },
          sets: [],
          targets: [
            { metricType: { code: 'time' }, target_value_seconds: 600 },
            { metricType: { code: 'distance' }, target_value_decimal: 3 },
          ],
        },
      ],
    };

    const [block] = adaptTodayRoutineExercises(contract, challenge);

    expect(block.activityType).toBe('cardioIntense');
    expect(block.rows[0]).toMatchObject({ duration: '600', distance: '3' });
  });
});
