import api from '../api';
import type { ChallengeContract } from '../../types/challenge';
import type { UserProfileContract } from '../../types/user';

type ChallengeListResponse = ChallengeContract[] | { data?: ChallengeContract[] };

export async function getMe() {
  const response = await api.get<UserProfileContract>('/users/me');
  return response.data;
}

/**
 * Canonical source for the current user's enrolled challenges (`GET /users/me/challenges`).
 * The backend always returns them grouped by status (`{ active, completed, left }`), with
 * each challenge already carrying its own `status` field — this flattens the groups into a
 * single array so callers can filter/group client-side as needed (see `ChallengeContract.status`).
 */
export async function getMyChallenges(): Promise<ChallengeContract[]> {
  const res = await api.get('/users/me/challenges');
  const payload = res.data;

  const active = Array.isArray(payload?.active) ? payload.active : [];
  const completed = Array.isArray(payload?.completed) ? payload.completed : [];
  const left = Array.isArray(payload?.left) ? payload.left : [];

  return [...active, ...completed, ...left];
}