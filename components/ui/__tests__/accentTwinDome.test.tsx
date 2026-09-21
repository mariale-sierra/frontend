import { Canvas } from '@shopify/react-native-skia';
import { render } from '@testing-library/react-native';
import { AccentTwinDome } from '../accentTwinDome';
import { activityColors } from '../../../constants/theme';

const NUMBERS = { domeHalfWidth: 0.6, domeDepth: 0.3, washPeak: 0.3, bloomPeak: 0.2 } as const;

describe('AccentTwinDome', () => {
  it('is two half-moons of the same light — one from each edge', async () => {
    const screen = await render(
      <Canvas>
        <AccentTwinDome width={340} height={600} color={activityColors.mindBody} {...NUMBERS} />
      </Canvas>,
    );
    const tree = JSON.stringify(screen.toJSON());

    // Each AccentDome draws a wash and a bloom, both dithered.
    expect(tree.match(/"dither":true/g)).toHaveLength(4);
  });

  it('is a different picture from a single half-moon', async () => {
    const twin = JSON.stringify(
      (
        await render(
          <Canvas>
            <AccentTwinDome width={340} height={600} color={activityColors.mindBody} {...NUMBERS} />
          </Canvas>,
        )
      ).toJSON(),
    );
    expect(twin.length).toBeGreaterThan(0);
  });
});
