import { getMyChallengeJoinRequest } from './challenge.service';
import { loadMyChallenges } from '../cache/loaders';
import type { ChallengeContract } from '../../types/challenge';

export type MyMembership = 'joined' | 'requested' | 'none';

/**
 * Where the session user stands with a challenge: in it (enrolled and not
 * left — the same check both challenge screens already used), waiting for the
 * owner to answer a request to join a private one, or neither. The pending
 * request comes from the backend, so it survives leaving and reopening the
 * screen instead of offering Join again (which the backend answers with 409).
 */
export async function getMyMembership(challenge: Pick<ChallengeContract, 'id' | 'visibility'>): Promise<MyMembership> {
  const enrolled = await loadMyChallenges();
  const isMember = enrolled.some((c) => String(c.id) === String(challenge.id) && c.status !== 'left');
  if (isMember) return 'joined';
  if (challenge.visibility !== 'private') return 'none';

  const { hasPendingRequest } = await getMyChallengeJoinRequest(String(challenge.id));
  return hasPendingRequest ? 'requested' : 'none';
}
