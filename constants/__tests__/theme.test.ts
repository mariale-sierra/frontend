import { activityColors, colors, glass, textOpacity } from '../theme';

// Relative luminance of a 6-digit hex color, and the contrast ratio between two.
function luminance(hex: string) {
  const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const [r, g, b] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastAgainstInk(hex: string) {
  return (luminance(hex) + 0.05) / (luminance(colors.ink) + 0.05);
}

// Hue in degrees, 0-360.
function hue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  if (delta === 0) return 0;
  const sector = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return (sector * 60 + 360) % 360;
}

describe('activity colors', () => {
  it.each([...Object.entries(activityColors), ['rest', colors.rest]])(
    'the %s color still pairs with ink text — at least 9:1 against ink',
    (_name, color) => {
      expect(contrastAgainstInk(color)).toBeGreaterThanOrEqual(9);
    },
  );

  it('keeps strength warmer than cardio intense — amber-gold beside the lime', () => {
    expect(hue(activityColors.strength)).toBeLessThan(hue(activityColors.cardioIntense) - 15);
    // Warm: in the orange-to-yellow range, not pushed toward green.
    expect(hue(activityColors.strength)).toBeGreaterThan(30);
    expect(hue(activityColors.strength)).toBeLessThan(42);
  });

  it('gives every activity its own color', () => {
    expect(new Set(Object.values(activityColors)).size).toBe(Object.values(activityColors).length);
  });
});

describe('glass badges', () => {
  it('are tinted lighter than the sheets and the nav bar, but still tinted', () => {
    expect(glass.badgeTintOpacity).toBeGreaterThan(0);
    expect(glass.badgeTintOpacity).toBeLessThan(glass.tintOpacity);
  });

  // The light behind a glass badge is at most about this strong (the exercise screen's
  // wash peaks at .34 and is weaker where the badges sit); their `paper` label must
  // still read over the brightest activity color at that strength.
  const LIGHT_BEHIND_BADGE = 0.3;
  const mix = (top: number[], bottom: number[], share: number) => top.map((value, i) => value * share + bottom[i] * (1 - share));
  const rgb = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const toHex = (channels: number[]) => '#' + channels.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('');

  it.each(Object.entries(activityColors))('keep a readable paper label over %s light behind them', (_name, color) => {
    const behind = mix(rgb(color), rgb(colors.ink), LIGHT_BEHIND_BADGE);
    const pill = mix(rgb(colors.surface), behind, glass.badgeTintOpacity);
    const label = mix(rgb(colors.paper), pill, textOpacity.primary);

    const contrast = (luminance(toHex(label)) + 0.05) / (luminance(toHex(pill)) + 0.05);

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});

describe('glass highlight (popups and toasts)', () => {
  it('lays a soft sheen, quieter than the tint it sits on', () => {
    expect(glass.sheenOpacity).toBeGreaterThan(0);
    expect(glass.sheenOpacity).toBeLessThan(glass.tintOpacity / 2);
  });

  it('lights the rim brightest at the top-left, then a fainter echo at the bottom-right, and least in between', () => {
    const { bright, dim, echo } = glass.rimOpacity;

    expect(bright).toBeGreaterThan(echo);
    expect(echo).toBeGreaterThan(dim);
    expect(dim).toBeGreaterThan(0);
    expect(bright).toBeLessThanOrEqual(1);
  });

  it('makes the rim a real outline — brighter than the plain hairline at its brightest', () => {
    expect(glass.rimOpacity.bright).toBeGreaterThan(glass.borderOpacity);
  });
});
