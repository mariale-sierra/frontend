import { boostHsvSaturation, boostSaturation, rotateHue } from '../color';

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

describe('hueOf', () => {
  const { hueOf } = require('../color');

  it('reads a color\'s hue, and null for grays', () => {
    expect(hueOf('#FF0000')).toBeCloseTo(0);
    expect(hueOf('#00FF00')).toBeCloseTo(120);
    expect(hueOf('#808080')).toBeNull();
  });
});

// Sprint 10: deepens a color whose HSL saturation is already maxed (strength's amber).
describe('boostHsvSaturation', () => {
  it('deepens a bright color toward its pure hue, keeping hue and brightness', () => {
    // #FFBE51: HSV saturation 68% -> 82%, still full brightness (FF), same amber hue.
    expect(boostHsvSaturation('#FFBE51', 1.2)).toBe('#FFB12E');
    expect(boostSaturation('#FFBE51', 1.2)).toBe('#FFBE51');
  });

  it('never goes past the pure hue', () => {
    expect(boostHsvSaturation('#FF8000', 2)).toBe('#FF8000');
  });

  it('leaves grays and non-hex values alone', () => {
    expect(boostHsvSaturation('#808080', 1.5)).toBe('#808080');
    expect(boostHsvSaturation('red', 1.5)).toBe('red');
  });
});
