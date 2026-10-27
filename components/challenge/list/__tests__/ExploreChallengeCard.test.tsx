import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ExploreChallengeCard } from '../ExploreChallengeCard';
import { ExploreChallengeCardV2 } from '../ExploreChallengeCardV2';
import { activityColors, colors, fillOpacity, radius } from '../../../../constants/theme';
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

// Both designs of the card take the same props — the classic one and the glow
// one — so the behavior they share is asserted on both.
describe.each([
  ['classic', ExploreChallengeCard],
  ['glow', ExploreChallengeCardV2],
])('Explore card (%s design)', (_design, Card) => {
  it('shows the challenge title', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge()} />);

    expect(screen.getByText('Iron Will')).toBeTruthy();
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
  it('shows where it happens and the category', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCard challenge={buildChallenge()} />);

    expect(screen.getByText('Gym')).toBeTruthy();
    expect(screen.getByText('Strength')).toBeTruthy();
  });

  it('shows how long the challenge lasts, and no rest-days line', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCard challenge={buildChallenge({ durationDays: 30 })} />);

    expect(screen.getByText(/30/)).toBeTruthy();
    expect(screen.queryByText(/rest/i)).toBeNull();
  });

  it('shows the member count as visible "N members" text in the footer', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCard challenge={buildChallenge()} />);

    expect(screen.getByText(/members/)).toBeTruthy();
  });
});

describe('Explore card (glow design, Sprint 10 mockups) specifics', () => {
  const styleOf = (node: { props: { style?: unknown } }) => StyleSheet.flatten(node.props.style as never) as Record<string, unknown>;
  const PHOTO = 'https://cdn.test/photo.jpeg';

  it('shows the length and the member count (just the number) as badges with their icons, in paper', async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ membersCount: 1200, durationDays: 30 })} />,
    );
    const json = JSON.stringify(screen.toJSON());

    expect(styleOf(screen.getByText('30 days'))).toMatchObject({ color: colors.paper, opacity: 1 });
    expect(styleOf(screen.getByText('1.2k'))).toMatchObject({ color: colors.paper, opacity: 1 });
    expect(screen.queryByText(/members/)).toBeNull();
    expect(screen.getByLabelText('1.2k members')).toBeTruthy();
    expect(json).toContain(`"name":"calendar-outline","size":16,"color":"${colors.paper}"`);
    expect(json).toContain(`"name":"people-outline","size":16,"color":"${colors.paper}"`);
  });

  it('draws both badges with the translucent paper fill', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);
    const badgeFill = withAlpha(colors.paper, fillOpacity.chip);

    expect(styleOf(screen.getByTestId('explore-card-days'))).toMatchObject({ backgroundColor: badgeFill, borderRadius: radius.medium });
    expect(styleOf(screen.getByTestId('explore-card-members'))).toMatchObject({ backgroundColor: badgeFill, borderRadius: radius.medium });
  });

  it('uses the singular unit for a one-day challenge', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ durationDays: 1 })} />);

    expect(screen.getByText('1 day')).toBeTruthy();
  });

  it('has a "Join" pill filled with the activity color, ink text on it', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);

    expect(styleOf(screen.getByTestId('explore-card-join')).backgroundColor).toBe(activityColors.strength);
    expect(styleOf(screen.getByText('Join'))).toMatchObject({ color: colors.ink, opacity: 1 });
    expect(JSON.stringify(screen.toJSON())).toContain(`"name":"chevron-forward","size":18,"color":"${colors.ink}"`);
  });

  it("follows the challenge's own activity color", async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2 challenge={buildChallenge({ dominantActivityCategory: 'cardioLow' })} />,
    );

    expect(styleOf(screen.getByTestId('explore-card-join')).backgroundColor).toBe(activityColors.cardioLow);
  });

  it('keeps to the mockups: no location or category on the card', async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);

    expect(screen.queryByText('Gym')).toBeNull();
    expect(screen.queryByText('Strength')).toBeNull();
  });

  it('shows the author with their avatar, "By @name" in paper, not bold', async () => {
    const screen = await renderWithProviders(
      <ExploreChallengeCardV2
        challenge={buildChallenge({ author: { username: 'ana', displayName: null, profileImageUrl: null } })}
      />,
    );

    expect(styleOf(screen.getByText('By @ana'))).toMatchObject({ color: colors.paper, opacity: 1 });
    expect(styleOf(screen.getByText('By @ana')).fontFamily).not.toMatch(/Bold/i);
  });

  it("with an approved photo, puts it behind the content on the card's right side, fading out to the left", async () => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ imageUrl: PHOTO })} />);

    expect(screen.getByTestId('explore-card-cover-image').props.source).toEqual({ uri: PHOTO });
    expect(styleOf(screen.getByTestId('explore-card-photo'))).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '70%',
    });
    // A plain `ink` card under it, covering the activity glow, so the fade has no seam.
    expect(styleOf(screen.getByTestId('explore-card-photo-base'))).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: colors.ink,
    });
    // The content is still there, on top of it.
    expect(screen.getByText('Iron Will')).toBeTruthy();
    expect(screen.getByTestId('explore-card-join')).toBeTruthy();
  });

  it('says "Join" on a public challenge and "Request" on a private one (B1/B2 wording)', async () => {
    const pub = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge()} />);
    expect(pub.getByText('Join')).toBeTruthy();
    expect(pub.queryByText('Request')).toBeNull();

    const priv = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ isPrivate: true })} />);
    expect(priv.getByText('Request')).toBeTruthy();
    expect(priv.queryByText('Join')).toBeNull();
  });

  it.each([
    ['no photo', undefined],
    ['a photo still in review or rejected (the API sends no URL)', null],
  ])('with %s, is the plain glow card — no photo, no placeholder', async (_case, imageUrl) => {
    const screen = await renderWithProviders(<ExploreChallengeCardV2 challenge={buildChallenge({ imageUrl })} />);

    expect(screen.queryByTestId('explore-card-photo')).toBeNull();
    expect(screen.queryByTestId('explore-card-cover-image')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).not.toContain('"name":"image-outline"');
  });
});
