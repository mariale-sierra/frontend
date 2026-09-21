import { Canvas } from '@shopify/react-native-skia';
import { Text as RNText } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ACCENT_VIVID_FACTOR, AccentDome } from '../accentDome';
import { AccentGlow } from '../accentGlow';
import { AccentMesh } from '../accentMesh';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import type { MeshCardKind, MeshRecipeKey } from '../../../constants/meshRecipes';
import { activityColors, colors } from '../../../constants/theme';
import { boostSaturation, rotateHue, withAlpha } from '../../../utils/color';

const DOME = { domeHalfWidth: 0.62, domeDepth: 0.8, washPeak: 0.24, bloomPeak: 0.1 } as const;
const KEYS: MeshRecipeKey[] = [
  'strength',
  'cardioIntense',
  'cardioLow',
  'flexibility',
  'mindBody',
  'functional',
  'rest',
  'completed',
  'default',
];
const ALL_RECIPES = (['mine', 'explore'] as MeshCardKind[]).flatMap((kind) => KEYS.map((key) => [kind, key] as const));

describe('AccentDome', () => {
  it.each(Object.entries(activityColors))('draws on the bottom edge for the %s activity color', async (_name, color) => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={color} edge="bottom" {...DOME} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  it.each(['top', 'bottom'] as const)('draws on the %s edge for the neutral fallback color', async (edge) => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={colors.primary} edge={edge} {...DOME} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  it('draws with a blurred bloom and a grain when asked', async () => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={activityColors.mindBody} {...DOME} bloomBlur={12} grainOpacity={0.02} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  // A light this quiet has only a few dozen 8-bit steps to fall through, and each
  // undithered step shows as a ring (Search / Challenges / Profile's paper light did).
  it('dithers both its wash and its bloom, so the light does not show as rings', async () => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={colors.paper} {...DOME} />
      </Canvas>,
    );

    // Two gradients are dithered: the wash's fade and the bloom.
    expect(JSON.stringify(screen.toJSON()).match(/"dither":true/g)).toHaveLength(2);
  });
});

describe('AccentMesh', () => {
  it.each(ALL_RECIPES)('draws the %s / %s recipe', async (kind, key) => {
    const screen = await render(
      <Canvas>
        <AccentMesh width={340} height={176} color={activityColors.strength} recipe={getMeshRecipe(kind, key)} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  it('dithers every gradient it draws — the fields, the scrim and the top fade', async () => {
    const recipe = getMeshRecipe('explore', 'cardioLow');
    const screen = await render(
      <Canvas>
        <AccentMesh width={340} height={176} color={activityColors.cardioLow} recipe={recipe} />
      </Canvas>,
    );

    // One per field, plus the scrim and the top fade.
    expect(JSON.stringify(screen.toJSON()).match(/"dither":true/g)).toHaveLength(recipe.blobs.length + 2);
  });

  it('draws no scrim for a recipe that has none — the screen backdrop, whose color reaches the left edge', async () => {
    const recipe = getMeshRecipe('screen', 'cardioLow');
    const screen = await render(
      <Canvas>
        <AccentMesh width={390} height={844} color={activityColors.cardioLow} recipe={recipe} />
      </Canvas>,
    );

    // The fields and the arch are the dithered gradients: no scrim, and no top fade either.
    expect(JSON.stringify(screen.toJSON()).match(/"dither":true/g)).toHaveLength(recipe.blobs.length + 1);
  });

  it("cuts a recipe's arch out of its fields: an `ink` field drawn over them, and only for a recipe that has one", async () => {
    const recipe = getMeshRecipe('screen', 'strength');
    const withArch = JSON.stringify(
      (
        await render(
          <Canvas>
            <AccentMesh width={390} height={844} color={activityColors.strength} recipe={recipe} />
          </Canvas>,
        )
      ).toJSON(),
    );
    const without = JSON.stringify(
      (
        await render(
          <Canvas>
            <AccentMesh width={390} height={844} color={activityColors.strength} recipe={{ ...recipe, arch: undefined }} />
          </Canvas>,
        )
      ).toJSON(),
    );
    const dominant = recipe.blobs.find((blob) => blob.hue === 0)!;
    const inkAtCore = withAlpha(colors.ink, recipe.arch!.peak);

    // The screen recipe has no scrim, so this ink can only be the arch...
    expect(without).not.toContain(inkAtCore);
    expect(withArch).toContain(inkAtCore);
    // ...and it is drawn after (over) the fields.
    const dominantColor = withAlpha(rotateHue(boostSaturation(activityColors.strength, ACCENT_VIVID_FACTOR), 0), dominant.peak);
    expect(withArch.indexOf(inkAtCore)).toBeGreaterThan(withArch.indexOf(dominantColor));
  });

  it.each(Object.entries(activityColors))('draws for the %s activity color as its base', async (_name, color) => {
    const screen = await render(
      <Canvas>
        <AccentMesh width={340} height={176} color={color} recipe={getMeshRecipe('explore', 'mindBody')} grainOpacity={0.02} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  // The saturation has to match the dome light behind the Challenge-Info / progress
  // screens and Home: the same boost on the same base, dimmed only by alpha. Taking
  // the color's lightness down instead over-saturates a pastel into a neon.
  it.each(Object.entries(activityColors))(
    'makes the %s field the way the dome makes its light — boosted, then only dimmed by its alpha',
    async (_name, color) => {
      const recipe = getMeshRecipe('mine', 'strength');
      const dominant = recipe.blobs.find((blob) => blob.hue === 0)!;
      const screen = await render(
        <Canvas>
          <AccentMesh width={340} height={176} color={color} recipe={recipe} />
        </Canvas>,
      );

      expect(JSON.stringify(screen.toJSON())).toContain(
        withAlpha(rotateHue(boostSaturation(color, ACCENT_VIVID_FACTOR), 0), dominant.peak),
      );
    },
  );

  it.each([colors.rest, colors.success, colors.primary, colors.neutral])(
    'draws for the state and fallback color %s as its base',
    async (color) => {
      const screen = await render(
        <Canvas>
          <AccentMesh width={340} height={176} color={color} recipe={getMeshRecipe('mine', 'default')} />
        </Canvas>,
      );
      expect(screen.toJSON()).toBeTruthy();
    },
  );
});

describe('AccentGlow', () => {
  const drawSomething = () => <RNText>drawn</RNText>;

  it('does not capture touches, so the card underneath stays pressable', async () => {
    const screen = await render(<AccentGlow>{drawSomething}</AccentGlow>);
    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it('draws nothing until it has been measured, then fills its parent', async () => {
    const screen = await render(<AccentGlow>{drawSomething}</AccentGlow>);
    expect((screen.toJSON() as { children: unknown[] }).children ?? []).toHaveLength(0);

    await fireEvent(screen.root!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 176 } } });

    expect((screen.toJSON() as { children: unknown[] }).children).toHaveLength(1);
  });

  it('hands what it draws the size that was measured', async () => {
    const drawn = jest.fn(() => null);
    const screen = await render(<AccentGlow>{drawn}</AccentGlow>);

    await fireEvent(screen.root!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 176 } } });

    expect(drawn).toHaveBeenLastCalledWith({ width: 340, height: 176 });
  });

  it('stays undrawn for a box with no size', async () => {
    const screen = await render(<AccentGlow>{drawSomething}</AccentGlow>);

    await fireEvent(screen.root!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } } });

    expect((screen.toJSON() as { children: unknown[] }).children ?? []).toHaveLength(0);
  });
});
