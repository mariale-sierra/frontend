import { ActiveChallengeSection } from '../ActiveChallengeSection';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import type { HomeActiveChallengeViewModel } from '../../../services/adapters/homeAdapter';

function buildChallenge(overrides: Partial<HomeActiveChallengeViewModel> = {}): HomeActiveChallengeViewModel {
  return {
    challengeId: 'challenge-1',
    title: 'Iron Will',
    currentDay: 14,
    totalDays: 75,
    state: 'active',
    streakCount: 0,
    dominantActivityCategory: null,
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

  it('shows "Completed" and hides the hours-left badge once today has a logged photo', async () => {
    const challenge = buildChallenge({ state: 'completed' });

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText(/left/)).toBeNull();
  });

  it('shows the hours-left badge when the challenge is active and today has no photo yet', async () => {
    const challenge = buildChallenge({ state: 'active' });

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    // NOTE: under Jest, expo-localization resolves the device locale to English,
    // so i18n renders the en.ts copy: home.hoursLeft is "{{hours}}h left" and
    // home.completed is "Completed" — asserting on the real copy the app renders.
    expect(screen.getByText('8h left')).toBeTruthy();
  });

  it('shows "Rest day" and hides both the completed and hours-left badges on a rest day', async () => {
    const challenge = buildChallenge({ state: 'rest' });

    const screen = await renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    expect(screen.getByText('Rest day')).toBeTruthy();
    expect(screen.queryByText('Completed')).toBeNull();
    expect(screen.queryByText(/left/)).toBeNull();
  });
});
