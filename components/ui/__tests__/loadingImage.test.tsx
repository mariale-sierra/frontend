import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { LoadingImage } from '../loadingImage';

// Sprint 10: challenge photos showed black for a few seconds while loading.
describe('LoadingImage', () => {
  const URI = 'https://cdn.test/photo.jpeg';

  it('shows the loader until the image finishes loading', async () => {
    const screen = await render(<LoadingImage uri={URI} testID="photo" />);

    expect(screen.getByTestId('photo').props.source).toEqual({ uri: URI });
    expect(screen.getByTestId('photo-loading')).toBeTruthy();

    await fireEvent(screen.getByTestId('photo'), 'loadEnd');

    expect(screen.queryByTestId('photo-loading')).toBeNull();
  });

  it('also stops when the image fails, so it never spins forever', async () => {
    const screen = await render(<LoadingImage uri={URI} testID="photo" />);

    // React Native calls onLoadEnd after onError too.
    await fireEvent(screen.getByTestId('photo'), 'error');
    await fireEvent(screen.getByTestId('photo'), 'loadEnd');

    expect(screen.queryByTestId('photo-loading')).toBeNull();
  });

  it('loads again when the photo changes', async () => {
    const screen = await render(<LoadingImage uri={URI} testID="photo" />);
    await fireEvent(screen.getByTestId('photo'), 'loadEnd');

    await screen.rerender(<LoadingImage uri="https://cdn.test/other.jpeg" testID="photo" />);

    expect(screen.getByTestId('photo-loading')).toBeTruthy();
  });
});
