import { useMemo } from 'react';
import { buildChallengeCalendar } from '../utils/challengeCalendar';
import type { CalendarMonth } from '../utils/challengeCalendar';

export function useChallengeCalendar(
  startDate: Date | null,
  totalDays: number,
  currentDay: number,
  photoDays: number[],
  isRestDayFn: (challengeDay: number) => boolean,
): CalendarMonth[] {
  return useMemo(() => {
    if (!startDate || totalDays <= 0) return [];
    return buildChallengeCalendar(startDate, totalDays, currentDay, photoDays, isRestDayFn);
  }, [startDate, totalDays, currentDay, photoDays, isRestDayFn]);
}
