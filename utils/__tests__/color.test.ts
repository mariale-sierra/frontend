import { boostSaturation, rotateHue } from '../color';

describe('boostSaturation', () => {
  it('keeps hue and lightness while raising saturation', () => {
    // #6B90DB is HSL(219, 62%, 66%) — a 1.35x boost should land on a more vivid blue, not shift hue.
    const boosted = boostSaturation('#6B90DB', 1.35);
    expect(boosted).not.toBe('#6B90DB');
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(boosted.slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
  });

  it('clamps saturation at 1 instead of overshooting', () => {
    expect(boostSaturation('#FF0000', 5)).toBe('#FF0000');
  });

  it('returns gray and non-6-digit hex values unchanged', () => {
    expect(boostSaturation('#808080', 2)).toBe('#808080');
    expect(boostSaturation('#FFF', 2)).toBe('#FFF');
  });
});

describe('rotateHue', () => {
  it('rotates hue while keeping saturation and lightness', () => {
    // Pure red rotated 120 degrees is pure green, 240 is pure blue.
    expect(rotateHue('#FF0000', 120)).toBe('#00FF00');
    expect(rotateHue('#FF0000', 240)).toBe('#0000FF');
  });

  it('wraps around past 360 and handles negative rotations', () => {
    expect(rotateHue('#FF0000', 480)).toBe(rotateHue('#FF0000', 120));
    expect(rotateHue('#FF0000', -120)).toBe('#0000FF');
  });

  it('returns gray and non-6-digit hex values unchanged', () => {
    expect(rotateHue('#808080', 90)).toBe('#808080');
    expect(rotateHue('#FFF', 90)).toBe('#FFF');
  });
});
