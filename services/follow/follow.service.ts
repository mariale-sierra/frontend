import api from '../api';
import type { FollowUserSummaryContract, FriendStreakContract } from '../../types/follow';

export async function followUser(userId: string): Promise<void> {
  await api.post(`/follows/${userId}`);
}

export async function unfollowUser(userId: string): Promise<void> {
  await api.delete(`/follows/${userId}`);
}

/** Users who actively follow the authenticated caller. */
export async function getFollowers(): Promise<FollowUserSummaryContract[]> {
  const response = await api.get<FollowUserSummaryContract[]>('/follows/followers');
  return Array.isArray(response.data) ? response.data : [];
}

/** Users the authenticated caller actively follows. */
export async function getFollowing(): Promise<FollowUserSummaryContract[]> {
  const response = await api.get<FollowUserSummaryContract[]>('/follows/following');
  return Array.isArray(response.data) ? response.data : [];
}

/** Current streak + "logged a workout today" for each actively-followed user (Home → Streaks today). */
export async function getFollowingStreaks(): Promise<FriendStreakContract[]> {
  const response = await api.get<FriendStreakContract[]>('/follows/following/streaks');
  return Array.isArray(response.data) ? response.data : [];
}
