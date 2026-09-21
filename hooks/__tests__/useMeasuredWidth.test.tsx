import { act, renderHook } from '@testing-library/react-native';
import { useMeasuredWidth } from '../useMeasuredWidth';

const layout = (width: number) => ({ nativeEvent: { layout: { width, height: 10, x: 0, y: 0 } } }) as never;

describe('useMeasuredWidth', () => {
  it('is 0 before the first layout pass, so a component can hold off drawing', async () => {
    const { result } = await renderHook(() => useMeasuredWidth());

    expect(result.current.width).toBe(0);
  });

  it('is the width the view is laid out at, and follows it when it changes', async () => {
    const { result } = await renderHook(() => useMeasuredWidth());

    await act(async () => result.current.onLayout(layout(342)));
    expect(result.current.width).toBe(342);

    await act(async () => result.current.onLayout(layout(400)));
    expect(result.current.width).toBe(400);
  });

  it('hands out the same onLayout every time, so it does not undo a memo it is given to', async () => {
    const { result, rerender } = await renderHook(() => useMeasuredWidth());
    const first = result.current.onLayout;

    await rerender(undefined);

    expect(result.current.onLayout).toBe(first);
  });
});
