import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { UpcomingDayCard } from '../UpcomingDayCard';
import { activityColors, colors, radius } from '../../../../constants/theme';
import { triggerLightHaptic } from '../../../../utils/haptics';
import type { ChallengeDaySummary } from '../../../../services/adapters/challengeDetailAdapter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../../utils/haptics', () => ({
  triggerLightHaptic: jest.fn(),
}));

const routine: ChallengeDaySummary = { day: 3, isRestDay: false, routineName: 'Push day', exerciseCount: 5, location: 'Gym' };
const rest: ChallengeDaySummary = { day: 4, isRestDay: true, routineName: '', exerciseCount: 0, location: '' };

const render = (day: ChallengeDaySummary, onPress = jest.fn()) =>
  renderWithTheme(<UpcomingDayCard day={day} label="Next in the cycle" accentColor={activityColors.strength} onPress={onPress} />);

type Rendered = Awaited<ReturnType<typeof render>>;

const tree = (screen: Rendered) => JSON.stringify(screen.toJSON());
const root = (screen: Rendered) =>
  screen.toJSON() as unknown as { props: { style: StyleProp<ViewStyle>; accessibilityRole?: string } };

// The card's own style, after its styles are merged.
const cardStyle = (screen: Rendered) => StyleSheet.flatten(root(screen).props.style);

describe('UpcomingDayCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the day's number, the label and the routine's name", async () => {
    const screen = await render(routine);

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Next in the cycle')).toBeTruthy();
    expect(screen.getByText('Push day')).toBeTruthy();
  });

  it('is a plain surface card whose badge takes the challenge color, for a routine day', async () => {
    const screen = await render(routine);

    expect(cardStyle(screen).backgroundColor).toBe(colors.surface);
    expect(tree(screen)).toContain(`"backgroundColor":"${activityColors.strength}"`);
    expect(tree(screen)).not.toContain(`"backgroundColor":"${colors.rest}"`);
  });

  it('is the plain rest lavender for a rest day — no gradient on it', async () => {
    const screen = await render(rest);

    expect(cardStyle(screen).backgroundColor).toBe(colors.rest);
    // No SVG highlight, or any other layer, drawn on the card.
    expect(tree(screen)).not.toContain('RNSVG');
    // Named "Rest day" (not the empty routine name) on the card.
    expect(screen.getByText('challengeInfo.restDayLabel')).toBeTruthy();
  });

  it('is rounder than a plain list row: the `big` radius', async () => {
    expect(cardStyle(await render(routine)).borderRadius).toBe(radius.big);
    expect(cardStyle(await render(rest)).borderRadius).toBe(radius.big);
  });

  it('opens the day when a routine day is pressed, with a chevron to say so', async () => {
    const onPress = jest.fn();
    const screen = await render(routine, onPress);

    await fireEvent.press(screen.getByText('Push day'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(triggerLightHaptic).not.toHaveBeenCalled();
    expect(tree(screen)).toContain('chevron-forward-outline');
  });

  it('goes nowhere when a rest day is pressed — a light haptic, and no chevron', async () => {
    const onPress = jest.fn();
    const screen = await render(rest, onPress);

    await fireEvent.press(screen.getByText('challengeInfo.restDayLabel'));

    expect(onPress).not.toHaveBeenCalled();
    expect(triggerLightHaptic).toHaveBeenCalledTimes(1);
    expect(tree(screen)).not.toContain('chevron-forward-outline');
  });

  it('is announced as a button only when it opens something', async () => {
    expect(root(await render(routine)).props.accessibilityRole).toBe('button');
    expect(root(await render(rest)).props.accessibilityRole).toBeUndefined();
  });
});
