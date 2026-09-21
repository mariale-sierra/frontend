import type { ActivityType } from '../types/activity';

/**
 * Recipes for the challenge cards' mesh glow (`AccentMesh`): a few very large,
 * soft "fields" of color — radial gradients stretched and tilted, often wider than
 * the card itself — added together so where they overlap they make in-between
 * hues, and a scrim (and, on Explore, a fade from the top) that thins the whole
 * thing out into the card's `ink`.
 *
 * What the look asks for, and where it lives:
 *  - BIG fields, with a long gradual fade (`MESH_FALLOFF`) into the dark, so the
 *    transitions between colors are wide and there are no bands.
 *  - FEW colors, widely spaced: three fields, each its own color.
 *  - UNEQUAL: one field dominates (the challenge's own color), the second is
 *    weaker and smaller, and the third barely shows.
 *  - DIM, as if seen through tinted glass: low peaks, never neon. The colors are
 *    dimmed by their alpha only — like the dome light behind the Challenge-Info /
 *    progress screens and Home, whose saturation they match — not by darkening
 *    them, which over-saturates a pastel.
 *
 * A recipe is built from three things, so nothing is written twice:
 *  - a LAYOUT per card kind (`LAYOUTS`) — where the three fields go for that kind
 *    of card. Mine's: the dominant field along the bottom, weighted to the right,
 *    the second in the top-right corner, leaning toward the middle of the card,
 *    and the third barely there in the bottom-left corner. Explore's: the
 *    dominant field low and left of the middle, the second in the bottom-right
 *    corner, the third barely there up the left — nothing in the top-right, where
 *    its tick ring is — with a long fade toward the top. The log picker's deck
 *    card (`deck`) is a little square with its light at the TOP instead: two long
 *    ribbons of color crossing there, one along the top edge and one rising from the
 *    right, a faint third low on the left, and the bottom, where the photo is, dark.
 *  - a PALETTE per key (`PALETTES`) — the three hues, as degrees of rotation from
 *    the challenge's own color (the same way the Challenge-Info and progress
 *    backdrops derive their tones), and how strong the whole recipe is.
 *  - a small VARIATION per key and card kind (`VARIATIONS`) — a rotation, a
 *    sideways nudge, a lift (and, for Explore, a mirror) so each activity's
 *    gradient has its own composition, not just its own colors.
 *
 * Coordinates are fractions of the card: `x` of its width and `y` of its height
 * (past 1 runs off the edge), and `rx` / `ry` (a field's half-size along and
 * across its own axis) of its WIDTH, so a field keeps its shape when rotated.
 * Tuned by eye — expect to nudge these.
 */

/** Which palette to use: one per activity, one each for the rest-day and
 * completed-today states, and a fallback for a challenge with no dominant
 * activity yet. */
export type MeshRecipeKey = ActivityType | 'rest' | 'completed' | 'default';

/** Which card the mesh is for — each has its own layout. `deck` is the log
 * picker's little square card. */
export type MeshCardKind = 'mine' | 'explore' | 'deck';

export interface MeshBlob {
  /** Degrees the field's hue is rotated from the base color. */
  hue: number;
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Rotation in degrees, clockwise. */
  angle: number;
  /** Alpha at the field's core. */
  peak: number;
}

/** A fade into the card's `ink` from one of its edges. */
export interface MeshFade {
  /** Alpha of `ink` at the edge. */
  peak: number;
  /** How far in it reaches, as a fraction of the card's width (left) or height (top). */
  reach: number;
}

export interface MeshRecipe {
  blobs: MeshBlob[];
  /** Fades in from the left edge, over the text side. */
  scrim: MeshFade;
  /** Fades in from the top edge, so the gradient thins out upward. Optional. */
  topFade?: MeshFade;
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

/** A field's place in a layout; `hue` is which of the palette's three hues it
 * takes (0 is the challenge's own color, the dominant one). */
interface BlobSlot extends Omit<MeshBlob, 'hue'> {
  hue: 0 | 1 | 2;
}

interface Layout {
  blobs: BlobSlot[];
  scrim: MeshFade;
  topFade?: MeshFade;
}

const LAYOUTS: Record<MeshCardKind, Layout> = {
  // The photo tile covers most of the right side, so the glow that shows there is
  // what shows through and around it. The dominant field is huge and sits on the
  // bottom edge, weighted right; the second fills the top-right corner and is
  // turned to lean down toward the middle of the card, so the corner reaches into
  // the card instead of ending in a lobe; the third is a faint patch of the other
  // side of the palette in the bottom-left corner. The scrim is light so the
  // bottom-left (the progress bar) still has color under it.
  mine: {
    blobs: [
      { hue: 0, x: 0.62, y: 1.02, rx: 1.15, ry: 0.6, angle: -8, peak: 0.38 },
      { hue: 1, x: 1.02, y: 0.12, rx: 0.85, ry: 0.45, angle: -26, peak: 0.26 },
      { hue: 2, x: 0, y: 1, rx: 0.55, ry: 0.32, angle: 0, peak: 0.12 },
    ],
    scrim: { peak: 0.2, reach: 0.45 },
  },
  // Centered low, away from the tick ring on the right: the dominant field runs
  // tilted up to the right from the bottom left of the middle, the second warms
  // the bottom-right corner, and the third is a faint touch up the left. The top
  // fade is nearly full strength and reaches all the way down, so the color thins
  // out gradually over the whole card and the top is left dark.
  explore: {
    blobs: [
      { hue: 0, x: 0.4, y: 1.05, rx: 1.1, ry: 0.5, angle: -14, peak: 0.38 },
      { hue: 1, x: 0.95, y: 0.95, rx: 0.75, ry: 0.4, angle: 12, peak: 0.25 },
      { hue: 2, x: 0.02, y: 0.7, rx: 0.5, ry: 0.3, angle: 35, peak: 0.11 },
    ],
    scrim: { peak: 0.2, reach: 0.45 },
    topFade: { peak: 0.9, reach: 1 },
  },
  // A little square, about as tall as it is wide, its light at the TOP: two long
  // ribbons of color that cross there — the dominant one sweeping along the top edge and
  // dipping to the right, the second rising from the right edge up and to the left across
  // it — with a faint patch of the third low on the left. The bottom, where the photo is,
  // is left dark, so the color is behind the title and the photo sits under it.
  deck: {
    blobs: [
      { hue: 0, x: 0.3, y: -0.05, rx: 1.2, ry: 0.5, angle: 14, peak: 0.38 },
      { hue: 1, x: 1.0, y: 0.2, rx: 0.95, ry: 0.38, angle: -32, peak: 0.3 },
      { hue: 2, x: 0.05, y: 0.7, rx: 0.8, ry: 0.45, angle: 20, peak: 0.11 },
    ],
    scrim: { peak: 0.14, reach: 0.35 },
  },
};

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

interface Palette {
  /** Degrees of hue rotation from the base color, for each of the three hues. */
  hues: [number, number, number];
  /** Scales every field's alpha (default 1). */
  peakScale?: number;
}

// Each palette (and variation) belongs to a COLOR, not a name: strength and
// cardioIntense swapped colors on 2026-09-20, and their entries swapped with them,
// so each color's gradient is exactly what it was.
const PALETTES: Record<MeshRecipeKey, Palette> = {
  // Gold: orange-red, yellow-green.
  strength: { hues: [0, -28, 32] },
  // Lime: gold-orange, green.
  cardioIntense: { hues: [0, -30, 48] },
  // Aqua: blue, green.
  cardioLow: { hues: [0, 38, -38] },
  // Periwinkle: violet, cyan.
  flexibility: { hues: [0, 42, -38] },
  // Pink: red-pink, violet.
  mindBody: { hues: [0, 45, -48] },
  // Sky blue: aqua, blue.
  functional: { hues: [0, -34, 40] },
  // A rest day (lavender).
  rest: { hues: [0, 40, -35] },
  // Today completed (green).
  completed: { hues: [0, 38, -38] },
  // No dominant activity yet: the base color is the warm off-white, which has no
  // hue to rotate, so this is a quiet monochrome — weaker, so it reads as soft
  // gray light, not glare.
  default: { hues: [0, 0, 0], peakScale: 0.6 },
};

// ---------------------------------------------------------------------------
// Variations
// ---------------------------------------------------------------------------

interface Variation {
  /** Degrees added to every field's rotation. */
  angle: number;
  /** Added to every x position (a fraction of the card's width). */
  shiftX: number;
  /** Mirror the layout left to right (then `shiftX` applies to the mirrored x). */
  mirror?: boolean;
  /** Scales how far every field sits above the card's bottom edge (default 1): over
   * 1 lifts the gradient higher, under 1 sinks it lower. */
  lift?: number;
}

const VARIATIONS: Record<MeshCardKind, Record<MeshRecipeKey, Variation>> = {
  // Mine is never mirrored — its mass stays on the right, away from the text.
  mine: {
    strength: { angle: 12, shiftX: 0.03 },
    cardioIntense: { angle: 0, shiftX: 0 },
    cardioLow: { angle: -8, shiftX: -0.04 },
    flexibility: { angle: -14, shiftX: 0.02 },
    mindBody: { angle: 6, shiftX: -0.02 },
    functional: { angle: 10, shiftX: -0.03 },
    rest: { angle: -4, shiftX: 0 },
    completed: { angle: 8, shiftX: 0.02 },
    default: { angle: 0, shiftX: 0 },
  },
  // Explore is centered, so it can mirror to swap which side the dominant field
  // leans to, and lift or sink the whole gradient.
  explore: {
    strength: { angle: 10, shiftX: 0.05, mirror: true, lift: 1.12 },
    cardioIntense: { angle: 0, shiftX: 0, lift: 1 },
    cardioLow: { angle: -6, shiftX: -0.04, lift: 0.9 },
    flexibility: { angle: -12, shiftX: 0.03, mirror: true, lift: 1.06 },
    mindBody: { angle: 8, shiftX: -0.03, lift: 1.1 },
    functional: { angle: -10, shiftX: 0.04, mirror: true, lift: 0.94 },
    rest: { angle: 0, shiftX: 0, lift: 0.96 },
    completed: { angle: 6, shiftX: 0.02, mirror: true, lift: 1.04 },
    default: { angle: 0, shiftX: 0, lift: 1 },
  },
  // The deck card is centered too, so it mirrors: which side the second ribbon comes from.
  deck: {
    strength: { angle: 6, shiftX: 0.02 },
    cardioIntense: { angle: 0, shiftX: 0 },
    cardioLow: { angle: -6, shiftX: -0.03, mirror: true },
    flexibility: { angle: -8, shiftX: 0.02, mirror: true },
    mindBody: { angle: 5, shiftX: -0.02 },
    functional: { angle: 8, shiftX: 0.03, mirror: true },
    rest: { angle: -4, shiftX: 0 },
    completed: { angle: 6, shiftX: 0.02, mirror: true },
    default: { angle: 0, shiftX: 0 },
  },
};

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

function buildRecipe(kind: MeshCardKind, key: MeshRecipeKey): MeshRecipe {
  const layout = LAYOUTS[kind];
  const palette = PALETTES[key];
  const { angle, shiftX, mirror = false, lift = 1 } = VARIATIONS[kind][key];
  const peakScale = palette.peakScale ?? 1;

  return {
    blobs: layout.blobs.map(({ hue, x, y, angle: fieldAngle, peak, ...size }) => ({
      ...size,
      // Where the field ends up once this key's variation is applied.
      x: (mirror ? 1 - x : x) + shiftX,
      y: 1 - (1 - y) * lift,
      angle: (mirror ? -fieldAngle : fieldAngle) + angle,
      hue: palette.hues[hue],
      peak: peak * peakScale,
    })),
    scrim: layout.scrim,
    topFade: layout.topFade,
  };
}

const KEYS = Object.keys(PALETTES) as MeshRecipeKey[];

/** Every recipe, built once: `MESH_RECIPES[card][key]`. */
export const MESH_RECIPES: Record<MeshCardKind, Record<MeshRecipeKey, MeshRecipe>> = {
  mine: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('mine', key)])) as Record<MeshRecipeKey, MeshRecipe>,
  explore: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('explore', key)])) as Record<MeshRecipeKey, MeshRecipe>,
  deck: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('deck', key)])) as Record<MeshRecipeKey, MeshRecipe>,
};

/** The recipe for a kind of card and a glow key (see `getChallengeGlowKey`). */
export function getMeshRecipe(card: MeshCardKind, key: MeshRecipeKey): MeshRecipe {
  return MESH_RECIPES[card][key];
}
