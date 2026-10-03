import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';
import { AccentCard } from '../accentCard';
import { activityColors } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';

// The glow is drawn only once the card has been measured; this hands it a size at once.
jest.mock('../accentGlow', () => ({
  AccentGlow: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 300, height: 120 }),
}));

const dithered = (screen: Awaited<ReturnType<typeof render>>) =>
  JSON.stringify(screen.toJSON()).match(/"dither":true/g)?.length ?? 0;

describe('AccentCard glows', () => {
  it('draws the plain glow from the bottom edge alone: a dithered wash and bloom', async () => {
    const screen = await render(
      <AccentCard color={activityColors.mindBody}>
        <RNText>Inside</RNText>
      </AccentCard>,
    );

    expect(dithered(screen)).toBe(2);
  });

  it('draws it from BOTH the top and the bottom edge when asked (the Space cards): two half-moons', async () => {
    const screen = await render(
      <AccentCard color={activityColors.mindBody} twinGlow>
        <RNText>Inside</RNText>
      </AccentCard>,
    );

    expect(dithered(screen)).toBe(4);
  });

  it('draws a mesh recipe instead, whatever twinGlow says', async () => {
    const recipe = getMeshRecipe('mine', 'mindBody');
    const screen = await render(
      <AccentCard color={activityColors.mindBody} glowRecipe={recipe} twinGlow>
        <RNText>Inside</RNText>
      </AccentCard>,
    );

    // One dithered gradient per field, plus the scrim (Mine has no top fade).
    expect(dithered(screen)).toBe(recipe.blobs.length + 1);
  });
});
