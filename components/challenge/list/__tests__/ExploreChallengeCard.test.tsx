import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ExploreChallengeCard } from '../ExploreChallengeCard';
import { ExploreChallengeCardV2 } from '../ExploreChallengeCardV2';
import { colors, fontSize } from '../../../../constants/theme';
import type { ExploreChallengeViewModel } from '../challengeListSections';

function buildChallenge(overrides: Partial<ExploreChallengeViewModel> = {}): ExploreChallengeViewModel {
  return {
    challengeId: 'challenge-1',
    title: 'Iron Will',
    durationDays: 75,
    cycleLengthDays: 7,
    restDaysCount: 1,
    locationsLabel: 'Gym',
    categoriesLabel: 'Strength',
    membersCount: 1200,
    dominantActivityCategory: 'strength',
    ...overrides,
  };
}

// Both designs of the card take the same props and show the same information —
// the classic one and the glow one — so the same behavior is asserted on both.
describe.each([
  ['classic', ExploreChallengeCard],
  ['glow', ExploreChallengeCardV2],
])('Explore card (%s design)', (_design, Card) => {
  it('shows the challenge title, where it happens, the category and the members', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge()} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByText('Gym')).toBeTruthy();
    expect(screen.getByText('Strength')).toBeTruthy();
    expect(screen.getByText(/members/)).toBeTruthy();
  });

  it('shows how long the challenge lasts, and no rest-days line', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge({ durationDays: 30 })} />);

    expect(screen.getByText(/30/)).toBeTruthy();
    expect(screen.queryByText(/rest/i)).toBeNull();
  });

  it('calls onPress when the card is tapped', async () => {
    const onPress = jest.fn();
    const screen = await renderWithProviders(<Card challenge={buildChallenge()} onPress={onPress} />);

    await fireEvent.press(screen.getByText('Iron Will'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders for a challenge with no dominant category yet', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge({ dominantActivityCategory: null })} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
  });
});

describe('Explore card (glow design) specifics', () => {
  it('shows the duration as a number with its unit, in the tick ring', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 21 })} />);

    expect(screen.getByText('21')).toBeTruthy();
    expect(screen.getByText('days')).toBeTruthy();
  });

  it('sets the days label in plain paper, fully opaque', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 21 })} />);

    expect(StyleSheet.flatten(screen.getByText('days').props.style)).toMatchObject({
      color: colors.paper,
      opacity: 1,
    });
  });

  it('tightens the number so the days label sits closer under it', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 21 })} />);

    expect(StyleSheet.flatten(screen.getByText('21').props.style).lineHeight).toBe(fontSize['3xl']);
  });

  it('marks the member count with a people icon (there are no member pictures to show)', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);

    expect(JSON.stringify(screen.toJSON())).toContain('people-outline');
    expect(screen.getByText(/members/)).toBeTruthy();
  });

  it('uses the singular unit for a one-day challenge', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 1 })} />);

    expect(screen.getByText('day')).toBeTruthy();
  });

  it('leaves out the category badge and the subtitle when there is nothing to show in them', async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ categoriesLabel: '', locationsLabel: '' })} />,
    );

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.queryByText('Gym')).toBeNull();
    expect(screen.queryByText('Strength')).toBeNull();
  });
});
