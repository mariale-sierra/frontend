import api from '../api';
import type {
  ChallengeContract,
  CreateChallengePayload,
  JoinChallengeResponse,
  TodayRoutineContract,
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

// Returns challenges the authenticated user is currently enrolled in.
// Endpoint: GET /challenges/enrolled
export async function getUserEnrolledChallenges(): Promise<ChallengeContract[]> {
  const response = await api.get<ChallengeContract[] | { data?: ChallengeContract[] }>(
    '/challenges/enrolled',
  );
  const payload = response.data;
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

// Returns the routine assigned for today based on the user's cycle-day progress in the challenge.
// Endpoint: GET /challenges/:challengeId/today-routine
export async function getTodayRoutineForChallenge(
  challengeId: string,
): Promise<TodayRoutineContract> {
  const response = await api.get<TodayRoutineContract>(
    `/challenges/${challengeId}/today-routine`,
  );
  return response.data;
}