import {
  activityTypeForCategoryCode,
  findCategoryForActivityType,
  getSpaceAccentColor,
  getSpaceMembershipCta,
} from '../spaceAdapter';
import { activityColors, colors } from '../../../constants/theme';
import type { SpaceContract } from '../../../types/space';

const baseSpace = (overrides: Partial<SpaceContract> = {}): SpaceContract => ({
  id: 'space-1',
  name: 'Girls running club',
  description: null,
  imageUrl: null,
  visibility: 'public',
  activityCategory: null,
  createdBy: { id: 'owner-1', username: 'owner', displayName: null, profileImageUrl: null },
  membersCount: 50,
  isMember: false,
  role: null,
  hasPendingRequest: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('activityTypeForCategoryCode', () => {
  it('maps every known exercise_categories.code to its ActivityType', () => {
    expect(activityTypeForCategoryCode('cardio_low')).toBe('cardioLow');
    expect(activityTypeForCategoryCode('mind_body')).toBe('mindBody');
    expect(activityTypeForCategoryCode('strength')).toBe('strength');
  });

  it('returns null for an unknown code instead of throwing', () => {
    expect(activityTypeForCategoryCode('not-a-real-category')).toBeNull();
  });
});

describe('findCategoryForActivityType', () => {
  const categories = [
    { id: 1, code: 'strength', name: 'Strength' },
    { id: 2, code: 'cardio_low', name: 'Cardio Low' },
  ];

  it('finds the real category row matching an ActivityType', () => {
    expect(findCategoryForActivityType(categories, 'cardioLow')).toEqual(categories[1]);
  });

  it('returns null when the category list has no match', () => {
    expect(findCategoryForActivityType(categories, 'functional')).toBeNull();
  });
});

describe('getSpaceAccentColor', () => {
  it('resolves the activity color for a space with a chosen category', () => {
    const space = baseSpace({ activityCategory: { id: 1, code: 'mind_body', name: 'Mind-Body' } });
    expect(getSpaceAccentColor(space)).toBe(activityColors.mindBody);
  });

  it('falls back to the neutral primary color when no category is set', () => {
    expect(getSpaceAccentColor(baseSpace())).toBe(colors.primary);
  });
});

describe('getSpaceMembershipCta', () => {
  it('is `owner` for the space owner, regardless of visibility', () => {
    expect(getSpaceMembershipCta(baseSpace({ role: 'owner', isMember: true }))).toEqual({ kind: 'owner' });
  });

  it('is `member` for an active non-owner member', () => {
    expect(getSpaceMembershipCta(baseSpace({ role: 'member', isMember: true }))).toEqual({ kind: 'member' });
  });

  it('is `pending` for a non-member with a pending request', () => {
    expect(getSpaceMembershipCta(baseSpace({ hasPendingRequest: true }))).toEqual({ kind: 'pending' });
  });

  it('is `join` for a non-member public space', () => {
    expect(getSpaceMembershipCta(baseSpace({ visibility: 'public' }))).toEqual({ kind: 'join' });
  });

  it('is `request` for a non-member private space', () => {
    expect(getSpaceMembershipCta(baseSpace({ visibility: 'private' }))).toEqual({ kind: 'request' });
  });

  it('prioritizes membership/pending state over visibility', () => {
    expect(
      getSpaceMembershipCta(baseSpace({ visibility: 'private', isMember: true, role: 'member' })),
    ).toEqual({ kind: 'member' });
  });
});
