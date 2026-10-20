import { StyleSheet } from 'react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { CycleCalendarPreview } from '../CycleCalendarPreview';
import { activityColors, colors, fillOpacity } from '../../../../constants/theme';
import type { CycleDayStatus } from '../CycleDayList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}(${Object.entries(options).map(([k, v]) => `${k}=${v}`).join(',')})` : key,
    i18n: { language: 'en' },
  }),
}));

const styleOf = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

async function renderCalendar(
  props: Partial<{
    durationDays: number;
    cycleLengthDays: number;
    startWeekday: number;
    statuses: Record<number, CycleDayStatus>;
  }> = {},
) {
  const { durationDays = 30, cycleLengthDays = 4, startWeekday = 0, statuses = {} } = props;
  return renderWithTheme(
    <CycleCalendarPreview
      durationDays={durationDays}
      cycleLengthDays={cycleLengthDays}
      startWeekday={startWeekday}
      getDayStatus={(day) => statuses[day] ?? 'empty'}
      getDayRoutineColor={() => activityColors.strength}
    />,
  );
}

describe('CycleCalendarPreview (53A / 53B)', () => {
  it('has one cell per challenge day, each showing its cycle day: (i % cycle) + 1', async () => {
    const screen = await renderCalendar({ durationDays: 10, cycleLengthDays: 4 });

    expect(screen.queryByTestId('cycle-calendar-day-9')).toBeTruthy();
    expect(screen.queryByTestId('cycle-calendar-day-10')).toBeNull();
    const shown = Array.from({ length: 10 }, (_, i) => screen.getByTestId(`cycle-calendar-day-${i}`).props.children.props.children);
    expect(shown).toEqual([1, 2, 3, 4, 1, 2, 3, 4, 1, 2]);
  });

  it('fills workout days with their activity color and rest days with `rest`, both with ink numbers', async () => {
    const screen = await renderCalendar({ statuses: { 1: 'configured', 2: 'rest' } });

    // Second cycle (cells 4, 5 = cycle days 1, 2) — the first one is `paper`.
    expect(styleOf(screen.getByTestId('cycle-calendar-day-4')).backgroundColor).toBe(activityColors.strength);
    expect(styleOf(screen.getByTestId('cycle-calendar-day-5')).backgroundColor).toBe(colors.rest);
    expect(styleOf(screen.getByTestId('cycle-calendar-day-4').props.children).color).toBe(colors.ink);
  });

  it('draws a day with nothing assigned as a dashed outline with no fill', async () => {
    const screen = await renderCalendar();
    const empty = styleOf(screen.getByTestId('cycle-calendar-day-5'));

    expect(empty.borderStyle).toBe('dashed');
    expect(empty.backgroundColor).toBe('transparent');
  });

  it('fills an unassigned first-cycle day with `paper` and an ink number; assigned ones take their color', async () => {
    const screen = await renderCalendar({ cycleLengthDays: 4, statuses: { 1: 'configured', 2: 'rest' } });

    expect(styleOf(screen.getByTestId('cycle-calendar-day-0')).backgroundColor).toBe(activityColors.strength);
    expect(styleOf(screen.getByTestId('cycle-calendar-day-1')).backgroundColor).toBe(colors.rest);
    for (const i of [2, 3]) {
      const cell = screen.getByTestId(`cycle-calendar-day-${i}`);
      expect(styleOf(cell).backgroundColor).toBe(colors.paper);
      expect(styleOf(cell).borderWidth).toBeUndefined();
      expect(styleOf(cell.props.children).color).toBe(colors.ink);
    }
    // Later unassigned days stay dashed.
    expect(styleOf(screen.getByTestId('cycle-calendar-day-6')).borderStyle).toBe('dashed');
  });

  it('dims the leftover days of a cut-short last cycle and says "N full cycles + R days"', async () => {
    const screen = await renderCalendar({ durationDays: 30, cycleLengthDays: 4 });

    expect(styleOf(screen.getByTestId('cycle-calendar-day-28')).opacity).toBe(fillOpacity.dim);
    expect(styleOf(screen.getByTestId('cycle-calendar-day-29')).opacity).toBe(fillOpacity.dim);
    expect(styleOf(screen.getByTestId('cycle-calendar-day-27')).opacity).toBeUndefined();
    expect(screen.getByTestId('cycle-calendar-summary').props.children).toBe(
      'challengeCreate.calendar.cyclesAndDays(cycles=challengeCreate.calendar.fullCycles(count=7),days=challengeCreate.calendar.leftoverDays(count=2))',
    );
  });

  it('says only "N full cycles" when the length divides evenly, with nothing dimmed', async () => {
    const screen = await renderCalendar({ durationDays: 28, cycleLengthDays: 4 });

    expect(screen.getByTestId('cycle-calendar-summary').props.children).toBe('challengeCreate.calendar.fullCycles(count=7)');
    expect(styleOf(screen.getByTestId('cycle-calendar-day-27')).opacity).toBeUndefined();
  });

  it("starts day 1 in today's weekday column", async () => {
    const monday = await renderCalendar({ startWeekday: 0, durationDays: 7 });
    const thursday = await renderCalendar({ startWeekday: 3, durationDays: 7 });

    // A 7-day challenge fits one week from Monday, but spills into a second
    // week when it starts on a Thursday.
    const weeksOf = (screen: Awaited<ReturnType<typeof renderCalendar>>) =>
      JSON.stringify(screen.toJSON()).match(/cycle-calendar-day-/g)?.length;
    expect(weeksOf(monday)).toBe(7);
    expect(weeksOf(thursday)).toBe(7);
    expect(JSON.stringify(thursday.toJSON()).length).toBeGreaterThan(JSON.stringify(monday.toJSON()).length);
  });
});
