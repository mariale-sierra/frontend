import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../../test-utils/renderWithTheme';
import { ChallengeProgressHeader } from '../ChallengeProgressHeader';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseProps = {
  state: 'active' as const,
  title: 'Push-up Streak',
  currentDay: 3,
  totalDays: 30,
  ticks: [],
  todayRoutineName: null,
  isTodayRestDay: false,
  dominantActivityCategory: null,
  onPressRoutine: jest.fn(),
  onPressMembers: jest.fn(),
  onPressInfo: jest.fn(),
  onPressLeave: jest.fn(),
  onPressSettings: jest.fn(),
};

describe('ChallengeProgressHeader — settings (owner) vs. leave (everyone else)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows Settings, not Leave, for the challenge owner', async () => {
    const screen = await renderWithTheme(<ChallengeProgressHeader {...baseProps} isOwner />);

    expect(screen.getByLabelText('challengeProgress.manageA11y')).toBeTruthy();
    expect(screen.queryByLabelText('challengeProgress.leaveA11y')).toBeNull();
  });

  it('shows Leave, not Settings, for a non-owner participant', async () => {
    const screen = await renderWithTheme(<ChallengeProgressHeader {...baseProps} isOwner={false} />);

    expect(screen.getByLabelText('challengeProgress.leaveA11y')).toBeTruthy();
    expect(screen.queryByLabelText('challengeProgress.manageA11y')).toBeNull();
  });

  it('hides Leave for a non-owner who already left, without showing Settings instead', async () => {
    const screen = await renderWithTheme(
      <ChallengeProgressHeader {...baseProps} isOwner={false} state="left" />,
    );

    expect(screen.queryByLabelText('challengeProgress.leaveA11y')).toBeNull();
    expect(screen.queryByLabelText('challengeProgress.manageA11y')).toBeNull();
  });

  it('calls onPressSettings when the owner taps the settings icon', async () => {
    const onPressSettings = jest.fn();
    const screen = await renderWithTheme(
      <ChallengeProgressHeader {...baseProps} isOwner onPressSettings={onPressSettings} />,
    );

    fireEvent.press(screen.getByLabelText('challengeProgress.manageA11y'));

    expect(onPressSettings).toHaveBeenCalledTimes(1);
  });

  it('calls onPressLeave when a non-owner taps the leave icon', async () => {
    const onPressLeave = jest.fn();
    const screen = await renderWithTheme(
      <ChallengeProgressHeader {...baseProps} isOwner={false} onPressLeave={onPressLeave} />,
    );

    fireEvent.press(screen.getByLabelText('challengeProgress.leaveA11y'));

    expect(onPressLeave).toHaveBeenCalledTimes(1);
  });

  it('keeps Members and Info visible regardless of ownership', async () => {
    const owner = await renderWithTheme(<ChallengeProgressHeader {...baseProps} isOwner />);
    expect(owner.getByLabelText('challengeProgress.membersA11y')).toBeTruthy();
    expect(owner.getByLabelText('challengeProgress.infoA11y')).toBeTruthy();

    const nonOwner = await renderWithTheme(<ChallengeProgressHeader {...baseProps} isOwner={false} />);
    expect(nonOwner.getByLabelText('challengeProgress.membersA11y')).toBeTruthy();
    expect(nonOwner.getByLabelText('challengeProgress.infoA11y')).toBeTruthy();
  });
});
