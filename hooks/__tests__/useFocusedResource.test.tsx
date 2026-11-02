import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFocusedResource } from '../useFocusedResource';

// Runs the focus effect when the hook mounts, as focusing the screen would.
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => require('react').useEffect(callback, [callback]),
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useFocusedResource', () => {
  it('shares a request in flight instead of sending a second one', async () => {
    const first = deferred<string[]>();
    const fetcher = jest.fn().mockReturnValue(first.promise);
    const { result } = await renderHook(() => useFocusedResource('k', fetcher, [] as string[]));

    await act(async () => {
      void result.current.reload();
      void result.current.reload();
    });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => first.resolve(['a']));
    expect(result.current.data).toEqual(['a']);
  });

  it('refreshes in place: loading only until the first answer', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(['a']);
    const { result } = await renderHook(() => useFocusedResource('k', fetcher, [] as string[]));
    await waitFor(() => expect(result.current.data).toEqual(['a']));

    const second = deferred<string[]>();
    fetcher.mockReturnValueOnce(second.promise);
    await act(async () => {
      void result.current.reload();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(['a']);

    await act(async () => second.resolve(['a', 'b']));
    expect(result.current.data).toEqual(['a', 'b']);
  });

  it('keeps what is on screen when a refresh fails; only a failed first load is an error', async () => {
    const fetcher = jest.fn().mockResolvedValueOnce(['a']).mockRejectedValueOnce(new Error('offline'));
    const { result } = await renderHook(() => useFocusedResource('k', fetcher, [] as string[]));
    await waitFor(() => expect(result.current.data).toEqual(['a']));

    await act(async () => result.current.reload());

    expect(result.current.error).toBe(false);
    expect(result.current.data).toEqual(['a']);
  });

  it("drops an answer for a previous key and loads the new one from scratch", async () => {
    const old = deferred<string>();
    const fetcher = jest.fn((key: string) => (key === 'old' ? old.promise : Promise.resolve('new-data')));
    const { result, rerender } = await renderHook(
      ({ id }: { id: string }) => useFocusedResource(id, () => fetcher(id), 'none'),
      { initialProps: { id: 'old' } },
    );

    await rerender({ id: 'new' });
    await waitFor(() => expect(result.current.data).toBe('new-data'));

    await act(async () => old.resolve('old-data'));
    expect(result.current.data).toBe('new-data');
  });

  it('loads nothing for a null key and is not loading', async () => {
    const fetcher = jest.fn();
    const { result } = await renderHook(() => useFocusedResource(null, fetcher, 0));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).not.toHaveBeenCalled();
  });
});
