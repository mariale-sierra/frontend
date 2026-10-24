import type { PhotoModerationStatus } from '../types/challenge';
import type { WorkoutLogContract } from '../types/workout-log';

/**
 * Where the photo of a just-logged day stands (Sprint 10, B2). Logging the day
 * and publishing its photo are two different things: the progress is saved the
 * moment POST /workout-logs/progress answers, while the photo goes through an
 * async review (workout_posts.moderation_status) and only then reaches anyone
 * else. Built from the server's own answer, never assumed from "the upload
 * finished".
 */
export interface PhotoReview {
  status: PhotoModerationStatus;
  /** Who can see it once approved; 'private' = only you, whatever the review says. */
  isPrivate: boolean;
}

const STATUSES: readonly PhotoModerationStatus[] = ['pending', 'approved', 'rejected'];

export function isPhotoModerationStatus(value: unknown): value is PhotoModerationStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

/** The review of the workout's evidence post, or null when the answer has no
 * post (a rest day) or no moderation status (an older API / database). */
export function photoReviewFromWorkout(workout: WorkoutLogContract | null | undefined): PhotoReview | null {
  const post = workout?.posts?.[0];
  if (!post || !isPhotoModerationStatus(post.moderationStatus)) return null;
  return { status: post.moderationStatus, isPrivate: post.visibility === 'private' };
}

/** i18n key (under `camera.photoStatus`) for the line that explains the photo's state. */
export function photoReviewMessageKey(review: PhotoReview): string {
  if (review.status === 'rejected') return 'camera.photoStatus.rejected';
  if (review.status === 'pending') return 'camera.photoStatus.pending';
  return review.isPrivate ? 'camera.photoStatus.approvedPrivate' : 'camera.photoStatus.approved';
}
