import { getUpcomingDays, toChallengeDetailViewModel } from '../challengeDetailAdapter';
import type { ChallengeDaySummary } from '../challengeDetailAdapter';
import type { ChallengeContract } from '../../../types/challenge';

const LABELS = { locationFallbackLabel: 'Anywhere', categoryFallbackLabel: 'General' };

function buildChallenge(overrides: Partial<ChallengeContract> = {}): ChallengeContract {
  return {
    id: 'A',
    name: '75 Hard — Summer Edition',
    duration_days: 30,
    ...overrides,
  } as ChallengeContract;
}

describe('toChallengeDetailViewModel', () => {
  it('fails when name or duration_days is missing', () => {
    expect(toChallengeDetailViewModel(buildChallenge({ name: '' }), LABELS)).toEqual({ ok: false });
    expect(toChallengeDetailViewModel(buildChallenge({ duration_days: undefined }), LABELS)).toEqual({ ok: false });
  });

  it("The cycle list has one row per cycle day, not per whole-challenge day — a 4-day cycle in a 30-day challenge is 4 rows, not 30", () => {
    const challenge = buildChallenge({
      duration_days: 30,
      cycle_length_days: 4,
      cycle_days: [
        { day_number: 1, is_rest_day: false, routine_name: 'Glute workout', exercises: [{ name: 'Hip thrust' }] },
        { day_number: 2, is_rest_day: false, routine_name: 'Push day', exercises: [] },
        { day_number: 3, is_rest_day: true },
        { day_number: 4, is_rest_day: false, routine_name: 'Zone 2 run', exercises: [] },
      ],
    });

    const result = toChallengeDetailViewModel(challenge, LABELS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.days).toHaveLength(4);
    expect(result.value.days.map((d) => d.day)).toEqual([1, 2, 3, 4]);
  });

  // The real bug this replaces: the old adapter required title+description+
  // activities.length>0 to include a day, which silently dropped every rest
  // day (none of those fields exist on a rest day) from "The cycle" list —
  // exactly the row the wireframe explicitly shows.
  it('includes rest days in the cycle list, with routineName left empty', () => {
    const challenge = buildChallenge({
      cycle_length_days: 4,
      cycle_days: [
        { day_number: 1, is_rest_day: false, routine_name: 'Glute workout', exercises: [] },
        { day_number: 3, is_rest_day: true, routine_name: undefined, exercises: undefined },
      ],
    });

    const result = toChallengeDetailViewModel(challenge, LABELS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const restDay = result.value.days.find((d) => d.day === 3);
    expect(restDay).toMatchObject({ isRestDay: true, routineName: '', exerciseCount: 0 });
  });

  it('counts exercises per cycle day', () => {
    const challenge = buildChallenge({
      cycle_length_days: 1,
      cycle_days: [
        {
          day_number: 1,
          is_rest_day: false,
          routine_name: 'Glute workout',
          exercises: [{ name: 'Hip thrust' }, { name: 'Cable kickback' }, { name: 'Glute bridge' }],
        },
      ],
    });

    const result = toChallengeDetailViewModel(challenge, LABELS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.days[0].exerciseCount).toBe(3);
  });

  it('falls back to the challenge-wide locations label when no per-exercise location is present', () => {
    const challenge = buildChallenge({
      locations: ['Gym'],
      cycle_length_days: 1,
      cycle_days: [{ day_number: 1, is_rest_day: false, routine_name: 'Glute workout', exercises: [{ name: 'Hip thrust' }] }],
    });

    const result = toChallengeDetailViewModel(challenge, LABELS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Intl.ListFormat renders a single-item list as just the item itself, case as-is.
    expect(result.value.days[0].location).toBe('Gym');
    expect(result.value.locationsLabel).toBe('Gym');
  });

  it('falls back to mapLegacyDays (pre-cycle challenges) when cycle_days is absent, with isRestDay always false', () => {
    const challenge = buildChallenge({
      cycle_days: undefined,
      days: [
        { day: 1, title: 'Full body', description: 'x', activities: ['strength'] },
        { day: 2, title: 'Cardio', description: 'y', activities: ['cardioIntense'] },
      ],
    });

    const result = toChallengeDetailViewModel(challenge, LABELS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.days).toHaveLength(2);
    expect(result.value.days.every((d) => d.isRestDay === false)).toBe(true);
  });

  it('reads cycleLengthDays and restDaysPerCycleCount from the challenge', () => {
    const challenge = buildChallenge({
      cycle_length_days: 4,
      cycle_days: [
        { day_number: 1, is_rest_day: false },
        { day_number: 2, is_rest_day: false },
        { day_number: 3, is_rest_day: false },
        { day_number: 4, is_rest_day: true },
      ],
    });

    const result = toChallengeDetailViewModel(challenge, LABELS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.cycleLengthDays).toBe(4);
    expect(result.value.restDaysPerCycleCount).toBe(1);
  });
});

describe('getUpcomingDays', () => {
  const day = (number: number, isRestDay: boolean): ChallengeDaySummary => ({
    day: number,
    isRestDay,
    routineName: isRestDay ? '' : `Routine ${number}`,
    exerciseCount: isRestDay ? 0 : 4,
    location: 'Gym',
  });
  // Three routines and a rest day: 1, 2, 3 and rest 4.
  const cycle = [day(1, false), day(2, false), day(3, false), day(4, true)];

  it('is just the next day when it is a routine', () => {
    expect(getUpcomingDays(cycle, 4, 1).map((item) => item.day)).toEqual([2]);
    expect(getUpcomingDays(cycle, 4, 2).map((item) => item.day)).toEqual([3]);
  });

  it('shows the routine after a rest day as well — never a lone rest day', () => {
    // From day 3 the next is the rest day 4, then the cycle wraps to routine 1.
    expect(getUpcomingDays(cycle, 4, 3).map((item) => item.day)).toEqual([4, 1]);
  });

  it('keeps going through several rest days in a row, to the routine after them', () => {
    const twoRests = [day(1, false), day(2, true), day(3, true), day(4, false)];

    expect(getUpcomingDays(twoRests, 4, 1).map((item) => item.day)).toEqual([2, 3, 4]);
  });

  it('wraps round the cycle: the day after the last is the first', () => {
    expect(getUpcomingDays(cycle, 4, 4).map((item) => item.day)).toEqual([1]);
  });

  it('follows the cycle for at most one lap, and never loops forever on all-rest days', () => {
    const allRest = [day(1, true), day(2, true)];

    expect(getUpcomingDays(allRest, 2, 1)).toHaveLength(2);
  });

  it('is empty without a cycle, or with a day the cycle has no entry for', () => {
    expect(getUpcomingDays(cycle, 0, 1)).toEqual([]);
    expect(getUpcomingDays([], 4, 1)).toEqual([]);
  });
});
