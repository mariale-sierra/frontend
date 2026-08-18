import api from '../../api';
import { followUser, unfollowUser, getFollowers, getFollowing } from '../follow.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('follow.service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('followUser posts to /follows/:userId', async () => {
    mockedApi.post.mockResolvedValue({ data: { message: 'Now following user' } });

    await followUser('user-2');

    expect(mockedApi.post).toHaveBeenCalledWith('/follows/user-2');
  });

  it('unfollowUser deletes /follows/:userId', async () => {
    mockedApi.delete.mockResolvedValue({ data: { message: 'Unfollowed user successfully' } });

    await unfollowUser('user-2');

    expect(mockedApi.delete).toHaveBeenCalledWith('/follows/user-2');
  });

  it('getFollowers hits /follows/followers and returns the array as-is', async () => {
    const followers = [{ id: 'user-3', username: 'carol', followed_at: '2026-01-01T00:00:00.000Z' }];
    mockedApi.get.mockResolvedValue({ data: followers });

    const result = await getFollowers();

    expect(mockedApi.get).toHaveBeenCalledWith('/follows/followers');
    expect(result).toEqual(followers);
  });

  it('getFollowers tolerates a non-array payload', async () => {
    mockedApi.get.mockResolvedValue({ data: { unexpected: true } });

    const result = await getFollowers();

    expect(result).toEqual([]);
  });

  it('getFollowing hits /follows/following and returns the array as-is', async () => {
    const following = [{ id: 'user-4', username: 'dave', followed_at: '2026-01-02T00:00:00.000Z' }];
    mockedApi.get.mockResolvedValue({ data: following });

    const result = await getFollowing();

    expect(mockedApi.get).toHaveBeenCalledWith('/follows/following');
    expect(result).toEqual(following);
  });

  it('propagates API errors to the caller', async () => {
    mockedApi.post.mockRejectedValue(new Error('Network down'));

    await expect(followUser('user-2')).rejects.toThrow('Network down');
  });
});
