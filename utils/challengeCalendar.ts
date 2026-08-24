import { classifyDay } from './challengeCycle';
import type { DayStatus } from './challengeCycle';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export interface CalendarCell {
  dayOfMonth: number;
  challengeDay: number | null; // null = day exists in the month but outside the challenge range
  /** null only when challengeDay is null — see classifyDay in utils/challengeCycle.ts for the priority order. */
  status: DayStatus | null;
  /** Convenience booleans derived from `status`, kept for callers (e.g. RestDayCalendar,
   * the challenge-creation date picker) that only care about future/today, not the full
   * photo/rest/missed classification. */
  isFuture: boolean;
  isToday: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-indexed
  label: string; // e.g. "AUGUST 2026"
  weeks: Array<Array<CalendarCell | null>>; // null = empty padding cell
}

/**
 * `isRestDayFn` classifies any absolute challenge day as a rest day or not
 * (see utils/challengeCycle.ts's `isRestDay` — deterministic from the
 * challenge's cycle, no backend gap). Weeks are Sunday-first (S M T W T F S,
 * per the Challenge-Detail-Calendar wireframe) — `Date#getDay()` is already
 * 0=Sunday, so no shift is needed (the old Monday-first version subtracted
 * one; that's gone now that the wireframe confirmed Sunday-first).
 */
export function buildChallengeCalendar(
  startDate: Date,
  totalDays: number,
  currentDay: number,
  photoDays: number[],
  isRestDayFn: (challengeDay: number) => boolean,
): CalendarMonth[] {
  const photoSet = new Set(photoDays);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + totalDays - 1);

  const months: CalendarMonth[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonthStart = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= lastMonthStart) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const leadingPad = new Date(year, month, 1).getDay(); // 0=Sun … 6=Sat, Sunday-first grid

    const flat: Array<CalendarCell | null> = [];

    for (let i = 0; i < leadingPad; i++) {
      flat.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const diffDays = Math.round((date.getTime() - start.getTime()) / 86_400_000);
      const challengeDay = diffDays >= 0 && diffDays < totalDays ? diffDays + 1 : null;
      const status = challengeDay !== null
        ? classifyDay({
            challengeDay,
            currentDay,
            isRestDay: isRestDayFn(challengeDay),
            hasPhoto: photoSet.has(challengeDay),
          })
        : null;

      flat.push({
        dayOfMonth: d,
        challengeDay,
        status,
        isFuture: status === 'future',
        isToday: status === 'today',
      });
    }

    const weeks: Array<Array<CalendarCell | null>> = [];
    for (let i = 0; i < flat.length; i += 7) {
      const week = flat.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const hasChallengeDays = (w: Array<CalendarCell | null>) =>
      w.some((c) => c !== null && c.challengeDay !== null);

    if (year === start.getFullYear() && month === start.getMonth()) {
      while (weeks.length > 0 && !hasChallengeDays(weeks[0])) weeks.shift();
    }

    if (year === end.getFullYear() && month === end.getMonth()) {
      while (weeks.length > 0 && !hasChallengeDays(weeks[weeks.length - 1])) weeks.pop();
    }

    months.push({ year, month, label: `${MONTH_NAMES[month]} ${year}`, weeks });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}
