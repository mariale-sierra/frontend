import { buildDayRingTicks, classifyDay, dayInCycle, findCycleDayFor, getProgressFraction, isRestDay } from '../challengeCycle';
import type { DayStatus } from '../challengeCycle';
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

  it('is `rest` when it is an already-reached rest day with no photo', () => {
    expect(classifyDay({ ...base, isRestDay: true })).toBe('rest');
    expect(classifyDay({ ...base, isRestDay: true, challengeDay: 10 })).toBe('rest'); // today, resting
  });

  it('is `today` for the current day with no photo and not a rest day', () => {
    expect(classifyDay({ ...base, challengeDay: 10 })).toBe('today');
  });

  it('is `future` for a day after the current one, even when that day is a rest day', () => {
    expect(classifyDay({ ...base, challengeDay: 11 })).toBe('future');
    // A future rest day hasn't happened yet — it must not read as already
    // "ticked off" just because its cycle position is a rest day.
    expect(classifyDay({ ...base, challengeDay: 11, isRestDay: true })).toBe('future');
  });

  it('is `missed` for an elapsed, non-rest day with no photo', () => {
    expect(classifyDay({ ...base, challengeDay: 3 })).toBe('missed');
  });
});

describe('buildDayRingTicks', () => {
  const colors = { photoColor: 'ACTIVITY', restColor: 'REST', trackColor: 'TRACK' };
  // One tick per day, so the ring reads day by day.
  const ring = (statuses: DayStatus[], segmentCount = statuses.length) =>
    buildDayRingTicks({
      segmentCount,
      totalDays: statuses.length,
      statusOf: (day) => statuses[day - 1],
      ...colors,
    });

  it('starts empty — nothing done yet, however long the challenge', () => {
    expect(ring(['today', 'future', 'future', 'future']).every((tick) => tick === 'TRACK')).toBe(true);
  });

  it('fills each day where it is, in the activity color for a photo and the rest color for a rest day', () => {
    expect(ring(['photo', 'photo', 'photo', 'rest', 'photo', 'today', 'future', 'future'])).toEqual([
      'ACTIVITY', 'ACTIVITY', 'ACTIVITY', 'REST', 'ACTIVITY', 'TRACK', 'TRACK', 'TRACK',
    ]);
  });

  it('leaves a missed day as an empty gap — the days after it are filled AFTER the gap', () => {
    // A 3-train-days-and-a-rest-day cycle, the first train day done, two missed, then the rest day.
    expect(ring(['photo', 'missed', 'missed', 'rest', 'photo', 'photo', 'photo', 'rest'])).toEqual([
      'ACTIVITY', 'TRACK', 'TRACK', 'REST', 'ACTIVITY', 'ACTIVITY', 'ACTIVITY', 'REST',
    ]);
  });

  it('puts the rest ticks after the empty space, where the rest day falls, not straight after the photo ones', () => {
    const ticks = ring(['photo', 'missed', 'missed', 'rest']);

    expect(ticks.indexOf('REST')).toBe(3);
    expect(ticks.slice(0, 3)).toEqual(['ACTIVITY', 'TRACK', 'TRACK']);
  });

  it('is a full circle only when every day was done', () => {
    const done = ring(['photo', 'photo', 'rest', 'photo', 'photo', 'photo', 'rest', 'photo']);
    const oneMissed = ring(['photo', 'photo', 'rest', 'missed', 'photo', 'photo', 'rest', 'photo']);

    expect(done.every((tick) => tick !== 'TRACK')).toBe(true);
    expect(oneMissed.filter((tick) => tick === 'TRACK')).toHaveLength(1);
  });

  it('does not fill a future rest day, or today before it is done', () => {
    expect(ring(['photo', 'today', 'future', 'future'])).toEqual(['ACTIVITY', 'TRACK', 'TRACK', 'TRACK']);
  });

  it('gives each day a run of ticks when there are more ticks than days', () => {
    // 4 days on 8 ticks: two ticks a day.
    expect(ring(['photo', 'missed', 'rest', 'photo'], 8)).toEqual([
      'ACTIVITY', 'ACTIVITY', 'TRACK', 'TRACK', 'REST', 'REST', 'ACTIVITY', 'ACTIVITY',
    ]);
  });

  it('keeps a missed day as a gap of ticks in a long challenge too, in the same place', () => {
    // 60 ticks for a 60-day challenge (one each), with one missed day at day 31.
    const statuses: DayStatus[] = Array.from({ length: 60 }, (_, index) => (index === 30 ? 'missed' : 'photo'));
    const ticks = ring(statuses);

    expect(ticks[30]).toBe('TRACK');
    expect(ticks.filter((tick) => tick === 'TRACK')).toHaveLength(1);
  });

  it('shows the kind that covers most of a tick when a tick covers more than one day', () => {
    // 10 days on 4 ticks: 2.5 days a tick. Tick 0 covers days 1, 2 and half of 3.
    const statuses: DayStatus[] = ['photo', 'photo', 'missed', 'missed', 'missed', 'missed', 'missed', 'photo', 'photo', 'photo'];
    const ticks = ring(statuses, 4);

    expect(ticks[0]).toBe('ACTIVITY'); // photo, photo, half of a missed day
    expect(ticks[1]).toBe('TRACK'); // half of a missed day, two missed days
    expect(ticks[2]).toBe('TRACK'); // two missed days, half of a photo one
    expect(ticks[3]).toBe('ACTIVITY'); // half of a photo day, two photo days
  });

  it('lets the photo day win a tie between a photo day and an empty one', () => {
    // 2 days on 1 tick: half photo, half missed.
    expect(ring(['photo', 'missed'], 1)).toEqual(['ACTIVITY']);
    expect(ring(['rest', 'missed'], 1)).toEqual(['REST']);
    expect(ring(['photo', 'rest'], 1)).toEqual(['ACTIVITY']);
  });

  it('renders the same dial for a short or a long challenge — only what fills it changes', () => {
    const short = ring(['photo', 'photo', 'photo', 'photo', 'photo', 'today', 'future', 'future', 'future', 'future'], 60);
    const long = buildDayRingTicks({
      segmentCount: 60,
      totalDays: 75,
      statusOf: (day) => (day <= 37 ? 'photo' : 'future'),
      ...colors,
    });

    expect(short).toHaveLength(60);
    expect(long).toHaveLength(60);
    // Half done either way: the first half of the dial is filled, the rest is not.
    expect(short.filter((tick) => tick === 'ACTIVITY')).toHaveLength(30);
    expect(long.filter((tick) => tick === 'ACTIVITY')).toHaveLength(30);
  });

  it('is an empty track for a challenge with no days, and no ticks for no segments', () => {
    expect(buildDayRingTicks({ segmentCount: 3, totalDays: 0, statusOf: () => 'photo', ...colors })).toEqual([
      'TRACK', 'TRACK', 'TRACK',
    ]);
    expect(buildDayRingTicks({ segmentCount: 0, totalDays: 5, statusOf: () => 'photo', ...colors })).toEqual([]);
  });
});

describe('getProgressFraction', () => {
  it('is the share of the challenge that has been reached', () => {
    expect(getProgressFraction(12, 24)).toBe(0.5);
    expect(getProgressFraction(1, 4)).toBe(0.25);
  });

  it('never goes past 1', () => {
    expect(getProgressFraction(30, 21)).toBe(1);
  });

  it('is 0 for a challenge with no length', () => {
    expect(getProgressFraction(3, 0)).toBe(0);
  });
});
