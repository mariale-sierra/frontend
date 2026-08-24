import api from '../api';
import type {
  ChallengeContract,
  ChallengeParticipantContract,
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

type ChallengeUsersResponse =
  | ChallengeParticipantContract[]
  | {
      data?: ChallengeParticipantContract[];
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

/** Members of a challenge (id, username, role, status) — used for the active-progress header's avatar stack. */
export async function getChallengeUsers(challengeId: string): Promise<ChallengeParticipantContract[]> {
  const response = await api.get<ChallengeUsersResponse>(`/challenges/${challengeId}/users`);
  const payload = response.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
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

/**
 * Most recent visible progress photo for a challenge FROM ANY PARTICIPANT —
 * `WHERE wl.challenge_id = $1` server-side, no user filter at all. This is
 * the challenge-wide gallery's latest post, not "did the current user post
 * today." Do NOT use this to derive a challenge card's own state — that
 * shipped as a real bug once (a card stuck on "Train day" after the user
 * uploaded, because this endpoint isn't scoped to them). For "does the
 * current user have a photo for this challenge," use getMyProgressPhotos()
 * + challengeState.ts's groupLatestPhotoByChallengeId instead — one call,
 * genuinely user-scoped (`p.user_id = $1` server-side), already used by
 * Home and Challenges-Mine.
 */
export async function getLatestChallengePhoto(challengeId: string): Promise<ChallengePhoto | null> {
  const response = await api.get<ChallengePhoto | null>(`/workout-posts/challenge/${challengeId}/latest`);
  return response.data ?? null;
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