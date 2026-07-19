import { ActiveChallengeSection } from '../ActiveChallengeSection';
import { renderWithProviders, screen } from '../../../test-utils/renderWithProviders';
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
    ...overrides,
  };
}

describe('ActiveChallengeSection', () => {
  it('renders the title of every challenge passed in', () => {
    const challenges = [
      buildChallenge({ challengeId: 'a', title: 'Iron Will' }),
      buildChallenge({ challengeId: 'b', title: 'Morning Cardio' }),
    ];

    renderWithProviders(<ActiveChallengeSection challenges={challenges} hoursLeft={8} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByText('Morning Cardio')).toBeTruthy();
  });

  it('shows "Completado" and hides the hours-left badge for a completed challenge', () => {
    const challenge = buildChallenge({ isCompleted: true });

    renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    expect(screen.getByText('Completado')).toBeTruthy();
    expect(screen.queryByText(/restantes/)).toBeNull();
  });

  it('shows the hours-left badge when the challenge is active and not completed today', () => {
    const challenge = buildChallenge({ isCompleted: false, isTodayCompleted: false });

    renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    // NOTE: i18n/resources/es.ts defines home.hoursLeft as "{{hours}}h restantes",
    // not "{{hours}} horas restantes" — asserting on the real copy the app renders.
    expect(screen.getByText('8h restantes')).toBeTruthy();
  });

  it('hides both the "Completado" and hours-left badges once today is already completed', () => {
    const challenge = buildChallenge({ isCompleted: false, isTodayCompleted: true });

    renderWithProviders(<ActiveChallengeSection challenges={[challenge]} hoursLeft={8} />);

    expect(screen.queryByText('Completado')).toBeNull();
    expect(screen.queryByText(/restantes/)).toBeNull();
  });
});
