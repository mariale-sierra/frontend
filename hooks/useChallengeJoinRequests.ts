import { useJoinRequests } from './useJoinRequests';
import { getChallengeJoinRequests } from '../services/challenge/challenge.service';
import type { ChallengeJoinRequestContract } from '../types/challenge';

/** A private challenge's pending join requests, for its owner — see `useJoinRequests`. */
export function useChallengeJoinRequests(challengeId: string | null) {
  return useJoinRequests<ChallengeJoinRequestContract>(challengeId, getChallengeJoinRequests);
}
