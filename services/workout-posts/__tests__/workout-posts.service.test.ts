import api from '../../api';
import { listAllComments, listComments } from '../workout-posts.service';
import type { CommentContract } from '../../../types/workout-post-social';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockedApi = api as jest.Mocked<typeof api>;

const comment = (id: number): CommentContract => ({
  id,
  workoutPostId: 'post-1',
  author: { id: 'user-1', username: 'bob', displayName: null, profileImageUrl: null },
  content: `comment ${id}`,
  createdAt: '2026-09-20T10:00:00.000Z',
});

const page = (ids: number[], nextAfter: number | null) => ({ data: { comments: ids.map(comment), nextAfter } });

describe('listComments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks for a page of the post\'s comments after a cursor, with a limit', async () => {
    mockedApi.get.mockResolvedValue(page([1], null));

    await listComments('post-1', 20, 50);

    expect(mockedApi.get).toHaveBeenCalledWith('/workout-posts/post-1/comments', { params: { after: 20, limit: 50 } });
  });

  it('asks for the first page with no cursor', async () => {
    mockedApi.get.mockResolvedValue(page([1], null));

    await listComments('post-1');

    expect(mockedApi.get).toHaveBeenCalledWith('/workout-posts/post-1/comments', { params: { after: undefined, limit: undefined } });
  });
});

describe('listAllComments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is one request for a thread that fits a page, at the backend\'s largest page size', async () => {
    mockedApi.get.mockResolvedValue(page([1, 2, 3], null));

    const all = await listAllComments('post-1');

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith('/workout-posts/post-1/comments', { params: { after: undefined, limit: 50 } });
    expect(all.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('reads on from where each page stopped until there are no more, oldest first', async () => {
    mockedApi.get
      .mockResolvedValueOnce(page([1, 2], 2))
      .mockResolvedValueOnce(page([3, 4], 4))
      .mockResolvedValueOnce(page([5], null));

    const all = await listAllComments('post-1');

    expect(mockedApi.get).toHaveBeenCalledTimes(3);
    expect(mockedApi.get.mock.calls.map(([, config]) => (config as { params: { after?: number } }).params.after)).toEqual([
      undefined,
      2,
      4,
    ]);
    expect(all.map((c) => c.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('is empty for a post with no comments', async () => {
    mockedApi.get.mockResolvedValue(page([], null));

    expect(await listAllComments('post-1')).toEqual([]);
  });

  it('stops if the cursor does not move on, rather than asking for ever', async () => {
    mockedApi.get.mockResolvedValue(page([1, 2], 2));

    const all = await listAllComments('post-1');

    // First page: cursor 2. Second: the same cursor again, so it stops.
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
    expect(all.map((c) => c.id)).toEqual([1, 2, 1, 2]);
  });

  it('fails as the request does, so the sheet can show its error', async () => {
    mockedApi.get.mockRejectedValue(new Error('offline'));

    await expect(listAllComments('post-1')).rejects.toThrow('offline');
  });
});
