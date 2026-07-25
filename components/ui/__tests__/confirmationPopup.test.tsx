import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { ConfirmationPopup } from '../confirmationPopup';

describe('ConfirmationPopup', () => {
  const baseProps = {
    visible: true,
    title: 'Cancel invitation?',
    description: 'This cannot be undone.',
  };

  it('renders title, description and both buttons', async () => {
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        primaryButton={{ label: 'Confirm', onPress: jest.fn() }}
        secondaryButton={{ label: 'Back', onPress: jest.fn() }}
      />,
    );

    expect(screen.getByText('Cancel invitation?')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
    expect(screen.getByText('Confirm')).toBeTruthy();
    expect(screen.getByText('Back')).toBeTruthy();
  });

  it('fires the matching callback for each button', async () => {
    const onConfirm = jest.fn();
    const onBack = jest.fn();
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        primaryButton={{ label: 'Confirm', onPress: onConfirm }}
        secondaryButton={{ label: 'Back', onPress: onBack }}
      />,
    );

    await fireEvent.press(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('disables the secondary button while the primary action is loading', async () => {
    const onBack = jest.fn();
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        primaryButton={{ label: 'Confirm', onPress: jest.fn(), loading: true }}
        secondaryButton={{ label: 'Back', onPress: onBack }}
      />,
    );

    await fireEvent.press(screen.getByText('Back'));
    expect(onBack).not.toHaveBeenCalled();
  });

  it('renders nothing when not visible', async () => {
    const screen = await renderWithTheme(
      <ConfirmationPopup
        {...baseProps}
        visible={false}
        primaryButton={{ label: 'Confirm', onPress: jest.fn() }}
      />,
    );

    expect(screen.queryByText('Cancel invitation?')).toBeNull();
  });
});
