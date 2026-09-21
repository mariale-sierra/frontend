import { AccessibilityInfo } from 'react-native';
import { render } from '@testing-library/react-native';
import { useIsFocused } from 'expo-router';
import { useFrameCallback } from 'react-native-reanimated';
import { RainbowGradientBackground } from '../RainbowGradientBackground';
import { RAINBOW_FIELDS } from '../../../constants/rainbowBackground';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  // The mock has no frame callback; this one just records whether it was switched on.
  useFrameCallback: jest.fn(),
}));
jest.mock('expo-router', () => ({ useIsFocused: jest.fn() }));

const setActive = jest.fn();

function lastActive() {
  return setActive.mock.calls[setActive.mock.calls.length - 1]?.[0];
}

describe('RainbowGradientBackground', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFrameCallback as jest.Mock).mockReturnValue({ setActive, isActive: false, callbackId: 1 });
    (useIsFocused as jest.Mock).mockReturnValue(true);
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders, and does not capture touches, so the screen above it stays usable', async () => {
    const screen = await render(<RainbowGradientBackground />);

    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it('draws one dithered field for each of the rainbow fields, and no grain shader', async () => {
    const screen = await render(<RainbowGradientBackground />);
    const tree = JSON.stringify(screen.toJSON());

    expect(tree.match(/"dither":true/g)).toHaveLength(RAINBOW_FIELDS.length);
    expect(tree).not.toContain('FractalNoise');
  });

  it('moves while its screen is in front', async () => {
    await render(<RainbowGradientBackground />);

    expect(lastActive()).toBe(true);
  });

  it('stops moving when its screen is no longer in front (another one is on top of it)', async () => {
    (useIsFocused as jest.Mock).mockReturnValue(false);

    await render(<RainbowGradientBackground />);

    expect(lastActive()).toBe(false);
  });

  it('holds still for a person who has asked their phone to reduce motion', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);

    await render(<RainbowGradientBackground />);
    // The setting arrives a moment after the first render.
    await Promise.resolve();
    await Promise.resolve();

    expect(lastActive()).toBe(false);
  });
});
