import api from '../api';
import type {
  CreateSpacePayload,
  JoinSpaceResultContract,
  SpaceContract,
  SpaceJoinRequestContract,
  SpaceMemberContract,
  UpdateSpacePayload,
} from '../../types/space';

export async function getSpaces(): Promise<SpaceContract[]> {
  const response = await api.get<SpaceContract[]>('/spaces');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getSpace(spaceId: string): Promise<SpaceContract> {
  const response = await api.get<SpaceContract>(`/spaces/${spaceId}`);
  return response.data;
}

export async function createSpace(payload: CreateSpacePayload): Promise<SpaceContract> {
  const response = await api.post<SpaceContract>('/spaces', payload);
  return response.data;
}

export async function updateSpace(
  spaceId: string,
  payload: UpdateSpacePayload,
): Promise<SpaceContract> {
  const response = await api.patch<SpaceContract>(`/spaces/${spaceId}`, payload);
  return response.data;
}

export async function deleteSpace(spaceId: string): Promise<void> {
  await api.delete(`/spaces/${spaceId}`);
}

export async function joinSpace(spaceId: string): Promise<JoinSpaceResultContract> {
  const response = await api.post<JoinSpaceResultContract>(`/spaces/${spaceId}/join`);
  return response.data;
}

export async function leaveSpace(spaceId: string): Promise<void> {
  await api.delete(`/spaces/${spaceId}/leave`);
}

export async function getSpaceMembers(spaceId: string): Promise<SpaceMemberContract[]> {
  const response = await api.get<SpaceMemberContract[]>(`/spaces/${spaceId}/members`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function getSpaceJoinRequests(spaceId: string): Promise<SpaceJoinRequestContract[]> {
  const response = await api.get<SpaceJoinRequestContract[]>(`/spaces/${spaceId}/join-requests`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function approveSpaceJoinRequest(
  spaceId: string,
  requestId: string,
): Promise<SpaceJoinRequestContract> {
  const response = await api.post<SpaceJoinRequestContract>(
    `/spaces/${spaceId}/join-requests/${requestId}/approve`,
  );
  return response.data;
}

export async function rejectSpaceJoinRequest(
  spaceId: string,
  requestId: string,
): Promise<SpaceJoinRequestContract> {
  const response = await api.post<SpaceJoinRequestContract>(
    `/spaces/${spaceId}/join-requests/${requestId}/reject`,
  );
  return response.data;
}
