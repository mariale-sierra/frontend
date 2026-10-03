import { buildTickRingPath } from '../tickRing';

describe('buildTickRingPath', () => {
  const params = { center: 50, innerRadius: 30, outerRadius: 40, count: 4 };

  it('draws one segment per tick', () => {
    const path = buildTickRingPath({ ...params, count: 60 });

    expect(path.match(/M/g)).toHaveLength(60);
    expect(path.match(/L/g)).toHaveLength(60);
  });

  it('starts at 12 o\'clock, with the outer end first', () => {
    // Straight up from the center (50, 50): the outer end at y = 50 - 40, the inner at y = 50 - 30.
    expect(buildTickRingPath(params).startsWith('M50 10L50 20')).toBe(true);
  });

  it('runs clockwise, a quarter turn per tick for four ticks', () => {
    // 12 o'clock, then 3 o'clock (right), 6 o'clock (down), 9 o'clock (left).
    expect(buildTickRingPath(params)).toBe('M50 10L50 20' + 'M90 50L80 50' + 'M50 90L50 80' + 'M10 50L20 50');
  });

  it('is empty for no ticks', () => {
    expect(buildTickRingPath({ ...params, count: 0 })).toBe('');
  });
});
