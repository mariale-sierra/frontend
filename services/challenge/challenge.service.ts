import api from '../api';
import type {
  ChallengeContract,
  ChallengePhoto,
  ChallengeProgressContract,
  CreateChallengePayload,
  ProgressSubmissionRequest,
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

export async function getChallengeProgress() {
  const response = await api.get<ChallengeProgressContract | null>('/challenges/progress');
  return response.data;
}

export async function createChallengeProgress(data: ProgressSubmissionRequest) {
  const response = await api.post('/challenges/progress', data);
  return response.data;
}

export async function createChallenge(data: CreateChallengePayload) {
  const response = await api.post<ChallengeContract>('/challenges', data);
  return response.data;
}

export async function joinChallenge(id: string) {
  const response = await api.post<JoinChallengeResponse>(`/challenges/${id}/join`);
  return response.data;
}

export async function leaveChallenge(id: string) {
  const response = await api.post(`/challenges/${id}/leave`);
  return response.data;
}

export async function getUserEnrolledChallenges(): Promise<ChallengeContract[]> {
  const response = await api.get<ChallengeContract[] | { data?: ChallengeContract[] }>(
    '/users/me/challenges',
  );

  const payload = response.data;
  console.log('[getUserEnrolledChallenges] raw response', { status: response.status, data: payload });
  console.log('[getUserEnrolledChallenges] response.data', payload);
  console.log('[getUserEnrolledChallenges] typeof response.data', typeof payload, '| isArray:', Array.isArray(payload));

  let normalized: ChallengeContract[];
  if (Array.isArray(payload)) {
    normalized = payload;
  } else if (payload && Array.isArray((payload as { data?: ChallengeContract[] }).data)) {
    normalized = (payload as { data: ChallengeContract[] }).data;
  } else if (payload && Array.isArray((payload as { active?: ChallengeContract[] }).active)) {
    normalized = (payload as { active: ChallengeContract[] }).active;
  } else {
    console.warn('[getUserEnrolledChallenges] unexpected shape — returning []', payload);
    normalized = [];
  }

  console.log('[getUserEnrolledChallenges] normalized challenges', normalized);
  return normalized;
}

export async function getTodayRoutineForChallenge(
  challengeId: string,
): Promise<TodayRoutineContract> {
  const response = await api.get(`/routine/today/${challengeId}`);
  return response.data;
}

export async function getPublicChallengePhotos(challengeId: string): Promise<ChallengePhoto[]> {
  const response = await api.get<ChallengePhoto[]>(`/challenges/${challengeId}/photos/public`);
  return response.data;
}