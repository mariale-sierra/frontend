import { normalizeLocationCode, pickExerciseIdByName } from '../exerciseAdapter';

describe('pickExerciseIdByName', () => {
  const rows = [
    { id: 1, name: 'Squat' },
    { id: 2, name: 'Front Squat' },
    { id: 3, name: 'Goblet Squat' },
  ];

  it('picks the row with the exact name, not one that merely contains it', () => {
    expect(pickExerciseIdByName(rows, 'Squat')).toBe(1);
    expect(pickExerciseIdByName(rows, 'Front Squat')).toBe(2);
  });

  it('ignores case and spaces at the ends — a routine carries the catalog name in capitals', () => {
    expect(pickExerciseIdByName(rows, 'FRONT SQUAT')).toBe(2);
    expect(pickExerciseIdByName(rows, '  goblet squat ')).toBe(3);
  });

  it('takes the only row there is when nothing matches exactly (a renamed or translated exercise)', () => {
    expect(pickExerciseIdByName([{ id: 9, name: 'Sentadilla' }], 'Squat')).toBe(9);
  });

  it('gives up rather than guess when several rows are left and none matches', () => {
    expect(pickExerciseIdByName(rows, 'Pistol Squat')).toBeNull();
  });

  it('is null when the search found nothing', () => {
    expect(pickExerciseIdByName([], 'Squat')).toBeNull();
  });
});

describe('normalizeLocationCode', () => {
  it("maps the live catalog's 'cualquier-lugar' to the 'anywhere' the UI knows", () => {
    expect(normalizeLocationCode('cualquier-lugar')).toBe('anywhere');
  });

  it('leaves every other location alone', () => {
    for (const code of ['gym', 'home', 'outdoor', 'studio', 'anywhere']) {
      expect(normalizeLocationCode(code)).toBe(code);
    }
  });
});

// normalizeCategoryCode moved to constants/challengeFilters.ts (and its
// direction fixed — see constants/__tests__/challengeFilters.test.ts).
