import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ExploreChallengeCard } from '../ExploreChallengeCard';
import { ExploreChallengeCardV2 } from '../ExploreChallengeCardV2';
import { activityColors, borderWidth, colors, radius, textOpacity } from '../../../../constants/theme';
import { withAlpha } from '../../../../utils/color';
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
  it('shows the challenge title, where it happens, and the category', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge()} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByText('Gym')).toBeTruthy();
    expect(screen.getByText('Strength')).toBeTruthy();
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

  it('shows who made the challenge', async () => {
    const screen = await renderWithProviders(
      <Card
        challenge={buildChallenge({
          author: { username: 'ana', displayName: 'Ana Ruiz', profileImageUrl: null },
        })}
      />,
    );

    expect(screen.getByText('By @ana')).toBeTruthy();
  });

  it('renders with no author line for a challenge with none (older cache, or a deleted account)', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge({ author: null })} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.queryByText(/^By @/)).toBeNull();
  });
});

describe('Explore card (classic design) specifics', () => {
  it('shows the member count as visible "N members" text in the footer', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCard challenge={buildChallenge()} />);

    expect(screen.getByText(/members/)).toBeTruthy();
  });
});

describe('Explore card (glow design, 18A) specifics', () => {
  const styleOf = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;

  it('shows how many days it lasts in a badge outlined in the activity color (no fill, softly rounded, not in capitals)', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 21 })} />);
    const badge = styleOf(screen.getByTestId('explore-card-days'));

    expect(badge).toMatchObject({
      borderColor: activityColors.strength,
      borderWidth: borderWidth.thin,
      borderRadius: (radius.small + radius.medium) / 2,
    });
    expect(badge.backgroundColor).toBeUndefined();
    expect(styleOf(screen.getByText('21 days'))).toMatchObject({ color: activityColors.strength, opacity: 1 });
    expect(styleOf(screen.getByText('21 days')).textTransform).toBeUndefined();
    expect(JSON.stringify(screen.toJSON())).toContain(`"name":"calendar-outline","size":16,"color":"${activityColors.strength}"`);
  });

  it("follows the challenge's activity color on the days badge", async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ dominantActivityCategory: 'cardioLow' })} />,
    );

    expect(styleOf(screen.getByTestId('explore-card-days')).borderColor).toBe(activityColors.cardioLow);
  });

  it('uses the singular unit for a one-day challenge', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 1 })} />);

    expect(screen.getByText('1 day')).toBeTruthy();
  });

  it('shows "N members" in paper, and a "Join" pill filled with the activity color, ink text on it', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ membersCount: 1200 })} />);

    expect(styleOf(screen.getByText('1.2k members'))).toMatchObject({ color: colors.paper, opacity: 1 });
    expect(JSON.stringify(screen.toJSON())).toContain(`"name":"people-outline","size":18,"color":"${colors.paper}"`);
    expect(styleOf(screen.getByTestId('explore-card-join')).backgroundColor).toBe(activityColors.strength);
    expect(styleOf(screen.getByText('Join'))).toMatchObject({ color: colors.ink, opacity: 1 });
    expect(screen.queryByText('View')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).toContain(`"name":"chevron-forward","size":16,"color":"${colors.ink}"`);
  });

  it('lists where it happens and what kind of training, each with its icon', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);
    const json = JSON.stringify(screen.toJSON());

    expect(screen.getByText('Gym')).toBeTruthy();
    expect(screen.getByText('Strength')).toBeTruthy();
    expect(json).toContain('location-outline');
    expect(json).toContain('flash-outline');
  });

  it("follows the challenge's own activity color", async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ dominantActivityCategory: 'cardioLow' })} />,
    );

    expect(styleOf(screen.getByTestId('explore-card-join')).backgroundColor).toBe(activityColors.cardioLow);
  });

  it('leaves out the location and category items when there is nothing to show in them', async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ categoriesLabel: '', locationsLabel: '' })} />,
    );

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.queryByText('Gym')).toBeNull();
    expect(screen.queryByText('Strength')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toContain('location-outline');
  });

  it("sets 'By @name' in the title's own color", async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2
        challenge={buildChallenge({ author: { username: 'ana', displayName: null, profileImageUrl: null } })}
      />,
    );

    expect(styleOf(screen.getByText('By @ana'))).toMatchObject({ color: colors.primary, opacity: 1 });
    expect(styleOf(screen.getByText('Iron Will')).color).toBe(colors.primary);
  });
});
