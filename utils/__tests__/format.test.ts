import { formatCount, toTitleCase } from '../format';

describe('formatCount', () => {
  it('returns small numbers as-is', () => {
    expect(formatCount(860)).toBe('860');
    expect(formatCount(0)).toBe('0');
  });

  it('formats thousands with a "k" suffix, dropping a trailing .0', () => {
    expect(formatCount(1200)).toBe('1.2k');
    expect(formatCount(2000)).toBe('2k');
  });
});

describe('toTitleCase', () => {
  // The actual bug this fixes: the shared exercise-library catalog stores
  // names in all caps ("HIP THRUST"), which read as broken/unstyled text
  // against the Routine-Detail wireframe's plain-case design.
  it('converts an all-caps string to Title Case', () => {
    expect(toTitleCase('HIP THRUST')).toBe('Hip Thrust');
    expect(toTitleCase('BULGARIAN SPLIT SQUAT')).toBe('Bulgarian Split Squat');
  });

  it('leaves a string with any lowercase letter untouched, including one with an intentional acronym', () => {
    expect(toTitleCase('Zone 2 run')).toBe('Zone 2 run');
    expect(toTitleCase('VO2 max intervals')).toBe('VO2 max intervals');
  });

  it('is idempotent on an already-correctly-cased name', () => {
    expect(toTitleCase(toTitleCase('HIP THRUST'))).toBe('Hip Thrust');
  });

  it('handles accented characters', () => {
    expect(toTitleCase('SENTADILLA BÚLGARA')).toBe('Sentadilla Búlgara');
  });
});
