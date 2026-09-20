import { Canvas } from '@shopify/react-native-skia';
import { fireEvent, render } from '@testing-library/react-native';
import { AccentDome } from '../accentDome';
import { AccentGlow } from '../accentGlow';
import { activityColors, colors } from '../../../constants/theme';

const GLOW = { domeHalfWidth: 0.62, domeDepth: 0.8, washPeak: 0.24, bloomPeak: 0.1 } as const;

describe('AccentDome', () => {
  it.each(Object.entries(activityColors))('draws on the bottom edge for the %s activity color', async (_name, color) => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={color} edge="bottom" {...GLOW} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  it.each(['top', 'bottom'] as const)('draws on the %s edge for the neutral fallback color', async (edge) => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={colors.primary} edge={edge} {...GLOW} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });

  it('draws with a blurred bloom and a grain when asked', async () => {
    const screen = await render(
      <Canvas>
        <AccentDome width={340} height={176} color={activityColors.mindBody} {...GLOW} bloomBlur={12} grainOpacity={0.02} />
      </Canvas>,
    );
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('AccentGlow', () => {
  it('does not capture touches, so the card underneath stays pressable', async () => {
    const screen = await render(<AccentGlow color={activityColors.strength} edge="bottom" {...GLOW} />);
    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it('draws nothing until it has been measured, then fills its parent', async () => {
    const screen = await render(<AccentGlow color={activityColors.strength} edge="bottom" {...GLOW} />);
    expect((screen.toJSON() as { children: unknown[] }).children ?? []).toHaveLength(0);

    await fireEvent(screen.root!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 176 } } });

    expect((screen.toJSON() as { children: unknown[] }).children).toHaveLength(1);
  });

  it('stays undrawn for a box with no size', async () => {
    const screen = await render(<AccentGlow color={activityColors.strength} edge="bottom" {...GLOW} />);

    await fireEvent(screen.root!, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 0, height: 0 } } });

    expect((screen.toJSON() as { children: unknown[] }).children ?? []).toHaveLength(0);
  });
});
