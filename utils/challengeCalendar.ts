const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export interface CalendarCell {
  dayOfMonth: number;
  challengeDay: number | null; // null = day exists in the month but outside the challenge range
  isCompleted: boolean;
  hasPhoto: boolean;
  isFuture: boolean;
  isToday: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-indexed
  label: string; // e.g. "MARCH 2026"
  weeks: Array<Array<CalendarCell | null>>; // null = empty padding cell
}

export function buildChallengeCalendar(
  startDate: Date,
  totalDays: number,
  completedDays: number[],
  photoDays: number[],
): CalendarMonth[] {
  const completedSet = new Set(completedDays);
  const photoSet = new Set(photoDays);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + totalDays - 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const months: CalendarMonth[] = [];

  // Walk month by month from the month containing startDate to the month containing endDate
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const lastMonthStart = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= lastMonthStart) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Compute Monday-first leading padding (Mon=0 … Sun=6)
    const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const leadingPad = (firstWeekday + 6) % 7;

    const flat: Array<CalendarCell | null> = [];

    for (let i = 0; i < leadingPad; i++) {
      flat.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const diffDays = Math.round((date.getTime() - start.getTime()) / 86_400_000);
      const challengeDay = diffDays >= 0 && diffDays < totalDays ? diffDays + 1 : null;

      flat.push({
        dayOfMonth: d,
        challengeDay,
        isCompleted: challengeDay !== null && completedSet.has(challengeDay),
        hasPhoto: challengeDay !== null && photoSet.has(challengeDay),
        isFuture: date > today,
        isToday: date.getTime() === today.getTime(),
      });
    }

    // Chunk flat list into weeks of 7, padding the last week if needed
    const weeks: Array<Array<CalendarCell | null>> = [];
    for (let i = 0; i < flat.length; i += 7) {
      const week = flat.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    const hasChallengeDays = (w: Array<CalendarCell | null>) =>
      w.some((c) => c !== null && c.challengeDay !== null);

    // First month: drop leading weeks that precede the challenge start
    if (year === start.getFullYear() && month === start.getMonth()) {
      while (weeks.length > 0 && !hasChallengeDays(weeks[0])) weeks.shift();
    }

    // Last month: drop trailing weeks that extend past the challenge end
    if (year === end.getFullYear() && month === end.getMonth()) {
      while (weeks.length > 0 && !hasChallengeDays(weeks[weeks.length - 1])) weeks.pop();
    }

    months.push({ year, month, label: `${MONTH_NAMES[month]} ${year}`, weeks });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}
