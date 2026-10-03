import { PRACTICE_OPTIONS, MAX_PRACTICE_PREFERENCES, getPracticeOption } from '../practiceOptions';
import type { ActivityType } from '../../types/activity';

const ALL_ACTIVITY_TYPES: ActivityType[] = [
  'strength',
  'cardioIntense',
  'cardioLow',
  'flexibility',
  'mindBody',
  'functional',
];

describe('PRACTICE_OPTIONS', () => {
  it('has no duplicate values', () => {
    const values = PRACTICE_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  // Real bug already found and fixed once at the exercise-catalog level
  // (havit-design-system-SKILL.md) — a category/type with zero real members
  // is confusing and pointless. Every activity color must have at least one
  // practice using it here too.
  it('covers every ActivityType at least once, so no badge color goes unused', () => {
    const usedTypes = new Set(PRACTICE_OPTIONS.map((option) => option.activityType));
    for (const type of ALL_ACTIVITY_TYPES) {
      expect(usedTypes.has(type)).toBe(true);
    }
  });

  it('only uses real ActivityType values', () => {
    for (const option of PRACTICE_OPTIONS) {
      expect(ALL_ACTIVITY_TYPES).toContain(option.activityType);
    }
  });
});

describe('getPracticeOption', () => {
  it('resolves a known practice by value', () => {
    expect(getPracticeOption('Yoga')).toEqual({
      label: 'Yoga',
      value: 'Yoga',
      activityType: 'mindBody',
    });
  });

  it('returns null for a value no longer in the list, rather than throwing', () => {
    expect(getPracticeOption('Underwater Basket Weaving')).toBeNull();
  });
});

describe('MAX_PRACTICE_PREFERENCES', () => {
  it('is 6, matching the mockup badge row and the backend cap', () => {
    expect(MAX_PRACTICE_PREFERENCES).toBe(6);
  });
});
