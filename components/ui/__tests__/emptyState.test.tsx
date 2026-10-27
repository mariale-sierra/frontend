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

    await fireEvent.press(screen.getByTestId('a'));
    await fireEvent.press(screen.getByTestId('b'));
    expect(onExplore).toHaveBeenCalledTimes(1);
    expect(onPeople).toHaveBeenCalledTimes(1);
  });

  // Sprint 10: an illustration in place of the icon, and a single line.
  describe('with an illustration', () => {
    const ILLUSTRATION = { uri: 'illustration.png' };

    it('shows the illustration, the title as one line and the actions — no icon, no message', async () => {
      const onPress = jest.fn();
      const screen = await renderWithTheme(
        <EmptyState
          icon="images-outline"
          illustration={ILLUSTRATION}
          title="Your feed is empty for now"
          message="This longer explanation is left out"
          actions={[{ label: 'Explore', onPress }]}
          testID="empty"
        />,
      );

      expect(screen.getByTestId('empty-illustration').props.source).toEqual(ILLUSTRATION);
      expect(screen.getByText('Your feed is empty for now')).toBeTruthy();
      expect(screen.queryByText('This longer explanation is left out')).toBeNull();
      expect(JSON.stringify(screen.toJSON())).not.toContain('images-outline');

      await fireEvent.press(screen.getByText('Explore'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
