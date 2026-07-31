import api from '../api';
import type { ChallengeInviteContract } from '../../types/invite';

/**
 * Challenge invites API. Mirrors backend module `challenge-invites`
 * (see Swagger tag "Challenge Invites"). All requests are authenticated via
 * the shared axios client interceptor.
 */

export async function createInvite(
  challengeId: string,
  recipientUserId: string,
  message?: string,
): Promise<ChallengeInviteContract> {
  const response = await api.post<ChallengeInviteContract>('/challenge-invites', {
    challengeId,
    recipientUserId,
    ...(message?.trim() ? { message: message.trim() } : {}),
  });
  return response.data;
}

export async function getReceivedInvites(): Promise<ChallengeInviteContract[]> {
  const response = await api.get<ChallengeInviteContract[]>('/challenge-invites/received');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getSentInvites(): Promise<ChallengeInviteContract[]> {
  const response = await api.get<ChallengeInviteContract[]>('/challenge-invites/sent');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getPendingInvites(): Promise<ChallengeInviteContract[]> {
  const response = await api.get<ChallengeInviteContract[]>('/challenge-invites/pending');
  return Array.isArray(response.data) ? response.data : [];
}

export async function acceptInvite(inviteId: string): Promise<ChallengeInviteContract> {
  const response = await api.post<ChallengeInviteContract>(
    `/challenge-invites/${inviteId}/accept`,
  );
  return response.data;
}

export async function declineInvite(inviteId: string): Promise<ChallengeInviteContract> {
  const response = await api.post<ChallengeInviteContract>(
    `/challenge-invites/${inviteId}/decline`,
  );
  return response.data;
}

export async function cancelInvite(inviteId: string): Promise<ChallengeInviteContract> {
  const response = await api.post<ChallengeInviteContract>(
    `/challenge-invites/${inviteId}/cancel`,
  );
  return response.data;
}
