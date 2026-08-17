import { useCallback, useEffect, useRef, useState } from 'react';
import {
  followUser,
  getFollowers,
  getFollowing,
  unfollowUser,
} from '../services/follows/follow.service';
import type { FollowUserSummaryContract } from '../types/follow';

/**
 * Screen-level orchestration for followers/following: loads both lists,
 * exposes a follow/unfollow toggle with a per-user processing flag (prevents
 * double submission), and refreshes both lists after every action so a
 * follow-back is immediately reflected everywhere.
 */
export function useFollows() {
  const [followers, setFollowers] = useState<FollowUserSummaryContract[]>([]);
  const [following, setFollowing] = useState<FollowUserSummaryContract[]>([]);
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
      const [followersList, followingList] = await Promise.all([
        getFollowers(),
        getFollowing(),
      ]);
      if (!mounted.current) return;
      setFollowers(followersList);
      setFollowing(followingList);
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

  const isFollowing = useCallback(
    (userId: string) => following.some((user) => user.id === userId),
    [following],
  );

  const toggleFollow = useCallback(
    async (user: FollowUserSummaryContract): Promise<boolean> => {
      if (processingId) return false; // an action is already in flight
      setProcessingId(user.id);
      try {
        if (isFollowing(user.id)) {
          await unfollowUser(user.id);
        } else {
          await followUser(user.id);
        }
        await load(true);
        return true;
      } catch {
        return false;
      } finally {
        if (mounted.current) setProcessingId(null);
      }
    },
    [processingId, isFollowing, load],
  );

  return {
    followers,
    following,
    loading,
    refreshing,
    error,
    processingId,
    isFollowing,
    toggleFollow,
    refresh: () => load(true),
    reload: () => load(false),
  };
}
