import { ActiveChallengeItemV2 } from '../ActiveChallengeItemV2';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { activityColors, colors } from '../../../constants/theme';
import type { HomeActiveChallengeViewModel } from '../../../services/adapters/homeAdapter';

function buildChallenge(overrides: Partial<HomeActiveChallengeViewModel> = {}): HomeActiveChallengeViewModel {
  return {
    challengeId: 'challenge-1',
    title: 'Iron Will',
    currentDay: 14,
    totalDays: 75,
    state: 'active',
    streakCount: 0,
    dominantActivityCategory: 'strength',
    ...overrides,
  };
}

describe('ActiveChallengeItemV2 glow edge', () => {
  it('keeps its glow at the bottom, so the progress track is the dark groove', async () => {
    const screen = await renderWithProviders(<ActiveChallengeItemV2 challenge={buildChallenge()} hoursLeft={8} />);

    // `ink` at 45% (`withAlpha` appends the alpha byte, 0x73).
    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${colors.ink}73"`);
  });
});

describe('ActiveChallengeItemV2 height', () => {
  it('fills the slot it is given, so the tallest card in the carousel sets the height for all', async () => {
    const screen = await renderWithProviders(
      <ActiveChallengeItemV2
        challenge={buildChallenge({ title: 'A very long challenge title that wraps' })}
        hoursLeft={8}
      />,
    );
    const tree = JSON.stringify(screen.toJSON());

    // The pressable and the card inside it both take `flex: 1`, and nothing pins a height.
    expect(tree.match(/"flex":1/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(tree).not.toContain('"height":176');
  });
});

// The glow card's outline is its glow color at 30% (`withAlpha` appends the alpha byte, 0x4D).
describe('ActiveChallengeItemV2 glow color', () => {
  it.each([
    ['rest', colors.rest],
    ['completed', colors.success],
    ['active', activityColors.strength],
  ] as const)('glows for the %s state in the right color', async (state, color) => {
    const screen = await renderWithProviders(
      <ActiveChallengeItemV2 challenge={buildChallenge({ state })} hoursLeft={8} />,
    );

    expect(JSON.stringify(screen.toJSON())).toContain(`${color}4D`);
  });

  it.each([
    ['rest', colors.rest],
    ['completed', colors.success],
    ['active', activityColors.strength],
  ] as const)('fills the progress bar in the glow color on the %s state', async (state, color) => {
    const screen = await renderWithProviders(
      <ActiveChallengeItemV2 challenge={buildChallenge({ state })} hoursLeft={8} />,
    );

    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${color}"`);
  });

  it('leaves the activity color out of a rest-day card entirely', async () => {
    const screen = await renderWithProviders(
      <ActiveChallengeItemV2 challenge={buildChallenge({ state: 'rest' })} hoursLeft={8} />,
    );

    expect(JSON.stringify(screen.toJSON())).not.toContain(activityColors.strength);
  });
});
