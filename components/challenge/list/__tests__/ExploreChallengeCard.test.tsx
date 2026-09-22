import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ExploreChallengeCard } from '../ExploreChallengeCard';
import { ExploreChallengeCardV2 } from '../ExploreChallengeCardV2';
import { activityColors, colors, fontSize } from '../../../../constants/theme';
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

  it('does not set the days label in capitals — it reads "days", as the text has it', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 21 })} />);

    expect(StyleSheet.flatten(screen.getByText('days').props.style).textTransform).toBeUndefined();
  });

  it('tightens the number so the days label sits closer under it', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 21 })} />);

    expect(StyleSheet.flatten(screen.getByText('21').props.style).lineHeight).toBe(fontSize['3xl']);
  });

  // Layout reworked 2026-09-22, per explicit request: the footer's old "N
  // members" text moved to a compact corner badge (just the icon and the raw
  // number, no word) — the footer now shows who made the challenge instead.
  it('shows the member count as a compact icon+number badge in the top-right corner, not "N members" text', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ membersCount: 1200 })} />);

    expect(JSON.stringify(screen.toJSON())).toContain('people-outline');
    expect(screen.getByText('1.2k')).toBeTruthy();
    expect(screen.queryByText(/members/)).toBeNull();
    // Still accessible to a screen reader, just not shown as visible text.
    expect(screen.getByLabelText('1200 members')).toBeTruthy();
  });

  it("puts the author, not the member count, in the footer", async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2
        challenge={buildChallenge({ author: { username: 'ana', displayName: null, profileImageUrl: null } })}
      />,
    );

    expect(screen.getByText('By @ana')).toBeTruthy();
  });

  it('uses the singular unit for a one-day challenge', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 1 })} />);

    expect(screen.getByText('day')).toBeTruthy();
  });

  it('shows the category as a plain label in the activity color, not a badge', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);
    const label = StyleSheet.flatten(screen.getByText('Strength').props.style);

    expect(label).toMatchObject({ color: activityColors.strength, opacity: 1, textTransform: 'uppercase' });
    // A badge would fill its background with the accent color.
    expect(label.backgroundColor).toBeUndefined();
    expect(JSON.stringify(screen.toJSON())).not.toContain('flash-outline');
  });

  it('leaves out the category label and the subtitle when there is nothing to show in them', async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ categoriesLabel: '', locationsLabel: '' })} />,
    );

    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.queryByText('Gym')).toBeNull();
    expect(screen.queryByText('Strength')).toBeNull();
  });
});
