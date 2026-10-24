import { isPhotoModerationStatus, photoReviewFromWorkout, photoReviewMessageKey } from '../photoModeration';

describe('photoReviewFromWorkout (B2: the photo state comes from the server answer)', () => {
  it('reads the moderation status and visibility of the saved post', () => {
    expect(
      photoReviewFromWorkout({ id: 1, posts: [{ id: 'p1', moderationStatus: 'pending', visibility: 'followers' }] }),
    ).toEqual({ status: 'pending', isPrivate: false });
  });

  it('marks a private post as private', () => {
    expect(
      photoReviewFromWorkout({ id: 1, posts: [{ id: 'p1', moderationStatus: 'approved', visibility: 'private' }] }),
    ).toEqual({ status: 'approved', isPrivate: true });
  });

  it('returns null for a rest day (no post) instead of inventing a state', () => {
    expect(photoReviewFromWorkout({ id: 1, posts: [] })).toBeNull();
    expect(photoReviewFromWorkout({ id: 1 })).toBeNull();
    expect(photoReviewFromWorkout(null)).toBeNull();
  });

  it('returns null when the API sends no (or an unknown) status, never assuming "published"', () => {
    expect(photoReviewFromWorkout({ id: 1, posts: [{ id: 'p1' }] })).toBeNull();
    expect(photoReviewFromWorkout({ id: 1, posts: [{ id: 'p1', moderationStatus: 'weird' as never }] })).toBeNull();
  });
});

describe('photoReviewMessageKey', () => {
  it.each([
    [{ status: 'pending', isPrivate: false }, 'camera.photoStatus.pending'],
    [{ status: 'pending', isPrivate: true }, 'camera.photoStatus.pending'],
    [{ status: 'approved', isPrivate: false }, 'camera.photoStatus.approved'],
    [{ status: 'approved', isPrivate: true }, 'camera.photoStatus.approvedPrivate'],
    [{ status: 'rejected', isPrivate: false }, 'camera.photoStatus.rejected'],
  ] as const)('%o -> %s', (review, key) => {
    expect(photoReviewMessageKey(review)).toBe(key);
  });
});

describe('isPhotoModerationStatus', () => {
  it('accepts only the three real statuses', () => {
    expect(['pending', 'approved', 'rejected'].every(isPhotoModerationStatus)).toBe(true);
    expect(isPhotoModerationStatus('published')).toBe(false);
    expect(isPhotoModerationStatus(undefined)).toBe(false);
  });
});
