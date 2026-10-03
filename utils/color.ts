export function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return hex;
  }

  const value = Math.max(0, Math.min(1, alpha));
  const suffix = Math.round(value * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `#${normalized}${suffix}`;
}

/** Applies `change` to a 6-digit hex color's HSL (h in degrees, s/l in 0-1).
 * Grays and non-6-digit hex values are returned unchanged. */
function transformHsl(hex: string, change: (h: number, s: number, l: number) => [number, number, number]) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return hex;
  }

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  if (d === 0) {
    return hex;
  }

  const l0 = (max + min) / 2;
  const s0 = d / (1 - Math.abs(2 * l0 - 1));
  let h0: number;
  if (max === r) h0 = ((g - b) / d) % 6;
  else if (max === g) h0 = (b - r) / d + 2;
  else h0 = (r - g) / d + 4;
  h0 = (h0 * 60 + 360) % 360;

  const [h, s, l] = change(h0, s0, l0);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
}

/** Scales a hex color's HSL saturation by `factor` (clamped to 1), keeping hue
 * and lightness. Non-6-digit hex values are returned unchanged. */
export function boostSaturation(hex: string, factor: number) {
  return transformHsl(hex, (h, s, l) => [h, Math.min(1, s * factor), l]);
}

/** Mixes a 6-digit hex color toward white by `amount` (0 = unchanged, 1 =
 * pure white) — a straight per-channel RGB lerp, not an HSL lightness bump
 * (which can visibly shift hue/saturation as it approaches white). For a
 * "hot" highlight core — a light source's own center reads near-white, with
 * its actual color showing more in the surrounding halo, not at the core
 * itself. Non-6-digit hex values are returned unchanged. */
export function lighten(hex: string, amount: number) {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return hex;
  }

  const t = Math.max(0, Math.min(1, amount));
  const mix = (start: number) => {
    const value = parseInt(normalized.slice(start, start + 2), 16);
    return Math.round(value + (255 - value) * t)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  };

  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

/** Rotates a hex color's hue by `degrees` (positive or negative), keeping
 * saturation and lightness — for neighboring, harmonious tones of one color.
 * Grays and non-6-digit hex values are returned unchanged. */
export function rotateHue(hex: string, degrees: number) {
  return transformHsl(hex, (h, s, l) => [(((h + degrees) % 360) + 360) % 360, s, l]);
}
