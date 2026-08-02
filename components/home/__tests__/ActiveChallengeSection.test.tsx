import { ActiveChallengeSection } from '../ActiveChallengeSection';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import type { HomeActiveChallengeViewModel } from '../../../services/adapters/homeAdapter';

function buildChallenge(overrides: Partial<HomeActiveChallengeViewModel> = {}): HomeActiveChallengeViewModel {
  return {
    challengeId: 'challenge-1',
    title: 'Iron Will',
    currentDay: 14,
    totalDays: 75,
    isTodayCompleted: false,
    isCompleted: false,
    activityType: 'strength',
    isRestDay: false,
    streakCount: 0,
    ...overrides,
  };
}

describe('ActiveChallengeSection', () => {
  it('renders the title of every challenge passed in', async () => {
    const challenges = [
      buildChallenge({ challengeId: 'a', title: 'Iron Will' }),
      buildChallenge({ challengeId: 'b', title: 'Morning Cardio' }),
    ];

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={challenges} hoursLeft={8} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByText('Morning Cardio')).toBeTruthy();
  });

  it('shows "Completed" and hides the hours-left badge for a completed challenge', async () => {
    const challenge = buildChallenge({ isCompleted: true });

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText(/left/)).toBeNull();
  });

  it('shows the hours-left badge when the challenge is active and not completed today', async () => {
    const challenge = buildChallenge({ isCompleted: false, isTodayCompleted: false });

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    // NOTE: under Jest, expo-localization resolves the device locale to English,
    // so i18n renders the en.ts copy: home.hoursLeft is "{{hours}}h left" and
    // home.completed is "Completed" — asserting on the real copy the app renders.
    expect(screen.getByText('8h left')).toBeTruthy();
  });

  it('hides both the "Completed" and hours-left badges once today is already completed', async () => {
    const challenge = buildChallenge({ isCompleted: false, isTodayCompleted: true });

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText(/left/)).toBeNull();
  });
});
