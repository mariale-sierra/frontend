import { fetchQuery } from './queryCache';
import { queryKeys, staleTimes } from './queries';
import { getChallenges } from '../challenge/challenge.service';
import { getMyChallenges, getMyProfile } from '../user/user.service';

// Imperative reads through the shared cache, for code that needs the data once
// (a picker, a membership check, an edit form) rather than a hook subscription.
// Same keys and freshness as the screens' useCachedQuery calls.
/** GET /users/me/challenges through the cache, for imperative callers (pickers, membership checks). */
export function loadMyChallenges(options: { force?: boolean } = {}) {
  return fetchQuery(queryKeys.myChallenges, getMyChallenges, {
    staleTime: staleTimes.activity,
    persist: true,
    ...options,
  });
}

/** Every challenge (GET /challenges, all pages) through the cache. */
export function loadAllChallenges(options: { force?: boolean } = {}) {
  return fetchQuery(queryKeys.allChallenges, getChallenges, {
    staleTime: staleTimes.catalog,
    persist: true,
    ...options,
  });
}

/** GET /users/me/profile through the cache (the edit screens open on what the Profile tab already has). */
export function loadMyProfile(options: { force?: boolean } = {}) {
  return fetchQuery(queryKeys.myProfile, getMyProfile, {
    staleTime: staleTimes.catalog,
    persist: true,
    ...options,
  });
}
