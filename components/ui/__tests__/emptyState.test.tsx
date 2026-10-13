import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { EmptyState } from '../emptyState';

describe('EmptyState', () => {
  it('renders the title and message, and no buttons without actions', async () => {
    const screen = await renderWithTheme(<EmptyState icon="images-outline" title="Nothing here" message="Try later" />);

    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try later')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('points somewhere: each action is a pressable button', async () => {
    const onExplore = jest.fn();
    const onPeople = jest.fn();
    const screen = await renderWithTheme(
      <EmptyState
        icon="images-outline"
        title="Empty"
        actions={[
          { label: 'Explore', onPress: onExplore, testID: 'a' },
          { label: 'People', onPress: onPeople, testID: 'b' },
        ]}
      />,
    );

    fireEvent.press(screen.getByTestId('a'));
    fireEvent.press(screen.getByTestId('b'));
    expect(onExplore).toHaveBeenCalledTimes(1);
    expect(onPeople).toHaveBeenCalledTimes(1);
  });
});
