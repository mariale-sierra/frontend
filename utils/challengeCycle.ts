import type { ChallengeCycleDayContract } from '../types/challenge';

/**
 * Maps an absolute challenge day (1-indexed) onto its 1-indexed position
 * within the challenge's cycle. Mirrors
 * `backend/src/challenges/challenges.service.ts`'s private
 * `calculateCurrentDayInCycle` exactly (same formula) — a day's cycle
 * position is fully deterministic from `cycle_length_days` alone, no extra
 * network round-trip needed to know it for any day, past or future.
 */
export function dayInCycle(challengeDay: number, cycleLengthDays: number): number {
  if (!cycleLengthDays || cycleLengthDays <= 0) return challengeDay;
  return ((challengeDay - 1) % cycleLengthDays) + 1;
}

/** The cycle-day entry (routine name, rest flag, exercises) covering a given absolute challenge day. */
export function findCycleDayFor(
  challengeDay: number,
  cycleLengthDays: number,
  cycleDays: ChallengeCycleDayContract[],
): ChallengeCycleDayContract | null {
  const position = dayInCycle(challengeDay, cycleLengthDays);
  return cycleDays.find((day) => day.day_number === position) ?? null;
}

/** Whether a given absolute challenge day falls on a rest day, per the challenge's cycle. */
export function isRestDay(
  challengeDay: number,
  cycleLengthDays: number,
  cycleDays: ChallengeCycleDayContract[],
): boolean {
  return findCycleDayFor(challengeDay, cycleLengthDays, cycleDays)?.is_rest_day === true;
}

/**
 * Per-day status for the progress ring and the calendar — one shared priority
 * order so the ring's segments and the calendar's dot colors can never
 * disagree about the same day:
 * 1. `photo` — the user has a photo logged for this day (wins even on a
 *    rest day — logging anyway is a positive signal, not a status conflict).
 * 2. `future` — hasn't happened yet, checked before `rest` (a day being a
 *    rest day per the cycle is a fact independent of elapsed time, so
 *    without this a not-yet-reached rest day was showing as already
 *    "ticked off" — fixed 2026-08-29, per explicit bug report: rest days
 *    should only read as rest once actually reached, not from day 1).
 * 3. `rest` — a rest day per the cycle that has already been reached, no photo needed.
 * 4. `today` — the current day, not a rest day, not yet resolved either way.
 * 5. `missed` — elapsed, not a rest day, no photo.
 */
export type DayStatus = 'photo' | 'rest' | 'today' | 'future' | 'missed';

export function classifyDay(params: {
  challengeDay: number;
  currentDay: number;
  isRestDay: boolean;
  hasPhoto: boolean;
}): DayStatus {
  const { challengeDay, currentDay, isRestDay: restDay, hasPhoto } = params;
  if (hasPhoto) return 'photo';
  if (challengeDay > currentDay) return 'future';
  if (restDay) return 'rest';
  if (challengeDay === currentDay) return 'today';
  return 'missed';
}

/**
 * The ring's tick colors, laid out by DAY: the ring is the whole challenge, day 1
 * at 12 o'clock and the last day at the end of the circle, and each stretch of it
 * takes the color of the day it stands for — the activity color for a day with a
 * photo, the rest color for a rest day that has been reached, and the empty track
 * for everything else (today and the days to come, and a day that was MISSED).
 * So a missed day stays an empty gap where it is, and whatever comes after it is
 * filled after the gap; only a challenge where every day was done is a full circle.
 * (This used to count the photo days and the rest days and fill that many ticks
 * from the start, one run of each, so missing a day just made the ring a little
 * shorter, and the rest ticks always came right after the photo ones.)
 *
 * A fixed `segmentCount` of ticks stands for the `totalDays` days whatever their
 * number — a 10-day and a 75-day challenge are the same dense dial (tying the tick
 * count to the length made short challenges look sparse). So a tick covers some
 * days (`totalDays / segmentCount`, over 1 for a long challenge) or a part of one
 * (a short challenge draws each day as a run of ticks). A tick that covers days of
 * different kinds takes the kind that covers most of it, the photo day winning a
 * tie — a long challenge's missed day is not lost, but not blown up either.
 *
 * Colors are passed in rather than imported so this stays a pure, theme-agnostic,
 * easily-tested function; `statusOf` is what says how each day went (see
 * `classifyDay`).
 */
export function buildDayRingTicks(params: {
  segmentCount: number;
  totalDays: number;
  statusOf: (challengeDay: number) => DayStatus;
  photoColor: string;
  restColor: string;
  trackColor: string;
}): string[] {
  const { segmentCount, totalDays, statusOf, photoColor, restColor, trackColor } = params;
  if (segmentCount <= 0) return [];
  if (totalDays <= 0) return Array.from({ length: segmentCount }, () => trackColor);

  const statuses = Array.from({ length: totalDays }, (_, index) => statusOf(index + 1));
  // Tolerance for comparing lengths that are fractions of a day.
  const EPSILON = 1e-9;

  return Array.from({ length: segmentCount }, (_, index) => {
    // This tick covers days `start` to `end` (in days from the challenge's start).
    const start = (index * totalDays) / segmentCount;
    const end = ((index + 1) * totalDays) / segmentCount;

    let photo = 0;
    let rest = 0;
    for (let day = Math.floor(start); day < Math.ceil(end) && day < totalDays; day += 1) {
      const covered = Math.min(end, day + 1) - Math.max(start, day);
      if (statuses[day] === 'photo') photo += covered;
      else if (statuses[day] === 'rest') rest += covered;
    }
    const empty = end - start - photo - rest;

    if (photo > EPSILON && photo + EPSILON >= rest && photo + EPSILON >= empty) return photoColor;
    if (rest > EPSILON && rest + EPSILON >= empty) return restColor;
    return trackColor;
  });
}

/**
 * How far along a challenge is, as a share of its length (0 to 1) — the fill of
 * a card's progress bar. 0 for a challenge with no length yet, and never past 1
 * (a challenge on its last-plus day still reads as complete, not overflowing).
 */
export function getProgressFraction(currentDay: number, totalDays: number): number {
  return totalDays > 0 ? Math.min(currentDay / totalDays, 1) : 0;
}
