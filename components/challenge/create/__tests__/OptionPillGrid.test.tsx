import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { OptionPillGrid } from '../OptionPillGrid';

const OPTIONS = [
  { label: 'Gym', value: 'gym' },
  { label: 'Home', value: 'home' },
];

describe('OptionPillGrid', () => {
  it('shows the plain "N selected" count by default (existing callers unaffected)', async () => {
    const screen = await renderWithProviders(
      <OptionPillGrid
        label="Location"
        options={OPTIONS}
        selectedValues={['gym']}
        onToggle={jest.fn()}
        renderIcon={() => null}
      />,
    );

    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  // Added for the onboarding practice picker's "N/6 selected" cap display —
  // must not change anything for a caller that doesn't pass it.
  it('uses a custom countLabel when one is given', async () => {
    const screen = await renderWithProviders(
      <OptionPillGrid
        label="Practices"
        options={OPTIONS}
        selectedValues={['gym']}
        onToggle={jest.fn()}
        renderIcon={() => null}
        countLabel={(count) => `${count}/6 selected`}
      />,
    );

    expect(screen.getByText('1/6 selected')).toBeTruthy();
    expect(screen.queryByText('1 selected')).toBeNull();
  });

  it('calls onToggle with the pressed option\'s value', async () => {
    const onToggle = jest.fn();
    const screen = await renderWithProviders(
      <OptionPillGrid
        label="Location"
        options={OPTIONS}
        selectedValues={[]}
        onToggle={onToggle}
        renderIcon={() => null}
      />,
    );

    await fireEvent.press(screen.getByText('Home'));

    expect(onToggle).toHaveBeenCalledWith('home');
  });
});
