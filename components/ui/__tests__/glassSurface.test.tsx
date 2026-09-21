import { render } from '@testing-library/react-native';
import { GlassBackdrop } from '../glassSurface';
import { colors, glass } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

const tree = async (element: React.ReactElement) => JSON.stringify((await render(element)).toJSON());

describe('GlassBackdrop', () => {
  it('is a blur under the shared translucent surface tint', async () => {
    const json = await tree(<GlassBackdrop />);

    expect(json).toContain('ExpoBlur');
    expect(json).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.tintOpacity)}"`);
  });

  it('takes a lighter tint when asked, with the same blur', async () => {
    const json = await tree(<GlassBackdrop tintOpacity={glass.badgeTintOpacity} />);

    expect(json).toContain('ExpoBlur');
    expect(json).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.badgeTintOpacity)}"`);
    expect(json).not.toContain(withAlpha(colors.surface, glass.tintOpacity));
  });
});
