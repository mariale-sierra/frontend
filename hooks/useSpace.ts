import { getSpace } from '../services/spaces/spaces.service';
import type { SpaceContract } from '../types/space';
import { useFocusedResource } from './useFocusedResource';

/** One space. Re-focusing (back from Members/Manage/a profile) refreshes it
 * silently instead of flashing the preview skeleton over what is on screen. */
export function useSpace(spaceId: string | null) {
  const { data, loading, error, reload } = useFocusedResource<SpaceContract | null>(
    spaceId,
    () => getSpace(spaceId!),
    null,
  );
  return { space: data, loading, error, reload };
}
