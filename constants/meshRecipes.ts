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
 * picker's little square card, `space` is the Spaces' card (seven ORBS, not three big
 * fields), and `screen` is not a card at all: the backdrop of the Log Metrics screen,
 * the same mesh at the size of a phone's screen. */
export type MeshCardKind = 'mine' | 'explore' | 'deck' | 'space' | 'screen';

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

/** A dome of `ink`, low on the screen, which the fields' color is carved out of: where a
 * fade ends the color in a straight edge, an arch ends it in a curve — higher in the
 * middle, running lower down the sides. Placed like a field (its `x` / `y` the center,
 * `rx` / `ry` the half-sizes) but never tilted, and eased out the same way. */
export type MeshArch = Omit<MeshBlob, 'hue' | 'angle'>;

export interface MeshRecipe {
  blobs: MeshBlob[];
  /** Fades in from the left edge, over the text side. */
  scrim: MeshFade;
  /** Fades in from the top edge, so the gradient thins out upward. Optional. */
  topFade?: MeshFade;
  /** Carves the color into an arch (`ink` over the fields). Optional. */
  arch?: MeshArch;
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
  arch?: MeshArch;
}

const LAYOUTS: Record<MeshCardKind, Layout> = {
  // The photo tile covers most of the right side, so the glow that shows there is
  // what shows through and around it. The dominant field is huge and sits on the
  // bottom edge, weighted right; the second fills the top-right corner and is
  // turned to lean down toward the middle of the card, so the corner reaches into
  // the card instead of ending in a lobe; the third is a faint patch of the other
  // side of the palette in the bottom-left corner. The scrim is light so the
  // bottom-left (the progress bar) still has color under it.
  // Reworked 2026-09-22: three rounds cut the PEAKS (brightness) progressively
  // lower, chasing "overdiffused" feedback that was actually about something
  // else — reverted back to the original peaks (0.38/0.26/0.12). The real
  // complaint was the fields' SIZE/SPREAD: "too blurry, the orbs are getting
  // too lost" — big, softly-falling-off fields blend into each other and
  // lose their own shape, which reads as "blurry" regardless of how bright
  // they are. Shrunk each field's `ry` (~25-30%, tightening the vertical
  // spread each orb fades over) instead of `rx`: the dominant field's `rx`
  // has its own floor ("has a huge field along the whole bottom" test,
  // `rx >= 1`) it must keep — a "huge" field along the bottom edge is a
  // deliberate part of this layout, not the diffuseness that was actually
  // the complaint. hue1's `rx` also kept at/above 0.7 — the "stretches
  // toward the middle" test's own floor.
  //
  // UNUSED as of 2026-09-22, kept for reference/reversion (same pattern as
  // `USE_MESH_CARD_GLOW`): `ChallengeStatusCardV2` (Mine, the only real
  // consumer of the `'mine'` kind) no longer passes a `glowRecipe` at all —
  // per explicit request ("scratch the mine cards gradient, give the mine
  // cards the same gradient as the challenge cards in the home screen"), it
  // now falls back to `ChallengeCard`'s default plain half-moon `AccentDome`
  // glow, the same one Home's hero card (`ActiveChallengeItemV2`) already
  // uses. If a mesh glow comes back for Mine cards, this is where it lives.
  mine: {
    blobs: [
      { hue: 0, x: 0.62, y: 1.02, rx: 1.15, ry: 0.44, angle: -8, peak: 0.38 },
      { hue: 1, x: 1.02, y: 0.12, rx: 0.72, ry: 0.32, angle: -26, peak: 0.26 },
      { hue: 2, x: 0, y: 1, rx: 0.46, ry: 0.26, angle: 0, peak: 0.12 },
    ],
    scrim: { peak: 0.2, reach: 0.45 },
  },
  // Centered low, away from the tick ring on the right: the dominant field runs
  // tilted up to the right from the bottom left of the middle, the second warms
  // the bottom-right corner, and the third is a faint touch up the left. The top
  // fade is nearly full strength and reaches all the way down, so the color thins
  // out gradually over the whole card and the top is left dark.
  //
  // Peaks/scrim pushed to this file's own tested ceiling 2026-09-25, per
  // explicit "the explore cards are still very not saturated, are you sure
  // you matched those?" — a real gap in the first pass: that pass left the
  // dominant field's peak completely UNCHANGED (0.38) and only nudged the
  // two weaker fields, pulling back further the moment the overlap-sum test
  // (fields added together where they overlap, `blendMode="plus"` — the
  // same additive model `AccentDome`'s wash+bloom use) tripped past 0.5 for
  // a couple of activity keys. That test's 0.4/0.5 ceiling explicitly cites
  // "the dome light... a wash of 0.39 and a bloom of 0.26" as its own
  // reference (`ChallengeAccentBackdrop`'s full-screen dome, which has
  // always been this strong — not `AccentCard`'s card-level one, which only
  // just caught up to it) — so the ceiling itself was ALREADY calibrated to
  // the right target from the start; the fix was pushing the actual peaks
  // up to meet it, not raising the ceiling further. Dominant now sits at
  // the individual cap (0.4) instead of stopping short of it; the other two
  // pushed up to the ratio floor (max/min >= 2.5, so min = 0.4 / 2.5 =
  // 0.16) and as high as the overlap-sum ceiling allows from there — scrim
  // eased further too (0.15 -> 0.1) so the text side doesn't mute the extra
  // brightness back out. `topFade` is still UNCHANGED — its own tested
  // floor (>= 0.8) is for a different reason (keeps the top-right, where
  // the tick ring sits, dark and readable), not a brightness knob.
  explore: {
    blobs: [
      { hue: 0, x: 0.4, y: 1.05, rx: 1.1, ry: 0.5, angle: -14, peak: 0.4 },
      { hue: 1, x: 0.95, y: 0.95, rx: 0.75, ry: 0.4, angle: 12, peak: 0.3 },
      { hue: 2, x: 0.02, y: 0.7, rx: 0.5, ry: 0.3, angle: 35, peak: 0.16 },
    ],
    scrim: { peak: 0.1, reach: 0.45 },
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
  // A whole screen, about twice as tall as it is wide, with its content in the middle:
  // an INVERTED half-moon — where the info / progress dome is a half-moon of light
  // hanging from the top edge, whose lower edge bulges down in the middle, this ends in
  // an ARCH: the color runs across the whole top and bleeds down toward the middle, and
  // its lower edge curves the other way, higher in the middle and running lower down the
  // sides, so it hugs the screen's edges. Three huge fields, a different color from each
  // top corner and a faint third across the middle, give the color and its flow; the
  // `arch`, a dome of `ink` centered low on the screen, carves them into that shape (its
  // ink is faint at the very top, so the top is lit all along, strong in the middle
  // where the color has bled to). Everything is huge and eased out slowly, so the arch is
  // a soft, long transition, not an edge. No scrim (the text is on the color, in paper),
  // no top fade.
  screen: {
    blobs: [
      { hue: 0, x: -0.05, y: -0.06, rx: 1.7, ry: 1.9, angle: 30, peak: 0.34 },
      { hue: 1, x: 1.05, y: -0.06, rx: 1.6, ry: 1.8, angle: -30, peak: 0.24 },
      { hue: 2, x: 0.5, y: 0.2, rx: 1.6, ry: 1.2, angle: 0, peak: 0.13 },
    ],
    scrim: { peak: 0, reach: 0.3 },
    arch: { x: 0.5, y: 0.7, rx: 0.8, ry: 1.85, peak: 1 },
  },
  // The Spaces' card: the same mesh, but as ORBS — a scatter of round, soft bubbles of
  // light of different sizes, rather than a few huge fields (the other cards' look), so it
  // is more playful (2026-09-20, explicit request: 'more fun, more orbs ... like the
  // explore cards but with its own thing'). The palette has three hues, so the seven orbs
  // repeat them. The big one sits in the bottom-right corner, a medium one and a small
  // one crowd the top-right (under the Join pill), the rest float about the edges and
  // one in the middle right — and the left, where the name and description are, is only
  // dotted with small dim ones, under a light scrim. All round (`rx` = `ry`, no tilt).
  space: {
    blobs: [
      { hue: 0, x: 0.88, y: 0.9, rx: 0.34, ry: 0.34, angle: 0, peak: 0.36 },
      { hue: 1, x: 0.62, y: 0.06, rx: 0.18, ry: 0.18, angle: 0, peak: 0.3 },
      { hue: 2, x: 0.98, y: 0.1, rx: 0.15, ry: 0.15, angle: 0, peak: 0.3 },
      { hue: 1, x: 0.36, y: 0.92, rx: 0.13, ry: 0.13, angle: 0, peak: 0.24 },
      { hue: 2, x: 0.74, y: 0.48, rx: 0.1, ry: 0.1, angle: 0, peak: 0.24 },
      { hue: 0, x: 0.04, y: 0.3, rx: 0.1, ry: 0.1, angle: 0, peak: 0.2 },
      { hue: 1, x: 0.06, y: 0.96, rx: 0.1, ry: 0.1, angle: 0, peak: 0.2 },
    ],
    scrim: { peak: 0.16, reach: 0.42 },
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
  // The screen mirrors too — which side the dominant field comes in from — and tilts a
  // little; no `lift`, it would move the top-lit fields the wrong way. (The arch stays
  // put, in the middle.)
  screen: {
    strength: { angle: 4, shiftX: 0.02 },
    cardioIntense: { angle: 0, shiftX: 0 },
    cardioLow: { angle: -5, shiftX: -0.02, mirror: true },
    flexibility: { angle: -6, shiftX: 0.02, mirror: true },
    mindBody: { angle: 4, shiftX: -0.02 },
    functional: { angle: 6, shiftX: 0.03, mirror: true },
    rest: { angle: -3, shiftX: 0 },
    completed: { angle: 4, shiftX: 0.02, mirror: true },
    default: { angle: 0, shiftX: 0 },
  },
  // Orbs are round, so a tilt would show nothing: each activity's orbs are nudged across
  // and up or down instead, and none is mirrored (the text is on the left, whatever the key).
  space: {
    strength: { angle: 0, shiftX: 0.02, lift: 1 },
    cardioIntense: { angle: 0, shiftX: -0.02, lift: 1.06 },
    cardioLow: { angle: 0, shiftX: 0.03, lift: 0.94 },
    flexibility: { angle: 0, shiftX: -0.03, lift: 1.04 },
    mindBody: { angle: 0, shiftX: 0, lift: 0.96 },
    functional: { angle: 0, shiftX: 0.04, lift: 1.02 },
    rest: { angle: 0, shiftX: -0.01, lift: 1 },
    completed: { angle: 0, shiftX: 0.02, lift: 1.05 },
    default: { angle: 0, shiftX: 0, lift: 1 },
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
    arch: layout.arch,
  };
}

const KEYS = Object.keys(PALETTES) as MeshRecipeKey[];

/** Every recipe, built once: `MESH_RECIPES[card][key]`. */
export const MESH_RECIPES: Record<MeshCardKind, Record<MeshRecipeKey, MeshRecipe>> = {
  mine: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('mine', key)])) as Record<MeshRecipeKey, MeshRecipe>,
  explore: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('explore', key)])) as Record<MeshRecipeKey, MeshRecipe>,
  deck: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('deck', key)])) as Record<MeshRecipeKey, MeshRecipe>,
  space: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('space', key)])) as Record<MeshRecipeKey, MeshRecipe>,
  screen: Object.fromEntries(KEYS.map((key) => [key, buildRecipe('screen', key)])) as Record<MeshRecipeKey, MeshRecipe>,
};

/** The recipe for a kind of card and a glow key (see `getChallengeGlowKey`). */
export function getMeshRecipe(card: MeshCardKind, key: MeshRecipeKey): MeshRecipe {
  return MESH_RECIPES[card][key];
}
