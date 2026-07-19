import { hoursUntilMidnight } from '../time';

/**
 * hoursUntilMidnight() floors the number of whole hours between "now" and the
 * next midnight (utils/time.ts: `midnight.setHours(24, 0, 0, 0)` then
 * floor((midnight - now) / 1h)). These tests pin the system clock to specific
 * times of day to make that math deterministic.
 */
describe('hoursUntilMidnight', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  function mockCurrentTime(hours: number, minutes: number) {
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    jest.useFakeTimers();
    jest.setSystemTime(now);
  }

  it('returns 14 hours remaining when it is 10:00', () => {
    mockCurrentTime(10, 0);

    expect(hoursUntilMidnight()).toBe(14);
  });

  it('returns 4 hours remaining when it is 20:00', () => {
    mockCurrentTime(20, 0);

    expect(hoursUntilMidnight()).toBe(4);
  });

  it('returns 0 hours remaining when it is 23:30 (less than a full hour left)', () => {
    mockCurrentTime(23, 30);

    expect(hoursUntilMidnight()).toBe(0);
  });
});
