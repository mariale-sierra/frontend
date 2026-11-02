import { useFocusedResource } from './useFocusedResource';

const NO_REQUESTS: never[] = [];

/**
 * The pending join requests of a private Space or challenge, refreshed every time the
 * screen is focused (so coming back from answering one shows the rest). Owner-only, so
 * only ever called by the owner's screens. Give `id` as `null` for none (nothing is
 * fetched and it is not loading).
 *
 * The one hook behind `useSpaceJoinRequests` and `useChallengeJoinRequests`, which were
 * the same hook twice.
 */
export function useJoinRequests<T>(id: string | null, fetchRequests: (id: string) => Promise<T[]>) {
  const { data, loading, error, reload } = useFocusedResource<T[]>(id, () => fetchRequests(id!), NO_REQUESTS);
  return { requests: data, loading, error, reload };
}
