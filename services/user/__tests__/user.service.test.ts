import api from '../../api';
import {
  banUser,
  getMe,
  getMyChallenges,
  getMyProfile,
  getPublicProfile,
  listBannedUsers,
  searchUsers,
  unbanUser,
  updateMyProfile,
  updateMyProfilePhoto,
} from '../user.service';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
}));

const get = api.get as jest.Mock;
const patch = api.patch as jest.Mock;

const challenge = (id: number, status: string) => ({ id, name: `Challenge ${id}`, status });

describe('user service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getMyChallenges', () => {
    it('flattens the status groups into one list: active, then completed, then left', async () => {
      get.mockResolvedValue({
        data: {
          left: [challenge(5, 'left')],
          active: [challenge(1, 'active'), challenge(2, 'active')],
          completed: [challenge(3, 'completed')],
        },
      });

      const result = await getMyChallenges();

      expect(get).toHaveBeenCalledWith('/users/me/challenges');
      expect(result.map((c) => c.id)).toEqual([1, 2, 3, 5]);
    });

    it('treats a missing group as empty', async () => {
      get.mockResolvedValue({ data: { active: [challenge(1, 'active')] } });
      expect((await getMyChallenges()).map((c) => c.id)).toEqual([1]);
    });

    it.each([
      ['an empty body', null],
      ['a bare list (not the grouped shape)', [challenge(1, 'active')]],
      ['groups that are not lists', { active: 'x', completed: {}, left: 3 }],
    ])('returns no challenges for %s', async (_label, data) => {
      get.mockResolvedValue({ data });
      await expect(getMyChallenges()).resolves.toEqual([]);
    });

    it('lets a failed request reach the caller', async () => {
      const failure = Object.assign(new Error('Request failed with status code 500'), { response: { status: 500 } });
      get.mockRejectedValue(failure);
      await expect(getMyChallenges()).rejects.toBe(failure);
    });
  });

  describe('searchUsers', () => {
    it('searches by the trimmed query', async () => {
      get.mockResolvedValue({ data: [{ id: 'u2', username: 'ana' }] });

      await expect(searchUsers('  ana ')).resolves.toEqual([{ id: 'u2', username: 'ana' }]);
      expect(get).toHaveBeenCalledWith('/users/search', { params: { q: 'ana' } });
    });

    it('does not call the API for a blank query', async () => {
      await expect(searchUsers('   ')).resolves.toEqual([]);
      expect(get).not.toHaveBeenCalled();
    });

    it('returns no users when the answer is not a list', async () => {
      get.mockResolvedValue({ data: { message: 'unexpected' } });
      await expect(searchUsers('ana')).resolves.toEqual([]);
    });
  });

  describe('profile', () => {
    it('reads the session user and their editable profile', async () => {
      get.mockResolvedValueOnce({ data: { id: 'u1' } }).mockResolvedValueOnce({ data: { id: 'u1', bio: 'hi' } });

      await expect(getMe()).resolves.toEqual({ id: 'u1' });
      await expect(getMyProfile()).resolves.toEqual({ id: 'u1', bio: 'hi' });
      expect(get).toHaveBeenNthCalledWith(1, '/users/me');
      expect(get).toHaveBeenNthCalledWith(2, '/users/me/profile');
    });

    it('sends only the changed fields', async () => {
      patch.mockResolvedValue({ data: { id: 'u1', bio: 'new' } });

      await expect(updateMyProfile({ bio: 'new' })).resolves.toEqual({ id: 'u1', bio: 'new' });
      expect(patch).toHaveBeenCalledWith('/users/me/profile', { bio: 'new' });
    });

    it('stores the uploaded photo URL under the backend field name', async () => {
      patch.mockResolvedValue({ data: { id: 'u1' } });

      await updateMyProfilePhoto('https://cdn.example.com/u1.jpg');

      expect(patch).toHaveBeenCalledWith('/users/me/profile/photo', {
        profile_image_url: 'https://cdn.example.com/u1.jpg',
      });
    });

    it("reads another user's public profile by id", async () => {
      get.mockResolvedValue({ data: { id: 'u2' } });

      await expect(getPublicProfile('u2')).resolves.toEqual({ id: 'u2' });
      expect(get).toHaveBeenCalledWith('/users/u2/profile');
    });
  });

  describe('admin', () => {
    it('bans and unbans through the soft is_active flag endpoints', async () => {
      patch.mockResolvedValue({ data: { ok: true } });

      await banUser('u9');
      await unbanUser('u9');

      expect(patch).toHaveBeenNthCalledWith(1, '/users/u9/ban');
      expect(patch).toHaveBeenNthCalledWith(2, '/users/u9/unban');
    });

    it('lists banned accounts', async () => {
      get.mockResolvedValue({ data: [{ id: 'u9', username: 'spam' }] });
      await expect(listBannedUsers()).resolves.toEqual([{ id: 'u9', username: 'spam' }]);
      expect(get).toHaveBeenCalledWith('/users/banned');
    });
  });
});
