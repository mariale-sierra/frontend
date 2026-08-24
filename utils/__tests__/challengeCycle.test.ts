import { buildRingTicks, classifyDay, computeConsistencyPercents, dayInCycle, findCycleDayFor, isRestDay } from '../challengeCycle';
import type { ChallengeCycleDayContract } from '../../types/challenge';

const CYCLE: ChallengeCycleDayContract[] = [
  { day_number: 1, is_rest_day: false, routine_name: 'Glute workout' },
  { day_number: 2, is_rest_day: false, routine_name: 'Upper body' },
  { day_number: 3, is_rest_day: false, routine_name: 'Cardio blast' },
  { day_number: 4, is_rest_day: true, routine_name: undefined },
];

describe('dayInCycle', () => {
  it('maps absolute day 1 onto cycle position 1', () => {
    expect(dayInCycle(1, 4)).toBe(1);
  });

  it('wraps around at the cycle boundary — mirrors the backend formula exactly', () => {
    // backend: ((currentDay - 1) % cycleLengthDays) + 1
    expect(dayInCycle(4, 4)).toBe(4);
    expect(dayInCycle(5, 4)).toBe(1);
    expect(dayInCycle(8, 4)).toBe(4);
    expect(dayInCycle(9, 4)).toBe(1);
  });

  it('handles a non-multiple-of-4 challenge day (day 12 of a 4-day cycle)', () => {
    expect(dayInCycle(12, 4)).toBe(4);
  });

  it('falls back to the raw day when cycleLengthDays is missing/zero', () => {
    expect(dayInCycle(7, 0)).toBe(7);
  });
});

describe('findCycleDayFor / isRestDay', () => {
  it('finds the correct cycle day for an absolute challenge day', () => {
    expect(findCycleDayFor(1, 4, CYCLE)?.routine_name).toBe('Glute workout');
    expect(findCycleDayFor(9, 4, CYCLE)?.routine_name).toBe('Glute workout'); // wraps to position 1 again
    expect(findCycleDayFor(4, 4, CYCLE)?.is_rest_day).toBe(true);
  });

  it('isRestDay reflects the cycle day is_rest_day flag, including on wrapped days', () => {
    expect(isRestDay(4, 4, CYCLE)).toBe(true);
    expect(isRestDay(8, 4, CYCLE)).toBe(true); // wraps to position 4
    expect(isRestDay(1, 4, CYCLE)).toBe(false);
  });

  it('returns false/null-safe when the cycle day is not found', () => {
    expect(isRestDay(1, 4, [])).toBe(false);
    expect(findCycleDayFor(1, 4, [])).toBeNull();
  });
});

describe('classifyDay', () => {
  const base = { challengeDay: 5, currentDay: 10, isRestDay: false, hasPhoto: false };

  it('is `photo` when the day has a photo — wins even on a rest day', () => {
    expect(classifyDay({ ...base, hasPhoto: true })).toBe('photo');
    expect(classifyDay({ ...base, hasPhoto: true, isRestDay: true })).toBe('photo');
  });

  it('is `rest` when it is a rest day with no photo', () => {
    expect(classifyDay({ ...base, isRestDay: true })).toBe('rest');
  });

  it('is `today` for the current day with no photo and not a rest day', () => {
    expect(classifyDay({ ...base, challengeDay: 10 })).toBe('today');
  });

  it('is `future` for a day after the current one', () => {
    expect(classifyDay({ ...base, challengeDay: 11 })).toBe('future');
  });

  it('is `missed` for an elapsed, non-rest day with no photo', () => {
    expect(classifyDay({ ...base, challengeDay: 3 })).toBe('missed');
  });
});

describe('computeConsistencyPercents', () => {
  it('counts photo days and rest-without-photo days separately, over the full span', () => {
    // 4-day cycle: days 1-3 workout, day 4 rest. 8-day challenge = 2 full cycles.
    // Photos logged on days 1, 2, 5 (3 photo days). Day 4 and day 8 are rest, no photo (2 rest days).
    const result = computeConsistencyPercents({
      totalDays: 8,
      cycleLengthDays: 4,
      cycleDays: CYCLE,
      photoDays: new Set([1, 2, 5]),
    });
    expect(result.photoPercent).toBeCloseTo(3 / 8);
    expect(result.restPercent).toBeCloseTo(2 / 8);
  });

  it('a photo on a rest day counts as photoPercent, not restPercent', () => {
    const result = computeConsistencyPercents({
      totalDays: 4,
      cycleLengthDays: 4,
      cycleDays: CYCLE,
      photoDays: new Set([4]), // day 4 is a rest day per CYCLE
    });
    expect(result.photoPercent).toBe(1 / 4);
    expect(result.restPercent).toBe(0);
  });

  it('returns zeros for a non-positive totalDays', () => {
    expect(computeConsistencyPercents({ totalDays: 0, cycleLengthDays: 4, cycleDays: CYCLE, photoDays: new Set() }))
      .toEqual({ photoPercent: 0, restPercent: 0 });
  });
});

describe('buildRingTicks', () => {
  it('splits a fixed segment count proportionally regardless of the challenge length it represents', () => {
    // 50% photo, 25% rest, 25% track, over 20 segments → 10 photo, 5 rest, 5 track.
    const ticks = buildRingTicks({
      segmentCount: 20,
      photoPercent: 0.5,
      restPercent: 0.25,
      photoColor: 'LIME',
      restColor: 'PURPLE',
      trackColor: 'TRACK',
    });
    expect(ticks.filter((c) => c === 'LIME')).toHaveLength(10);
    expect(ticks.filter((c) => c === 'PURPLE')).toHaveLength(5);
    expect(ticks.filter((c) => c === 'TRACK')).toHaveLength(5);
    // Photo segments come first (clockwise from the start), then rest, then track.
    expect(ticks.slice(0, 10).every((c) => c === 'LIME')).toBe(true);
    expect(ticks.slice(10, 15).every((c) => c === 'PURPLE')).toBe(true);
    expect(ticks.slice(15).every((c) => c === 'TRACK')).toBe(true);
  });

  it('renders the same segment count for a short or a long challenge — only the split changes', () => {
    const shortChallenge = buildRingTicks({
      segmentCount: 60,
      photoPercent: 3 / 10, // e.g. 3 of 10 days
      restPercent: 0,
      photoColor: 'LIME',
      restColor: 'PURPLE',
      trackColor: 'TRACK',
    });
    const longChallenge = buildRingTicks({
      segmentCount: 60,
      photoPercent: 3 / 10, // same proportion, e.g. 22.5 of 75 days
      restPercent: 0,
      photoColor: 'LIME',
      restColor: 'PURPLE',
      trackColor: 'TRACK',
    });
    expect(shortChallenge).toHaveLength(60);
    expect(longChallenge).toHaveLength(60);
    expect(shortChallenge).toEqual(longChallenge);
  });

  it('clamps percentages so photo+rest never exceeds 100% of the ring', () => {
    const ticks = buildRingTicks({
      segmentCount: 10,
      photoPercent: 0.8,
      restPercent: 0.5, // 0.8+0.5 > 1
      photoColor: 'LIME',
      restColor: 'PURPLE',
      trackColor: 'TRACK',
    });
    expect(ticks.filter((c) => c === 'TRACK')).toHaveLength(0);
  });

  it('returns an empty array for a non-positive segment count', () => {
    expect(buildRingTicks({ segmentCount: 0, photoPercent: 0.5, restPercent: 0.5, photoColor: 'A', restColor: 'B', trackColor: 'C' })).toEqual([]);
  });
});
