import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test-utils/renderWithTheme';
import { FormField } from '../formField';

describe('FormField', () => {
  it('renders the label and forwards text changes', async () => {
    const onChangeText = jest.fn();
    const screen = await renderWithTheme(
      <FormField
        label="Name"
        placeholder="Your name"
        value=""
        onChangeText={onChangeText}
      />,
    );

    expect(screen.getByText('Name')).toBeTruthy();
    await fireEvent.changeText(screen.getByPlaceholderText('Your name'), 'Esteban');
    expect(onChangeText).toHaveBeenCalledWith('Esteban');
  });

  it('shows the validation error when present and hides it when absent', async () => {
    const screen = await renderWithTheme(
      <FormField value="" onChangeText={jest.fn()} error="Required field" />,
    );
    expect(screen.getByText('Required field')).toBeTruthy();

    await screen.rerender(<FormField value="x" onChangeText={jest.fn()} error={null} />);
    expect(screen.queryByText('Required field')).toBeNull();
  });

  it('renders the character counter when maxLength is set', async () => {
    const screen = await renderWithTheme(
      <FormField value="hola" onChangeText={jest.fn()} maxLength={100} />,
    );

    expect(screen.getByText('4/100')).toBeTruthy();
  });
});
