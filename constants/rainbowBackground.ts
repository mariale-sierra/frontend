import type { ActivityType } from '../types/activity';

/**
 * The rainbow background of the create-challenge flow (`RainbowGradientBackground`):
 * very large, dim, soft fields of activity color drifting slowly over `ink`.
 *
 * It is the cards' mesh look (see `meshRecipes.ts`) at screen scale, from the same
 * notes, and there is a test for each:
 *  - BIG fields, wider than the screen, with a long gradual fall-off into the dark
 *    (`MESH_FALLOFF`) — no bands, and the transitions between colors are wide.
 *  - EVERY activity color, once each (all six, so every category is in the picture —
 *    it began as four, and the yellow and the cyan were missing), and widely spaced:
 *    round the edge of the screen in hue order — pink top left, amber top right,
 *    yellow right, aqua bottom right, cyan bottom left, blue left, and back to pink —
 *    so that neighbors blend into each other cleanly, and no two are within a third
 *    of the screen's height of each other.
 *  - UNEQUAL: one color dominates (pink, the biggest and the strongest) and the rest
 *    are weaker, the blue the least.
 *  - DIM, as if seen through tinted glass: low peaks, and the same saturation as
 *    the dome light behind the info screens (`ACCENT_VIVID_FACTOR`), never neon.
 *  - And it MOVES: each field drifts around its place, turns a little and breathes,
 *    all on one seamless loop (`RAINBOW_LOOP_MS`), slowly enough to stay calm
 *    behind a form.
 *
 * Positions are fractions of the screen — `x` of its width and `y` of its height —
 * and the half-sizes `rx` / `ry` are fractions of its WIDTH, so a field keeps its
 * shape when rotated (same as the card fields). Tuned by eye — expect to nudge them.
 */

/** How one field moves, over the whole loop. */
export interface RainbowMotion {
  /** How far it drifts from its place, as a fraction of the screen's width. */
  drift: number;
  /** How many round trips it makes across the loop, sideways and up and down —
   * whole numbers, so the loop closes exactly where it began. */
  cyclesX: number;
  cyclesY: number;
  /** Where in its cycle it starts (radians), so the fields don't move in step. */
  offset: number;
  /** How far it turns either way, in degrees, and how many times over the loop. */
  sway: number;
  cyclesSway: number;
  /** How much it swells and shrinks, as a share of its size, and how many times. */
  breathe: number;
  cyclesBreathe: number;
}

export interface RainbowField {
  /** The activity color the field is made of. */
  activity: ActivityType;
  x: number;
  y: number;
  rx: number;
  ry: number;
  /** Rotation in degrees, clockwise. */
  angle: number;
  /** Alpha at the field's core. */
  peak: number;
  motion: RainbowMotion;
}

/** One full loop of the motion, in ms. Slow: the fastest field goes round in half
 * of this. */
export const RAINBOW_LOOP_MS = 48_000;

export const RAINBOW_FIELDS: RainbowField[] = [
  // The dominant one, top left: pink.
  {
    activity: 'mindBody',
    x: 0.08,
    y: 0.14,
    rx: 1.2,
    ry: 1.0,
    angle: -18,
    peak: 0.34,
    motion: { drift: 0.14, cyclesX: 1, cyclesY: 2, offset: 0, sway: 10, cyclesSway: 1, breathe: 0.06, cyclesBreathe: 2 },
  },
  // Amber, top right.
  {
    activity: 'strength',
    x: 0.96,
    y: 0.14,
    rx: 0.9,
    ry: 0.7,
    angle: 24,
    peak: 0.24,
    motion: { drift: 0.16, cyclesX: 2, cyclesY: 1, offset: 1.1, sway: 14, cyclesSway: 2, breathe: 0.08, cyclesBreathe: 1 },
  },
  // Yellow, down the right side.
  {
    activity: 'cardioIntense',
    x: 0.98,
    y: 0.52,
    rx: 0.85,
    ry: 0.65,
    angle: -14,
    peak: 0.22,
    motion: { drift: 0.13, cyclesX: 1, cyclesY: 2, offset: 2.2, sway: 12, cyclesSway: 1, breathe: 0.06, cyclesBreathe: 1 },
  },
  // Aqua, bottom right.
  {
    activity: 'cardioLow',
    x: 0.92,
    y: 0.9,
    rx: 0.95,
    ry: 0.75,
    angle: 12,
    peak: 0.22,
    motion: { drift: 0.15, cyclesX: 1, cyclesY: 1, offset: 3.1, sway: 12, cyclesSway: 1, breathe: 0.07, cyclesBreathe: 2 },
  },
  // Cyan, bottom left.
  {
    activity: 'functional',
    x: 0.1,
    y: 0.9,
    rx: 0.85,
    ry: 0.65,
    angle: -20,
    peak: 0.19,
    motion: { drift: 0.14, cyclesX: 2, cyclesY: 1, offset: 4.0, sway: 10, cyclesSway: 2, breathe: 0.06, cyclesBreathe: 1 },
  },
  // Blue, down the left side — the weakest.
  {
    activity: 'flexibility',
    x: 0.02,
    y: 0.52,
    rx: 0.8,
    ry: 0.6,
    angle: 16,
    peak: 0.16,
    motion: { drift: 0.12, cyclesX: 2, cyclesY: 2, offset: 5.2, sway: 8, cyclesSway: 1, breathe: 0.05, cyclesBreathe: 1 },
  },
];
