import { useCallback, useEffect, useRef, useState } from 'react';
import {
  acceptInvite,
  cancelInvite,
  declineInvite,
  getReceivedInvites,
  getSentInvites,
} from '../services/invites/invite.service';
import { invalidateChallengeProgressCache } from './useChallengeProgress';
import type { ChallengeInviteContract } from '../types/invite';

export type InviteAction = 'accept' | 'decline' | 'cancel';

/**
 * Screen-level orchestration for the invitations screen: loads received and
 * sent invites, exposes accept/decline/cancel with a per-invite processing
 * flag (prevents double submission), and refreshes both lists after every
 * action. Accepting also invalidates the challenge progress cache so the
 * Challenges/Home tabs pick up the new membership without an app restart.
 */
export function useInvites() {
  const [received, setReceived] = useState<ChallengeInviteContract[]>([]);
  const [sent, setSent] = useState<ChallengeInviteContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (asRefresh = false) => {
    if (asRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);
    try {
      const [receivedInvites, sentInvites] = await Promise.all([
        getReceivedInvites(),
        getSentInvites(),
      ]);
      if (!mounted.current) return;
      setReceived(receivedInvites);
      setSent(sentInvites);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = useCallback(
    async (action: InviteAction, inviteId: string): Promise<boolean> => {
      if (processingId) return false; // an action is already in flight
      setProcessingId(inviteId);
      try {
        if (action === 'accept') {
          await acceptInvite(inviteId);
          // Membership changed — force the challenge tabs to refetch.
          invalidateChallengeProgressCache();
        } else if (action === 'decline') {
          await declineInvite(inviteId);
        } else {
          await cancelInvite(inviteId);
        }
        await load(true);
        return true;
      } catch {
        return false;
      } finally {
        if (mounted.current) setProcessingId(null);
      }
    },
    [processingId, load],
  );

  return {
    received,
    sent,
    loading,
    refreshing,
    error,
    processingId,
    refresh: () => load(true),
    reload: () => load(false),
    runAction,
  };
}
