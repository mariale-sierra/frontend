import { render } from '@testing-library/react-native';
import { ChallengeMeshBackdrop } from '../challengeMeshBackdrop';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import { activityColors, colors } from '../../../constants/theme';
import type { ActivityType } from '../../../types/activity';
import { boostSaturation, rotateHue, withAlpha } from '../../../utils/color';
import { ACCENT_VIVID_FACTOR } from '../../ui/accentDome';

const ACTIVITIES = Object.keys(activityColors) as ActivityType[];

describe('ChallengeMeshBackdrop', () => {
  it.each(ACTIVITIES)('renders for the %s activity', async (category) => {
    const screen = await render(<ChallengeMeshBackdrop category={category} />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it.each([null, undefined])('renders for a challenge with no dominant activity yet (%s)', async (category) => {
    const screen = await render(<ChallengeMeshBackdrop category={category} />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it("doesn't capture touches, so it never blocks the screen above it", async () => {
    const screen = await render(<ChallengeMeshBackdrop category="strength" />);
    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it("draws the activity's own screen recipe, in the activity's color", async () => {
    const screen = await render(<ChallengeMeshBackdrop category="cardioLow" />);
    const drawn = JSON.stringify(screen.toJSON());
    const dominant = getMeshRecipe('screen', 'cardioLow').blobs.find((blob) => blob.hue === 0)!;

    expect(drawn).toContain(withAlpha(rotateHue(boostSaturation(activityColors.cardioLow, ACCENT_VIVID_FACTOR), 0), dominant.peak));
  });

  it('draws over ink, the dark every other backdrop starts from', async () => {
    const screen = await render(<ChallengeMeshBackdrop category="strength" />);

    expect(JSON.stringify(screen.toJSON())).toContain(colors.ink);
  });

  it('gives each activity its own gradient, not one recolored', async () => {
    const drawn = await Promise.all(
      ACTIVITIES.map(async (category) => JSON.stringify((await render(<ChallengeMeshBackdrop category={category} />)).toJSON())),
    );

    expect(new Set(drawn).size).toBe(ACTIVITIES.length);
  });
});
