import api from '../api';
import type { ChallengeContract } from '../../types/challenge';
import type {
  MyProfileContract,
  PublicProfileContract,
  UpdateProfilePayload,
  UserProfileContract,
} from '../../types/user';

type ChallengeListResponse = ChallengeContract[] | { data?: ChallengeContract[] };

export async function getMe() {
  const response = await api.get<UserProfileContract>('/users/me');
  return response.data;
}

/** Full editable profile of the session user (GET /users/me/profile). */
export async function getMyProfile(): Promise<MyProfileContract> {
  const response = await api.get<MyProfileContract>('/users/me/profile');
  return response.data;
}

/**
 * Partial profile update — only send the fields that changed. The backend
 * preserves everything else (PATCH semantics).
 */
export async function updateMyProfile(
  payload: UpdateProfilePayload,
): Promise<MyProfileContract> {
  const response = await api.patch<MyProfileContract>('/users/me/profile', payload);
  return response.data;
}

/**
 * Persists the public URL produced by the shared upload flow
 * (`uploadImageAsync` in services/uploads/upload.service.ts).
 */
export async function updateMyProfilePhoto(
  profileImageUrl: string,
): Promise<MyProfileContract> {
  const response = await api.patch<MyProfileContract>('/users/me/profile/photo', {
    profile_image_url: profileImageUrl,
  });
  return response.data;
}

/** Public profile of another user; the backend applies their privacy settings. */
export async function getPublicProfile(userId: string): Promise<PublicProfileContract> {
  const response = await api.get<PublicProfileContract>(`/users/${userId}/profile`);
  return response.data;
}

/** Username search used by the invite flow (max 20, never includes self). */
export async function searchUsers(query: string): Promise<PublicProfileContract[]> {
  const q = query.trim();
  if (!q) return [];
  const response = await api.get<PublicProfileContract[]>('/users/search', {
    params: { q },
  });
  return Array.isArray(response.data) ? response.data : [];
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