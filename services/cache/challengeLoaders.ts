import { fetchQuery } from './queryCache';
import { queryKeys, staleTimes } from './queries';
import { getChallenge, getChallenges, getMyProgressPhotos } from '../challenge/challenge.service';

// Challenge reads through the shared cache, kept apart from loaders.ts so a
// module that only needs challenge data doesn't also load the user service.

/** Every challenge (GET /challenges, all pages) through the cache. */
export function loadAllChallenges(options: { force?: boolean } = {}) {
  return fetchQuery(queryKeys.allChallenges, getChallenges, {
    staleTime: staleTimes.catalog,
    persist: true,
    ...options,
  });
}

/** One challenge (GET /challenges/:id) through the cache: moving between its
 * info, progress, routine, members and manage screens asks for it once. */
export function loadChallenge(challengeId: string, options: { force?: boolean } = {}) {
  return fetchQuery(queryKeys.challenge(challengeId), () => getChallenge(challengeId), {
    staleTime: staleTimes.activity,
    ...options,
  });
}

/** The user's own photos (GET /workout-posts/mine — the whole history), shared with Home and Challenges. */
export function loadMyPhotos(options: { force?: boolean } = {}) {
  return fetchQuery(queryKeys.myPhotos, getMyProgressPhotos, {
    staleTime: staleTimes.activity,
    persist: true,
    ...options,
  });
}
