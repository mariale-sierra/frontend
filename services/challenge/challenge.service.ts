import api from '../api';
import type {
  ChallengeContract,
  ChallengePhoto,
  ChallengeProgressContract,
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

export async function getChallengeProgress(challengeId?: string) {
  const response = await api.get<ChallengeProgressContract | null>('/challenges/progress', {
    params: challengeId ? { challengeId } : undefined,
  });
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

export interface UserPostsPage {
  photos: ChallengePhoto[];
  /** Opaque cursor for the next page, absent on the last page. */
  nextCursor?: string;
}

/**
 * :userId's progress photos across all challenges (another user's profile
 * grid), cursor-paginated. The backend applies its own visibility rules
 * (public always, 'followers'-visibility only if the caller follows them).
 */
export async function getUserPosts(userId: string, cursor?: string): Promise<UserPostsPage> {
  const response = await api.get<ChallengePhoto[]>(`/workout-posts/user/${userId}`, {
    params: cursor ? { cursor } : undefined,
  });
  return {
    photos: Array.isArray(response.data) ? response.data : [],
    nextCursor: response.headers['x-next-cursor'] as string | undefined,
  };
}