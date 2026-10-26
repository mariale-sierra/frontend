import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { ActivityFilterChips } from '../ActivityFilterChips';
import { activityColors, colors } from '../../../../constants/theme';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const styleOf = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

describe('ActivityFilterChips', () => {
  it('fills the picked activity chip with its own color; the others stay `surface` with a dot of theirs', async () => {
    const screen = await renderWithTheme(
      <ActivityFilterChips activities={['strength', 'cardioLow']} selected="strength" onSelect={jest.fn()} />,
    );

    expect(styleOf(screen.getByTestId('activity-filter-strength')).backgroundColor).toBe(activityColors.strength);
    expect(styleOf(screen.getByTestId('activity-filter-cardioLow')).backgroundColor).toBe(colors.surface);
    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${activityColors.cardioLow}"`);
  });

  it("puts an unpicked chip's dot after its label", async () => {
    const screen = await renderWithTheme(
      <ActivityFilterChips activities={['cardioLow']} selected={null} onSelect={jest.fn()} />,
    );
    const chip = screen.getByTestId('activity-filter-cardioLow');
    const children = chip.children as Array<{ props: { testID?: string } } | string>;
    const last = children[children.length - 1];

    expect(typeof last === 'object' && last.props.testID).toBe('activity-filter-cardioLow-dot');
  });

  it('fills "All" with `paper` when nothing is picked', async () => {
    const screen = await renderWithTheme(
      <ActivityFilterChips activities={['strength']} selected={null} onSelect={jest.fn()} />,
    );

    expect(styleOf(screen.getByTestId('activity-filter-all')).backgroundColor).toBe(colors.paper);
  });

  it('picks an activity, unpicks it on a second tap, and "All" clears it', async () => {
    const onSelect = jest.fn();
    const screen = await renderWithTheme(
      <ActivityFilterChips activities={['strength']} selected="strength" onSelect={onSelect} />,
    );

    await fireEvent.press(screen.getByTestId('activity-filter-strength'));
    expect(onSelect).toHaveBeenLastCalledWith(null);
    await fireEvent.press(screen.getByTestId('activity-filter-all'));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
