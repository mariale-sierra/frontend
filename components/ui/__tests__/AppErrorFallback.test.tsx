import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppErrorFallback } from '../AppErrorFallback';

describe('AppErrorFallback', () => {
  it('explains that something failed and retries the route when asked', async () => {
    const retry = jest.fn().mockResolvedValue(undefined);
    await render(<AppErrorFallback error={new Error('boom')} retry={retry} />);

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
