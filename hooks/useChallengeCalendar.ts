import { useMemo } from 'react';
import { buildChallengeCalendar } from '../utils/challengeCalendar';
import type { CalendarMonth } from '../utils/challengeCalendar';

export function useChallengeCalendar(
  startDate: Date | null,
  totalDays: number,
  completedDays: number[],
  photoDays: number[],
): CalendarMonth[] {
  return useMemo(() => {
    if (!startDate || totalDays <= 0) return [];
    return buildChallengeCalendar(startDate, totalDays, completedDays, photoDays);
  }, [startDate, totalDays, completedDays, photoDays]);
}
