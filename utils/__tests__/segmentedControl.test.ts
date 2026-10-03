import { getSegmentGeometry } from '../segmentedControl';

describe('getSegmentGeometry', () => {
  it('splits the space inside the padding evenly, leaving the gaps between segments', () => {
    // 200 wide, 4px padding each side, 4px gap, 2 segments -> (200 - 8 - 4) / 2 = 94 each.
    const { segmentWidth, step } = getSegmentGeometry(200, 2, 4, 4);
    expect(segmentWidth).toBe(94);
    // The chip moves one segment plus one gap per step.
    expect(step).toBe(98);
  });

  it('handles more than two segments', () => {
    // 300 wide, 6px padding, 6px gap, 3 segments -> (300 - 12 - 12) / 3 = 92.
    const { segmentWidth, step } = getSegmentGeometry(300, 3, 6, 6);
    expect(segmentWidth).toBe(92);
    expect(step).toBe(98);
  });

  it('is a single full-width segment with no gap when there is only one', () => {
    const { segmentWidth, step } = getSegmentGeometry(100, 1, 4, 4);
    expect(segmentWidth).toBe(92);
    expect(step).toBe(96);
  });

  it('returns zeros before the track has been measured', () => {
    expect(getSegmentGeometry(0, 2, 4, 4)).toEqual({ segmentWidth: 0, step: 0 });
  });

  it('returns zeros with no segments', () => {
    expect(getSegmentGeometry(200, 0, 4, 4)).toEqual({ segmentWidth: 0, step: 0 });
  });

  it('never returns a negative width for a track too small for its padding', () => {
    expect(getSegmentGeometry(10, 2, 8, 8).segmentWidth).toBe(0);
  });
});
