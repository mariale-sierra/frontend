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

  if (payload?.active && Array.isArray(payload.active)) {
    return payload.active;
  }

  return [];
}