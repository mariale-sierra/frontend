import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { Button } from '../button';

describe('Button', () => {
  it('renders its label and fires onPress', async () => {
    const onPress = jest.fn();
    const screen = await renderWithTheme(<Button onPress={onPress}>Save</Button>);

    await fireEvent.press(screen.getByText('Save'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', async () => {
    const onPress = jest.fn();
    const screen = await renderWithTheme(
      <Button onPress={onPress} disabled>
        Save
      </Button>,
    );

    await fireEvent.press(screen.getByText('Save'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('hides the label and disables interaction while loading', async () => {
    const onPress = jest.fn();
    const screen = await renderWithTheme(
      <Button onPress={onPress} loading testID="loading-button">
        Save
      </Button>,
    );

    // Label is replaced by the spinner and the button reports disabled state.
    expect(screen.queryByText('Save')).toBeNull();
    const button = screen.getByTestId('loading-button');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
