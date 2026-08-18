import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { followUser, unfollowUser } from '../services/follow/follow.service';
import { useErrorNotificationStore } from '../store/errorNotificationStore';

/**
 * Follow/unfollow toggle for a single target user. Optimistic (flips
 * immediately, rolls back on failure) so the button never feels laggy;
 * `followersDelta` lets a caller keep a nearby counter in sync without a
 * full profile refetch.
 */
export function useFollowUser(userId: string, initialIsFollowing: boolean) {
  const { t } = useTranslation();
  const { show } = useErrorNotificationStore();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersDelta, setFollowersDelta] = useState(0);
  const [pending, setPending] = useState(false);
  const lastUserId = useRef(userId);

  // Re-sync from fresh server data when the target user changes (or the
  // caller reloads the profile) — but never clobber an in-flight optimistic
  // toggle for the same user.
  useEffect(() => {
    if (lastUserId.current !== userId) {
      lastUserId.current = userId;
      setIsFollowing(initialIsFollowing);
      setFollowersDelta(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /** Resolves to the confirmed follow state once the request settles (the
   * pre-toggle state again if the request failed and was rolled back). */
  const toggle = useCallback(async (): Promise<boolean> => {
    if (pending) return isFollowing;
    const wasFollowing = isFollowing;
    const next = !wasFollowing;
    setIsFollowing(next);
    setFollowersDelta((d) => d + (next ? 1 : -1));
    setPending(true);
    try {
      if (next) {
        await followUser(userId);
      } else {
        await unfollowUser(userId);
      }
      return next;
    } catch {
      setIsFollowing(wasFollowing);
      setFollowersDelta((d) => d + (next ? -1 : 1));
      show({
        message: next ? t('profile.followError') : t('profile.unfollowError'),
      });
      return wasFollowing;
    } finally {
      setPending(false);
    }
  }, [isFollowing, pending, userId, show, t]);

  return { isFollowing, followersDelta, pending, toggle };
}
