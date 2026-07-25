import api from '../../api';
import {
  acceptInvite,
  cancelInvite,
  createInvite,
  declineInvite,
  getPendingInvites,
  getReceivedInvites,
  getSentInvites,
} from '../invite.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('invite.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createInvite posts the challenge, recipient and trimmed message', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: '1' } });

    await createInvite('challenge-1', 'user-2', '  join us  ');

    expect(mockedApi.post).toHaveBeenCalledWith('/challenge-invites', {
      challengeId: 'challenge-1',
      recipientUserId: 'user-2',
      message: 'join us',
    });
  });

  it('createInvite omits the message field when empty', async () => {
    mockedApi.post.mockResolvedValue({ data: { id: '1' } });

    await createInvite('challenge-1', 'user-2', '   ');

    expect(mockedApi.post).toHaveBeenCalledWith('/challenge-invites', {
      challengeId: 'challenge-1',
      recipientUserId: 'user-2',
    });
  });

  it.each([
    ['received', getReceivedInvites, '/challenge-invites/received'],
    ['sent', getSentInvites, '/challenge-invites/sent'],
    ['pending', getPendingInvites, '/challenge-invites/pending'],
  ])('%s list hits the right endpoint and tolerates non-array payloads', async (_name, fn, url) => {
    mockedApi.get.mockResolvedValue({ data: { unexpected: true } });

    const result = await fn();

    expect(mockedApi.get).toHaveBeenCalledWith(url);
    expect(result).toEqual([]);
  });

  it.each([
    ['accept', acceptInvite, '/challenge-invites/9/accept'],
    ['decline', declineInvite, '/challenge-invites/9/decline'],
    ['cancel', cancelInvite, '/challenge-invites/9/cancel'],
  ])('%s posts to the invite action endpoint', async (_name, fn, url) => {
    mockedApi.post.mockResolvedValue({ data: { id: '9' } });

    const result = await fn('9');

    expect(mockedApi.post).toHaveBeenCalledWith(url);
    expect(result).toEqual({ id: '9' });
  });

  it('propagates API errors to the caller', async () => {
    mockedApi.post.mockRejectedValue(new Error('Network down'));

    await expect(acceptInvite('9')).rejects.toThrow('Network down');
  });
});
