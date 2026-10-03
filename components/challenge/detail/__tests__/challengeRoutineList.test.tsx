import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import ChallengeRoutineList from '../challengeRoutineList';
import { activityColors, radius, spacing } from '../../../../constants/theme';
import { triggerLightHaptic } from '../../../../utils/haptics';
import type { ChallengeDaySummary } from '../../../../services/adapters/challengeDetailAdapter';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../../../../utils/haptics', () => ({
  triggerLightHaptic: jest.fn(),
}));

const DAYS: ChallengeDaySummary[] = [
  { day: 1, isRestDay: false, routineName: 'Push day', exerciseCount: 5, location: 'Gym' },
  { day: 2, isRestDay: true, routineName: '', exerciseCount: 0, location: '' },
];

const styleOf = (element: { props: { style?: unknown } }) =>
  StyleSheet.flatten(element.props.style as StyleProp<ViewStyle>);

async function renderList(onPressDay = jest.fn()) {
  return renderWithTheme(
    <ChallengeRoutineList days={DAYS} cycleLengthDays={2} durationDays={30} accentColor={activityColors.strength} onPressDay={onPressDay} />,
  );
}

describe('ChallengeRoutineList rows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rounds each row with the `big` radius', async () => {
    const screen = await renderList();

    expect(styleOf(screen.getByText('Push day').parent!.parent!.parent!).borderRadius).toBe(radius.big);
    expect(styleOf(screen.getByText('challengeInfo.restDayLabel').parent!.parent!.parent!).borderRadius).toBe(radius.big);
  });

  it('keeps the rows a `md` gap apart', async () => {
    const screen = await renderList();
    const list = screen.getByText('Push day').parent!.parent!.parent!.parent!;

    expect(styleOf(list).gap).toBe(spacing.md);
  });

  it('opens a routine day when it is pressed', async () => {
    const onPressDay = jest.fn();
    const screen = await renderList(onPressDay);

    await fireEvent.press(screen.getByText('Push day'));

    expect(onPressDay).toHaveBeenCalledWith(1);
  });

  it('opens nothing for a rest day: a tap gives a light haptic', async () => {
    const onPressDay = jest.fn();
    const screen = await renderList(onPressDay);

    await fireEvent.press(screen.getByText('challengeInfo.restDayLabel'));

    expect(onPressDay).not.toHaveBeenCalled();
    expect(triggerLightHaptic).toHaveBeenCalledTimes(1);
  });
});
