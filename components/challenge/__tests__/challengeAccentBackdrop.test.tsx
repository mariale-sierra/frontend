import { render } from '@testing-library/react-native';
import { ChallengeAccentBackdrop } from '../challengeAccentBackdrop';
import { activityColors, colors } from '../../../constants/theme';

describe('ChallengeAccentBackdrop', () => {
  it.each(Object.entries(activityColors))('renders for the %s activity color', async (_name, color) => {
    const screen = await render(<ChallengeAccentBackdrop color={color} />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it('renders for the neutral fallback color (no dominant category), where hue rotation is a no-op', async () => {
    const screen = await render(<ChallengeAccentBackdrop color={colors.neutral} />);
    expect(screen.toJSON()).toBeTruthy();
  });

  it("doesn't capture touches, so it never blocks the screen above it", async () => {
    const screen = await render(<ChallengeAccentBackdrop color={activityColors.strength} />);
    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });
});
