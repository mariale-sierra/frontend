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

export async function getTodayRoutineForChallenge(
  challengeId: string,
): Promise<TodayRoutineContract> {
  const response = await api.get(`/routine/today/${challengeId}`);
  return response.data;
}

export async function getPublicChallengePhotos(challengeId: string): Promise<ChallengePhoto[]> {
  const response = await api.get<ChallengePhoto[]>(`/workout-posts/challenge/${challengeId}`);
  return response.data;
}

/** Current user's own progress photos across all challenges (profile grid). */
export async function getMyProgressPhotos(): Promise<ChallengePhoto[]> {
  const response = await api.get<ChallengePhoto[]>('/workout-posts/mine');
  return response.data;
}