import { buildChallengeCalendar } from '../challengeCalendar';
import type { CalendarCell } from '../challengeCalendar';

function flatten(months: ReturnType<typeof buildChallengeCalendar>): CalendarCell[] {
  return months.flatMap((m) => m.weeks.flatMap((w) => w.filter((c): c is CalendarCell => c !== null)));
}

describe('buildChallengeCalendar', () => {
  // 2026-08-05 is a Wednesday.
  const startDate = new Date(2026, 7, 5);
  const isRestDayFn = (challengeDay: number) => challengeDay === 2;

  it('is Sunday-first — Wed Aug 5 lands at index 3 of its week, with real (non-null) out-of-range cells before it', () => {
    const months = buildChallengeCalendar(startDate, 5, 3, [1], isRestDayFn);
    const firstWeek = months[0].weeks[0];
    // Sun Aug 2, Mon Aug 3, Tue Aug 4 exist in the month grid but precede the
    // challenge's start date — real cells (dayOfMonth set), just with a null
    // challengeDay/status, not a `null` padding slot (padding is only for
    // days that don't exist in this month's grid at all, e.g. before day 1).
    expect(firstWeek[0]?.dayOfMonth).toBe(2);
    expect(firstWeek[0]?.challengeDay).toBeNull();
    expect(firstWeek[1]?.dayOfMonth).toBe(3);
    expect(firstWeek[2]?.dayOfMonth).toBe(4);
    expect(firstWeek[3]?.dayOfMonth).toBe(5);
    expect(firstWeek[3]?.challengeDay).toBe(1);
  });

  it('classifies each day using the same priority as classifyDay', () => {
    const months = buildChallengeCalendar(startDate, 5, 3, [1], isRestDayFn);
    const cells = flatten(months);
    const byDay = new Map(cells.map((c) => [c.challengeDay, c]));

    expect(byDay.get(1)?.status).toBe('photo'); // has a photo
    expect(byDay.get(2)?.status).toBe('rest'); // rest day, no photo
    expect(byDay.get(3)?.status).toBe('today'); // currentDay, no photo, not rest
    expect(byDay.get(4)?.status).toBe('future');
    expect(byDay.get(5)?.status).toBe('future');
  });

  it('marks a day before currentDay with no photo and no rest flag as missed', () => {
    // currentDay 4 this time, so day 3 has elapsed with nothing logged.
    const months = buildChallengeCalendar(startDate, 5, 4, [1], isRestDayFn);
    const cells = flatten(months);
    const day3 = cells.find((c) => c.challengeDay === 3);
    expect(day3?.status).toBe('missed');
  });

  it('marks days outside the challenge range with a null challengeDay/status', () => {
    const months = buildChallengeCalendar(startDate, 5, 3, [1], isRestDayFn);
    const allCells = months.flatMap((m) => m.weeks.flat());
    const outOfRange = allCells.filter((c) => c !== null && c.challengeDay === null);
    expect(outOfRange.every((c) => c?.status === null)).toBe(true);
  });
});
