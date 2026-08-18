import { useEffect, useState } from 'react';
import { getChallengeUsers } from '../services/challenge/challenge.service';
import type { ChallengeParticipantContract } from '../types/challenge';

export function useChallengeParticipants(challengeId: string | null) {
  const [participants, setParticipants] = useState<ChallengeParticipantContract[]>([]);
  const [loading, setLoading] = useState(challengeId != null);

  useEffect(() => {
    if (!challengeId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getChallengeUsers(challengeId)
      .then((data) => {
        // Someone who left is no longer really "in" the challenge — same
        // status check used to decide membership elsewhere (e.g. the
        // enrolled-challenges filter in app/challenge/[id]/index.tsx).
        if (!cancelled) setParticipants(data.filter((user) => user.status !== 'left'));
      })
      .catch(() => {
        if (!cancelled) setParticipants([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  return { participants, loading };
}
