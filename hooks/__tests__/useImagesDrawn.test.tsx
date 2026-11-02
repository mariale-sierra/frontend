import { act, renderHook } from '@testing-library/react-native';
import { IMAGES_READY_TIMEOUT_MS } from '../useImagesReady';
import { useImagesDrawn } from '../useImagesDrawn';

// Sprint 10: skeletons wait until the profile pictures are drawn, not just downloaded.
describe('useImagesDrawn', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('is ready once every image has been drawn', async () => {
    const { result } = await renderHook(() => useImagesDrawn(['a', 'b']));
    expect(result.current.ready).toBe(false);

    await act(async () => result.current.onDrawn('a'));
    expect(result.current.ready).toBe(false);

    await act(async () => result.current.onDrawn('b'));
    expect(result.current.ready).toBe(true);
  });

  it('waits for nothing while the data is loading, and is ready right away with no images', async () => {
    const { result, rerender } = await renderHook(({ enabled }: { enabled: boolean }) => useImagesDrawn([], { enabled }), {
      initialProps: { enabled: false },
    });
    expect(result.current.ready).toBe(false);

    await rerender({ enabled: true });
    expect(result.current.ready).toBe(true);
  });

  it('gives up waiting after the timeout, and stays ready when the list changes later', async () => {
    const { result, rerender } = await renderHook(({ ids }: { ids: string[] }) => useImagesDrawn(ids), {
      initialProps: { ids: ['slow'] },
    });

    await act(async () => {
      jest.advanceTimersByTime(IMAGES_READY_TIMEOUT_MS);
    });
    expect(result.current.ready).toBe(true);

    await rerender({ ids: ['slow', 'new'] });
    expect(result.current.ready).toBe(true);
  });
});
