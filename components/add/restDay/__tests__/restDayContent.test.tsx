import { StyleSheet } from 'react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { RestDayContent } from '../RestDayContent';
import { fontFamily } from '../../../../constants/theme';

describe('RestDayContent', () => {
  it('sets the title in the display font, like the titles of the screens around it', async () => {
    const screen = await renderWithProviders(<RestDayContent onJustToday={jest.fn()} onPlanRestDays={jest.fn()} />);

    expect(StyleSheet.flatten(screen.getByText('Rest days matter too').props.style).fontFamily).toBe(fontFamily.display);
  });

  it('offers both choices', async () => {
    const screen = await renderWithProviders(<RestDayContent onJustToday={jest.fn()} onPlanRestDays={jest.fn()} />);

    expect(screen.getByText('Just today')).toBeTruthy();
    expect(screen.getByText('Plan rest days')).toBeTruthy();
  });
});
