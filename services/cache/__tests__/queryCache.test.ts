import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearQueryCache,
  fetchQuery,
  getQueryData,
  getQueryEntry,
  invalidateQueries,
  observeQuery,
  setQueryData,
  setQueryScope,
} from '../queryCache';
import { patchFeedPost, removePostFromCaches, queryKeys } from '../queries';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('queryCache', () => {
  beforeEach(async () => {
    setQueryScope('user-1');
    await clearQueryCache();
    setQueryScope('user-1');
    await AsyncStorage.clear();
  });

  it('reuses fresh data instead of asking the server again', async () => {
    const fetcher = jest.fn().mockResolvedValue(['a']);
    await fetchQuery('k', fetcher, { staleTime: 60_000 });
    await fetchQuery('k', fetcher, { staleTime: 60_000 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('asks again once the data is older than staleTime, or when forced', async () => {
    const fetcher = jest.fn().mockResolvedValue(['a']);
    await fetchQuery('k', fetcher, { staleTime: 0 });
    await fetchQuery('k', fetcher, { staleTime: 0 });
    await fetchQuery('k', fetcher, { staleTime: 60_000, force: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('shares one request between callers asking at the same time', async () => {
    let resolve!: (value: string[]) => void;
    const fetcher = jest.fn(() => new Promise<string[]>((r) => (resolve = r)));
    const first = fetchQuery('k', fetcher);
    const second = fetchQuery('k', fetcher);
    await flush();
    resolve(['a']);
    await expect(Promise.all([first, second])).resolves.toEqual([['a'], ['a']]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps the cached data when a refresh fails', async () => {
    await fetchQuery('k', jest.fn().mockResolvedValue(['a']));
    await expect(fetchQuery('k', jest.fn().mockRejectedValue(new Error('offline')), { force: true })).rejects.toThrow();
    expect(getQueryData('k')).toEqual(['a']);
    expect(getQueryEntry('k').error).toBeInstanceOf(Error);
  });

  it('refetches an invalidated key right away while something on screen observes it', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(['old']).mockResolvedValueOnce(['new']);
    await fetchQuery('k', fetcher, { staleTime: 60_000 });
    const stop = observeQuery('k', { fetcher, options: { staleTime: 60_000 } });
    invalidateQueries('k');
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(getQueryData('k')).toEqual(['new']);
    stop();
  });

  it('only marks an unobserved key stale (the next reader refetches it)', async () => {
    const fetcher = jest.fn().mockResolvedValue(['a']);
    await fetchQuery('user-posts:1', fetcher, { staleTime: 60_000 });
    invalidateQueries('user-posts:');
    await flush();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await fetchQuery('user-posts:1', fetcher, { staleTime: 60_000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not let an answer that started before a local change pass as fresh', async () => {
    let resolve!: (value: string[]) => void;
    const fetcher = jest.fn(() => new Promise<string[]>((r) => (resolve = r)));
    await fetchQuery('k', jest.fn().mockResolvedValue(['a']));
    const pending = fetchQuery('k', fetcher, { force: true });
    await flush();
    setQueryData<string[]>('k', (prev) => [...(prev ?? []), 'optimistic']);
    resolve(['server']);
    await pending;
    expect(getQueryEntry('k').updatedAt).toBe(0);
  });

  it('never shows one user the previous user’s data', async () => {
    await fetchQuery('k', jest.fn().mockResolvedValue(['mine']), { persist: true });
    setQueryScope('user-2');
    expect(getQueryData('k')).toBeUndefined();
    const fetcher = jest.fn().mockResolvedValue(['theirs']);
    await fetchQuery('k', fetcher, { persist: true, staleTime: 60_000 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(getQueryData('k')).toEqual(['theirs']);
  });

  it('restores persisted data on a cold start and clears it on logout', async () => {
    await fetchQuery('k', jest.fn().mockResolvedValue(['cached']), { persist: true });
    await flush();
    // A new app process: memory is empty, the disk copy is not.
    setQueryScope(null);
    setQueryScope('user-1');
    const fetcher = jest.fn().mockResolvedValue(['fresh']);
    await fetchQuery('k', fetcher, { persist: true, staleTime: 60_000 });
    expect(fetcher).not.toHaveBeenCalled();
    expect(getQueryData('k')).toEqual(['cached']);

    await clearQueryCache();
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((key) => key.includes('user-1'))).toEqual([]);
  });
});

describe('cache helpers for posts', () => {
  beforeEach(async () => {
    setQueryScope('user-1');
    await clearQueryCache();
  });

  it('drops a deleted/reported post from the feed and every profile grid at once', () => {
    setQueryData(queryKeys.feed, { posts: [{ id: 'p1' }, { id: 'p2' }], nextCursor: 'c' });
    setQueryData(queryKeys.userPosts('u1'), { photos: [{ id: 'p1' }], nextCursor: undefined });
    setQueryData(queryKeys.myPhotos, [{ id: 'p1' }, { id: 'p3' }]);

    removePostFromCaches('p1');

    expect(getQueryData(queryKeys.feed)).toEqual({ posts: [{ id: 'p2' }], nextCursor: 'c' });
    expect(getQueryData(queryKeys.userPosts('u1'))).toEqual({ photos: [], nextCursor: undefined });
    expect(getQueryData(queryKeys.myPhotos)).toEqual([{ id: 'p3' }]);
  });

  it('patches one feed post and keeps every other post object as it was', () => {
    const untouched = { id: 'p2', likes_count: 1 };
    setQueryData(queryKeys.feed, { posts: [{ id: 'p1', likes_count: 0 }, untouched] });

    patchFeedPost('p1', { liked_by_me: true, likes_count: 1 });

    const page = getQueryData<{ posts: Array<Record<string, unknown>> }>(queryKeys.feed)!;
    expect(page.posts[0]).toEqual({ id: 'p1', likes_count: 1, liked_by_me: true });
    expect(page.posts[1]).toBe(untouched);
  });
});
