import { Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme as render } from '../../../test-utils/renderWithTheme';
import { IllustratedBlock } from '../illustratedBlock';

// Sprint 10: an empty-state block shows as a skeleton until its illustration loads, then all at once.
describe('IllustratedBlock', () => {
  const SOURCE = { uri: 'illustration.png' };

  it('keeps the whole block behind a skeleton until the illustration loads', async () => {
    const screen = await render(
      <IllustratedBlock source={SOURCE} size={120} actionCount={2} imageTestID="art">
        <Text>Nothing here</Text>
      </IllustratedBlock>,
    );

    const image = screen.getByTestId('art', { includeHiddenElements: true });
    expect(image.props.source).toEqual(SOURCE);
    expect(image.props.style).toEqual({ width: 120, height: 120 });
    expect(screen.getByTestId('art-skeleton')).toBeTruthy();
    expect(screen.queryByText('Nothing here')).toBeNull();

    await fireEvent(image, 'loadEnd');

    expect(screen.queryByTestId('art-skeleton')).toBeNull();
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });
});
