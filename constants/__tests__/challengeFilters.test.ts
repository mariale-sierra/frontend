import { CATEGORY_CODE_TO_ACTIVITY, activityTypeForCategoryCode, normalizeCategoryCode } from '../challengeFilters';

describe('normalizeCategoryCode', () => {
  it('converts hyphens to the canonical underscored form', () => {
    expect(normalizeCategoryCode('cardio-intense')).toBe('cardio_intense');
    expect(normalizeCategoryCode('cardio-low')).toBe('cardio_low');
    expect(normalizeCategoryCode('mind-body')).toBe('mind_body');
  });

  it('leaves an already-underscored (canonical, live) code alone', () => {
    for (const code of ['strength', 'cardio_intense', 'cardio_low', 'flexibility', 'mind_body', 'functional']) {
      expect(normalizeCategoryCode(code)).toBe(code);
    }
  });
});

describe('CATEGORY_CODE_TO_ACTIVITY', () => {
  // The actual, confirmed-live convention (2026-09-21, verified directly
  // against GET /exercises/categories and every exercise's own
  // category.code) — an earlier version of this map had this backwards.
  it('is keyed by the canonical underscored codes, not hyphenated ones', () => {
    expect(CATEGORY_CODE_TO_ACTIVITY.cardio_intense).toBe('cardioIntense');
    expect(CATEGORY_CODE_TO_ACTIVITY.cardio_low).toBe('cardioLow');
    expect(CATEGORY_CODE_TO_ACTIVITY.mind_body).toBe('mindBody');
    expect(CATEGORY_CODE_TO_ACTIVITY['cardio-intense']).toBeUndefined();
  });
});

describe('activityTypeForCategoryCode', () => {
  it('resolves every real category code to its ActivityType', () => {
    expect(activityTypeForCategoryCode('strength')).toBe('strength');
    expect(activityTypeForCategoryCode('cardio_intense')).toBe('cardioIntense');
    expect(activityTypeForCategoryCode('cardio_low')).toBe('cardioLow');
    expect(activityTypeForCategoryCode('flexibility')).toBe('flexibility');
    expect(activityTypeForCategoryCode('mind_body')).toBe('mindBody');
    expect(activityTypeForCategoryCode('functional')).toBe('functional');
  });

  // The actual regression this guards: a stair-climber's real category.code
  // ('cardio_intense') and a bench-ankle-stretch's ('mind_body') both used to
  // miss the old hyphenated map entirely, resolving to `undefined` — which is
  // what let their accent color silently fall back to the neutral "paper"
  // background instead of a real activity color.
  it('still resolves a stray legacy hyphenated code — defensive, not required for the live catalog', () => {
    expect(activityTypeForCategoryCode('cardio-intense')).toBe('cardioIntense');
    expect(activityTypeForCategoryCode('cardio-low')).toBe('cardioLow');
    expect(activityTypeForCategoryCode('mind-body')).toBe('mindBody');
  });

  it('returns undefined for an unrecognized code, and for null/undefined/empty input', () => {
    expect(activityTypeForCategoryCode('not-a-real-category')).toBeUndefined();
    expect(activityTypeForCategoryCode(null)).toBeUndefined();
    expect(activityTypeForCategoryCode(undefined)).toBeUndefined();
    expect(activityTypeForCategoryCode('')).toBeUndefined();
  });
});
