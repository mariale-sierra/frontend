import { StyleSheet } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { ChallengeStatusCard } from '../ChallengeStatusCard';
import { ChallengeStatusCardV2 } from '../ChallengeStatusCardV2';
import { activityColors, colors } from '../../../../constants/theme';
import type { ChallengeMineCardViewModel } from '../../../../services/adapters/challengeListAdapter';

function buildChallenge(overrides: Partial<ChallengeMineCardViewModel> = {}): ChallengeMineCardViewModel {
  return {
    challengeId: 'challenge-1',
    title: 'Pilates challenge',
    currentDay: 12,
    totalDays: 21,
    state: 'active',
    latestPhotoUrl: null,
    dominantActivityCategory: 'cardioLow',
    ...overrides,
  };
}

// The glow card's outline is its glow color at 30% (`withAlpha` appends the alpha byte, 0x4D).
describe('Mine card (glow design) glow color', () => {
  it.each([
    ['rest', colors.rest],
    ['completed', colors.success],
    ['active', activityColors.cardioLow],
    ['won', activityColors.cardioLow],
  ] as const)('glows for the %s state in the right color', async (state, color) => {
    const screen = await renderWithProviders(<ChallengeStatusCardV2 challenge={buildChallenge({ state })} />);

    expect(JSON.stringify(screen.toJSON())).toContain(`${color}4D`);
  });

  it('sets the camera and the Add photo label in plain paper, not the accent color', async () => {
    const screen = await renderWithProviders(<ChallengeStatusCardV2 challenge={buildChallenge()} />);

    expect(StyleSheet.flatten(screen.getByText('Add photo').props.style)).toMatchObject({
      color: colors.paper,
      opacity: 1,
    });
    // The camera icon is drawn in paper too.
    expect(JSON.stringify(screen.toJSON())).toMatch(/"name":"camera-outline","size":26,"color":"#FFFFFF"/);
  });

  it('keeps the photo tile a darker ink inset, so the paper camera stands out', async () => {
    const screen = await renderWithProviders(<ChallengeStatusCardV2 challenge={buildChallenge()} />);

    // `ink` at 62% (`withAlpha` appends the alpha byte 0x9E).
    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${colors.ink}9E"`);
  });

  it('draws its progress track as the light groove, since its text side is scrimmed dark', async () => {
    const screen = await renderWithProviders(<ChallengeStatusCardV2 challenge={buildChallenge()} />);

    // `paper` at 12% (`withAlpha` appends the alpha byte, 0x1F).
    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${colors.paper}1F"`);
  });

  it.each([
    ['rest', colors.rest],
    ['completed', colors.success],
    ['active', activityColors.cardioLow],
  ] as const)('fills the progress bar in the glow color on the %s state', async (state, color) => {
    const screen = await renderWithProviders(<ChallengeStatusCardV2 challenge={buildChallenge({ state })} />);

    expect(JSON.stringify(screen.toJSON())).toContain(`"backgroundColor":"${color}"`);
  });

  it('leaves the activity color out of a rest-day card entirely', async () => {
    const screen = await renderWithProviders(<ChallengeStatusCardV2 challenge={buildChallenge({ state: 'rest' })} />);

    expect(JSON.stringify(screen.toJSON())).not.toContain(activityColors.cardioLow);
  });
});

// Both designs of the card take the same props and make the same decisions —
// which state, which label, what the side panel shows — so the same behavior is
// asserted on the classic card and the glow card.
describe.each([
  ['classic', ChallengeStatusCard],
  ['glow', ChallengeStatusCardV2],
])('Mine card (%s design)', (_design, Card) => {
  it('shows the title and how far along the challenge is', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge()} />);

    expect(screen.getByText('Pilates challenge')).toBeTruthy();
    expect(screen.getByText(/Day 12/)).toBeTruthy();
    expect(screen.getByText(/21/)).toBeTruthy();
  });

  it.each([
    ['active', 'Train day'],
    ['rest', 'Rest day'],
    ['completed', 'Completed'],
    ['won', 'Finished'],
    ['left', 'Left'],
  ] as const)('labels the %s state "%s"', async (state, label) => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge({ state })} />);

    expect(screen.getByText(label)).toBeTruthy();
  });

  it('offers the Add photo shortcut on a train day, and it is its own action from the card', async () => {
    const onPress = jest.fn();
    const onPressAddPhoto = jest.fn();
    const screen = await renderWithProviders(
      <Card challenge={buildChallenge()} onPress={onPress} onPressAddPhoto={onPressAddPhoto} />,
    );

    await fireEvent.press(screen.getByText('Add photo'));

    expect(onPressAddPhoto).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('opens the challenge when the card body is tapped', async () => {
    const onPress = jest.fn();
    const screen = await renderWithProviders(<Card challenge={buildChallenge()} onPress={onPress} />);

    await fireEvent.press(screen.getByText('Pilates challenge'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has no Add photo shortcut once today is done, or on a rest day', async () => {
    for (const state of ['completed', 'rest', 'won', 'left'] as const) {
      const screen = await renderWithProviders(<Card challenge={buildChallenge({ state })} />);
      expect(screen.queryByText('Add photo')).toBeNull();
      await screen.unmount();
    }
  });

  it('shows the latest photo instead of the shortcut when there is one', async () => {
    const screen = await renderWithProviders(
      <Card challenge={buildChallenge({ state: 'completed', latestPhotoUrl: 'https://example.com/photo.jpg' })} />,
    );

    expect(screen.queryByText('Add photo')).toBeNull();
    expect(JSON.stringify(screen.toJSON())).toContain('https://example.com/photo.jpg');
  });

  it('renders for a challenge with no dominant category yet', async () => {
    const screen = await renderWithProviders(<Card challenge={buildChallenge({ dominantActivityCategory: null })} />);

    expect(screen.getByText('Pilates challenge')).toBeTruthy();
  });
});
