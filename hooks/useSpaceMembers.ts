import { getSpaceMembers } from '../services/spaces/spaces.service';
import type { SpaceMemberContract } from '../types/space';
import { useFocusedResource } from './useFocusedResource';

const NO_MEMBERS: SpaceMemberContract[] = [];

export function useSpaceMembers(spaceId: string | null) {
  const { data, loading, error, reload } = useFocusedResource(spaceId, () => getSpaceMembers(spaceId!), NO_MEMBERS);
  return { members: data, loading, error, reload };
}
