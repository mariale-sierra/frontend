import { Image } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { IMAGES_READY_TIMEOUT_MS, useImagesReady } from '../useImagesReady';

// Sprint 10: screens with photos keep their skeleton until the photos are downloaded.
describe('useImagesReady', () => {
  let prefetch: jest.SpyInstance;
  let finish: () => void;

  beforeEach(() => {
    jest.useFakeTimers();
    prefetch = jest.spyOn(Image, 'prefetch').mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          finish = () => resolve(true);
        }),
    );
  });

  afterEach(() => {
    prefetch.mockRestore();
    jest.useRealTimers();
  });

  it('is not ready until the photos are downloaded', async () => {
    const { result } = await renderHook(() => useImagesReady(['https://cdn.test/a.jpg']));

    expect(prefetch).toHaveBeenCalledWith('https://cdn.test/a.jpg');
    expect(result.current).toBe(false);

    await act(async () => finish());

    expect(result.current).toBe(true);
  });

  it('waits for nothing while the data is still loading, and is ready right away with no photos', async () => {
    const { result, rerender } = await renderHook(({ enabled }: { enabled: boolean }) => useImagesReady([null, undefined], { enabled }), {
      initialProps: { enabled: false },
    });
    expect(result.current).toBe(false);

    await rerender({ enabled: true });

    expect(prefetch).not.toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  it('gives up waiting after the timeout, so a slow photo never blocks the screen', async () => {
    const { result } = await renderHook(() => useImagesReady(['https://cdn.test/slow.jpg']));

    await act(async () => {
      jest.advanceTimersByTime(IMAGES_READY_TIMEOUT_MS);
    });

    expect(result.current).toBe(true);
  });

  it('stays ready when the photos change later (a refresh), so the skeleton never comes back', async () => {
    const { result, rerender } = await renderHook(({ urls }: { urls: string[] }) => useImagesReady(urls), {
      initialProps: { urls: ['https://cdn.test/a.jpg'] },
    });
    await act(async () => finish());

    await rerender({ urls: ['https://cdn.test/a.jpg?new-signature'] });

    expect(result.current).toBe(true);
  });
});
