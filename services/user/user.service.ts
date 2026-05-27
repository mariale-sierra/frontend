import api from '../api';
import type { ChallengeContract } from '../../types/challenge';
import type { UserProfileContract } from '../../types/user';

type ChallengeListResponse = ChallengeContract[] | { data?: ChallengeContract[] };

export async function getMe() {
  const response = await api.get<UserProfileContract>('/users/me');
  return response.data;
}

export async function getMyChallenges(): Promise<ChallengeContract[]> {
  const res = await api.get('/users/me/challenges');
  const payload = res.data;

  console.log('MY CHALLENGES RAW', payload);

  // The API returns grouped challenges by status { active: [], completed: [], left: [] }
  // Flatten them so callers receive a simple array of challenges with `status` set.
  const active = Array.isArray(payload?.active) ? payload.active : [];
  const completed = Array.isArray(payload?.completed) ? payload.completed : [];
  const left = Array.isArray(payload?.left) ? payload.left : [];

  return [...active, ...completed, ...left];
}