import { getSpaces } from '../services/spaces/spaces.service';
import type { SpaceContract } from '../types/space';
import { useFocusedResource } from './useFocusedResource';

const NO_SPACES: SpaceContract[] = [];

/** Every space (joined or to explore), refreshed in place on each focus. */
export function useSpaces() {
  const { data, loading, error, reload } = useFocusedResource('spaces', getSpaces, NO_SPACES);
  return { spaces: data, loading, error, reload };
}
