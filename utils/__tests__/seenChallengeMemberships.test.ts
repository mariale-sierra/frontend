import { storage } from '../storage';
import {
  establishMembershipBaseline,
  hasEstablishedMembershipBaseline,
  hasSeenChallengeMembership,
  markChallengeMembershipSeen,
  resetSeenChallengeMembershipsCache,
} from '../seenChallengeMemberships';

jest.mock('../storage', () => ({
  storage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const getItem = storage.getItem as jest.Mock;
const setItem = storage.setItem as jest.Mock;

describe('seen challenge memberships', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSeenChallengeMembershipsCache();
    getItem.mockResolvedValue(null);
    setItem.mockResolvedValue(undefined);
  });

  describe('hasSeenChallengeMembership / markChallengeMembershipSeen', () => {
    it('starts with nothing seen', async () => {
      expect(await hasSeenChallengeMembership('a')).toBe(false);
    });

    it('remembers a membership marked seen, and keeps it in storage', async () => {
      await markChallengeMembershipSeen('a');

      expect(await hasSeenChallengeMembership('a')).toBe(true);
      expect(await hasSeenChallengeMembership('b')).toBe(false);
      expect(setItem).toHaveBeenCalledWith('seen_challenge_memberships', JSON.stringify(['a']));
    });

    it('keeps adding to what is already stored, across launches', async () => {
      getItem.mockResolvedValue(JSON.stringify(['old']));

      await markChallengeMembershipSeen('new');

      expect(await hasSeenChallengeMembership('old')).toBe(true);
      expect(setItem).toHaveBeenCalledWith('seen_challenge_memberships', JSON.stringify(['old', 'new']));
    });

    it('treats a corrupt stored value as nothing seen, not a crash', async () => {
      getItem.mockResolvedValue('not json{');

      expect(await hasSeenChallengeMembership('a')).toBe(false);
    });

    it('treats storage failing to read as nothing seen, and to write as harmless', async () => {
      getItem.mockRejectedValue(new Error('disk'));
      setItem.mockRejectedValue(new Error('disk'));

      await expect(markChallengeMembershipSeen('a')).resolves.toBeUndefined();
      expect(await hasSeenChallengeMembership('a')).toBe(true);
    });
  });

  // The whole point of the baseline: the very first time this ever runs on
  // a device (fresh install, or the first launch after this feature
  // shipped), every currently-enrolled challenge is a PRE-EXISTING
  // membership, not a brand new approval — it must never look "new."
  describe('establishMembershipBaseline / hasEstablishedMembershipBaseline', () => {
    it('has no baseline established yet by default', async () => {
      expect(await hasEstablishedMembershipBaseline()).toBe(false);
    });

    it('marks every given challenge seen, and records the baseline as established', async () => {
      await establishMembershipBaseline(['a', 'b']);

      expect(await hasSeenChallengeMembership('a')).toBe(true);
      expect(await hasSeenChallengeMembership('b')).toBe(true);
      expect(setItem).toHaveBeenCalledWith('seen_challenge_memberships_baseline_established', 'true');
    });

    it('reflects the baseline flag once it has been read back from storage', async () => {
      getItem.mockImplementation((key: string) =>
        Promise.resolve(key === 'seen_challenge_memberships_baseline_established' ? 'true' : null),
      );

      expect(await hasEstablishedMembershipBaseline()).toBe(true);
    });

    it('an empty baseline (no current memberships) still records the baseline flag — nothing left to silently pop later', async () => {
      await establishMembershipBaseline([]);

      expect(setItem).toHaveBeenCalledWith('seen_challenge_memberships_baseline_established', 'true');
    });
  });
});
