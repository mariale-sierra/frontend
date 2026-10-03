import { useJoinRequests } from './useJoinRequests';
import { getSpaceJoinRequests } from '../services/spaces/spaces.service';
import type { SpaceJoinRequestContract } from '../types/space';

/** A private Space's pending join requests (Chats-47E) — see `useJoinRequests`. */
export function useSpaceJoinRequests(spaceId: string | null) {
  return useJoinRequests<SpaceJoinRequestContract>(spaceId, getSpaceJoinRequests);
}
