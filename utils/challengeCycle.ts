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
 * Per-day status for the Consistency ring/calendar — one shared priority
 * order so the ring's segments and the calendar's dot colors can never
 * disagree about the same day:
 * 1. `photo` — the user has a photo logged for this day (wins even on a
 *    rest day — logging anyway is a positive signal, not a status conflict).
 * 2. `rest` — a rest day per the cycle, no photo needed.
 * 3. `today` — the current day, not yet resolved either way.
 * 4. `future` — hasn't happened yet.
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
  if (restDay) return 'rest';
  if (challengeDay === currentDay) return 'today';
  if (challengeDay > currentDay) return 'future';
  return 'missed';
}

/**
 * Consistency-ring segment percentages (0–1) over the WHOLE challenge span
 * (1..totalDays), not just days elapsed so far — the ring reflects real
 * logged/rest days out of the full challenge. `photoPercent` takes priority
 * over `restPercent` for a given day (matches `classifyDay`'s priority —
 * logging on a rest day counts as a photo day, not a rest day).
 *
 * Deliberately percentage-based, not "one tick per day" — a fixed number of
 * ring ticks (see ChallengeProgressRing) rendered from these two percents
 * looks the same density for a 10-day challenge as a 75-day one; tying tick
 * count to `totalDays` made short challenges look sparse/broken.
 */
export function computeConsistencyPercents(params: {
  totalDays: number;
  cycleLengthDays: number;
  cycleDays: ChallengeCycleDayContract[];
  photoDays: Set<number>;
}): { photoPercent: number; restPercent: number } {
  const { totalDays, cycleLengthDays, cycleDays, photoDays } = params;
  if (totalDays <= 0) return { photoPercent: 0, restPercent: 0 };

  let photoCount = 0;
  let restCount = 0;

  for (let day = 1; day <= totalDays; day += 1) {
    if (photoDays.has(day)) {
      photoCount += 1;
    } else if (isRestDay(day, cycleLengthDays, cycleDays)) {
      restCount += 1;
    }
  }

  return {
    photoPercent: photoCount / totalDays,
    restPercent: restCount / totalDays,
  };
}

/**
 * Resolves a fixed `segmentCount` of ring-tick colors from the two
 * percentages above — colors passed in rather than imported so this stays a
 * pure, theme-agnostic, easily-testable function (ChallengeProgressRing's
 * caller supplies the real theme tokens).
 */
export function buildRingTicks(params: {
  segmentCount: number;
  photoPercent: number;
  restPercent: number;
  photoColor: string;
  restColor: string;
  trackColor: string;
}): string[] {
  const { segmentCount, photoPercent, restPercent, photoColor, restColor, trackColor } = params;
  if (segmentCount <= 0) return [];

  const photoBoundary = Math.max(0, Math.min(1, photoPercent));
  const restBoundary = Math.max(photoBoundary, Math.min(1, photoBoundary + restPercent));

  return Array.from({ length: segmentCount }, (_, index) => {
    const midpoint = (index + 0.5) / segmentCount;
    if (midpoint < photoBoundary) return photoColor;
    if (midpoint < restBoundary) return restColor;
    return trackColor;
  });
}

