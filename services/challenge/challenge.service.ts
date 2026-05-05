import api from '../api';
import type {
  ChallengeContract,
  CreateChallengePayload,
  JoinChallengeResponse,
} from '../../types/challenge';

type ChallengesListResponse =
  | ChallengeContract[]
  | {
      data?: ChallengeContract[];
      message?: string;
    };

export async function getChallenges() {
  const response = await api.get<ChallengesListResponse>('/challenges');
  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
}

export async function getChallenge(id: string) {
  const response = await api.get<ChallengeContract>(`/challenges/${id}`);
  return response.data;
}

export async function createChallenge(data: CreateChallengePayload) {
  const response = await api.post<ChallengeContract>('/challenges', data);
  return response.data;
}

export async function joinChallenge(id: number) {
  const response = await api.post<JoinChallengeResponse>(`/challenges/${id}/join`);
  return response.data;
}