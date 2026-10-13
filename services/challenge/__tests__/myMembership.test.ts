import { getMyMembership } from '../myMembership';
import { getMyChallengeJoinRequest } from '../challenge.service';
import { getMyChallenges } from '../../user/user.service';

jest.mock('../challenge.service', () => ({ getMyChallengeJoinRequest: jest.fn() }));
jest.mock('../../user/user.service', () => ({ getMyChallenges: jest.fn() }));

const enrolled = getMyChallenges as jest.Mock;
const pending = getMyChallengeJoinRequest as jest.Mock;

describe('getMyMembership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is joined when the challenge is among my challenges, and never asks about requests', async () => {
    enrolled.mockResolvedValue([{ id: 'ch-1', status: 'active' }]);

    await expect(getMyMembership({ id: 'ch-1', visibility: 'private' })).resolves.toBe('joined');
    expect(pending).not.toHaveBeenCalled();
  });

  it('is not joined any more after leaving it', async () => {
    enrolled.mockResolvedValue([{ id: 'ch-1', status: 'left' }]);

    await expect(getMyMembership({ id: 'ch-1', visibility: 'public' })).resolves.toBe('none');
  });

  // Regression (INC-02): reopening a private challenge offered Join again,
  // which the backend answered with 409 — the pending request now comes back.
  it('is requested when a private challenge has my request pending', async () => {
    enrolled.mockResolvedValue([]);
    pending.mockResolvedValue({ hasPendingRequest: true });

    await expect(getMyMembership({ id: 'ch-1', visibility: 'private' })).resolves.toBe('requested');
    expect(pending).toHaveBeenCalledWith('ch-1');
  });

  it('is none for a private challenge without a pending request', async () => {
    enrolled.mockResolvedValue([]);
    pending.mockResolvedValue({ hasPendingRequest: false });

    await expect(getMyMembership({ id: 'ch-1', visibility: 'private' })).resolves.toBe('none');
  });

  it('does not ask about requests for a public challenge: there are none', async () => {
    enrolled.mockResolvedValue([]);

    await expect(getMyMembership({ id: 'ch-1', visibility: 'public' })).resolves.toBe('none');
    expect(pending).not.toHaveBeenCalled();
  });
});
