import api from '../api';
import type { BadgeContract } from '../../types/badge';

/** The session user's badges (always the full list). */
export async function getMyBadges(): Promise<BadgeContract[]> {
  const response = await api.get<BadgeContract[]>('/badges/me');
  return response.data;
}

/**
 * Another user's badges. The backend applies their privacy: on a private
 * profile a non-follower gets an empty list.
 */
export async function getUserBadges(userId: string): Promise<BadgeContract[]> {
  const response = await api.get<BadgeContract[]>(`/badges/user/${userId}`);
  return response.data;
}
