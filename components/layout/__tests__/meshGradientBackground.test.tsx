import { render } from '@testing-library/react-native';
import { MeshGradientBackground } from '../MeshGradientBackground';

// `vivid` is the animated rainbow, which needs a frame callback and a focused
// screen; these stand in for both.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useFrameCallback: () => ({ setActive: jest.fn(), isActive: false, callbackId: 1 }),
}));
jest.mock('expo-router', () => ({ useIsFocused: () => true }));

// The vivid look is the rainbow (see `RainbowGradientBackground` and its own
// tests); the soft look is what the screens get behind the colored cards while the
// paper switch is off. Both are checked, so switching between them is safe.
describe.each(['vivid', 'soft'] as const)('MeshGradientBackground (%s look)', (look) => {
  it('renders', async () => {
    const screen = await render(<MeshGradientBackground look={look} />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it('does not capture touches, so the screen above it stays usable', async () => {
    const screen = await render(<MeshGradientBackground look={look} />);
    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });
});

describe('MeshGradientBackground looks', () => {
  it('is the rainbow when no look is given', async () => {
    const byDefault = JSON.stringify((await render(<MeshGradientBackground />)).toJSON());
    const vivid = JSON.stringify((await render(<MeshGradientBackground look="vivid" />)).toJSON());

    expect(byDefault).toBe(vivid);
  });

  it('draws the moving rainbow for vivid and the static blurred mesh for soft', async () => {
    const vivid = JSON.stringify((await render(<MeshGradientBackground look="vivid" />)).toJSON());
    const soft = JSON.stringify((await render(<MeshGradientBackground look="soft" />)).toJSON());

    // The soft mesh blurs and grains; the rainbow does neither (it is dithered, and moves).
    expect(soft).toContain('FractalNoise');
    expect(vivid).not.toContain('FractalNoise');
    expect(vivid).toContain('"dither":true');
  });
});
