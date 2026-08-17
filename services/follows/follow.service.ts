import api from '../api';
import type { FollowUserSummaryContract } from '../../types/follow';

/**
 * Followers API. Mirrors backend module `follows` (see Swagger tag "Follows").
 * Following is direct/open — there is no request-approval step: POST follows
 * immediately, DELETE unfollows immediately.
 */

export async function getFollowers(): Promise<FollowUserSummaryContract[]> {
  const response = await api.get<FollowUserSummaryContract[]>('/follows/followers');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getFollowing(): Promise<FollowUserSummaryContract[]> {
  const response = await api.get<FollowUserSummaryContract[]>('/follows/following');
  return Array.isArray(response.data) ? response.data : [];
}

export async function followUser(userId: string): Promise<void> {
  await api.post(`/follows/${userId}`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/follows/${userId}`);
}
