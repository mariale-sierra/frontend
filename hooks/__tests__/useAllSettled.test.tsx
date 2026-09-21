import { act, renderHook } from '@testing-library/react-native';
import { useAllSettled } from '../useAllSettled';

const TIMEOUT = 5000;

describe('useAllSettled', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('waits: nothing is called while some of them are still to report in', async () => {
    const onAllSettled = jest.fn();
    const { result } = await renderHook(() => useAllSettled(['a', 'b', 'c'], onAllSettled, TIMEOUT));

    await act(async () => {
      result.current('a');
      result.current('b');
    });

    expect(onAllSettled).not.toHaveBeenCalled();
  });

  it('calls once the last of them has reported in, whatever order they came in', async () => {
    const onAllSettled = jest.fn();
    const { result } = await renderHook(() => useAllSettled(['a', 'b', 'c'], onAllSettled, TIMEOUT));

    await act(async () => {
      result.current('c');
      result.current('a');
      result.current('b');
    });

    expect(onAllSettled).toHaveBeenCalledTimes(1);
  });

  it('counts a repeat as nothing: one of them reporting in twice is not two of them', async () => {
    const onAllSettled = jest.fn();
    const { result } = await renderHook(() => useAllSettled(['a', 'b'], onAllSettled, TIMEOUT));

    await act(async () => {
      result.current('a');
      result.current('a');
      result.current('a');
    });

    expect(onAllSettled).not.toHaveBeenCalled();
  });

  it('calls only once, however many report in after, and even when the timeout comes round', async () => {
    const onAllSettled = jest.fn();
    const { result } = await renderHook(() => useAllSettled(['a', 'b'], onAllSettled, TIMEOUT));

    await act(async () => {
      result.current('a');
      result.current('b');
      result.current('a');
      result.current('b');
      jest.advanceTimersByTime(TIMEOUT * 2);
    });

    expect(onAllSettled).toHaveBeenCalledTimes(1);
  });

  it('has nothing to wait for with no keys: settled at once', async () => {
    const onAllSettled = jest.fn();

    await renderHook(() => useAllSettled([], onAllSettled, TIMEOUT));

    expect(onAllSettled).toHaveBeenCalledTimes(1);
  });

  it('does not count a key it was not given', async () => {
    const onAllSettled = jest.fn();
    const { result } = await renderHook(() => useAllSettled(['a', 'b'], onAllSettled, TIMEOUT));

    await act(async () => {
      result.current('a');
      result.current('z');
    });

    expect(onAllSettled).not.toHaveBeenCalled();
  });

  describe('the timeout', () => {
    it('gives up waiting after it, so one that never reports in cannot hold everything up', async () => {
      const onAllSettled = jest.fn();
      const { result } = await renderHook(() => useAllSettled(['a', 'b'], onAllSettled, TIMEOUT));
      await act(async () => result.current('a'));

      await act(async () => jest.advanceTimersByTime(TIMEOUT - 1));
      expect(onAllSettled).not.toHaveBeenCalled();

      await act(async () => jest.advanceTimersByTime(1));
      expect(onAllSettled).toHaveBeenCalledTimes(1);
    });

    it('does not run once they have all reported in', async () => {
      const onAllSettled = jest.fn();
      const { result } = await renderHook(() => useAllSettled(['a'], onAllSettled, TIMEOUT));

      await act(async () => result.current('a'));
      await act(async () => jest.advanceTimersByTime(TIMEOUT));

      expect(onAllSettled).toHaveBeenCalledTimes(1);
    });

    it('is cancelled when the hook goes away', async () => {
      const onAllSettled = jest.fn();
      const { unmount } = await renderHook(() => useAllSettled(['a'], onAllSettled, TIMEOUT));

      await unmount();
      await act(async () => jest.advanceTimersByTime(TIMEOUT * 2));

      expect(onAllSettled).not.toHaveBeenCalled();
    });
  });

  it('calls the latest `onAllSettled`, not the one it started with', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result, rerender } = await renderHook(
      ({ callback }: { callback: () => void }) => useAllSettled(['a'], callback, TIMEOUT),
      { initialProps: { callback: first } },
    );

    await rerender({ callback: second });
    await act(async () => result.current('a'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('hands out the same `settle` every time, so a card it is given to is not redrawn for it', async () => {
    const { result, rerender } = await renderHook(() => useAllSettled(['a'], jest.fn(), TIMEOUT));
    const first = result.current;

    await rerender(undefined);

    expect(result.current).toBe(first);
  });
});
