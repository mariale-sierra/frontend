import { ActiveChallengeSection } from '../ActiveChallengeSection';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import type { HomeActiveChallengeViewModel } from '../../../services/adapters/homeAdapter';

// The revert path: with the glow cards switched off, Home shows the classic
// hero card — same logic, its own solid-color visuals.
jest.mock('../../../constants/challengeCards', () => ({ USE_GLOW_CHALLENGE_CARDS: false }));

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

describe('ActiveChallengeSection with the classic cards', () => {
  it('renders the title, the day count and the hours left', async () => {
    const screen = await renderWithProviders(
      <ActiveChallengeSection challenges={[buildChallenge()]} hoursLeft={8} />,
    );

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByText(/Day 14/)).toBeTruthy();
    expect(screen.getByText('8h left')).toBeTruthy();
  });

  it('shows "Completed" and hides the hours-left badge once today has a logged photo', async () => {
    const screen = await renderWithProviders(
      <ActiveChallengeSection challenges={[buildChallenge({ state: 'completed' })]} hoursLeft={8} />,
    );

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText(/left/)).toBeNull();
  });
});
