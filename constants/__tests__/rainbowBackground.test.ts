import { MESH_FALLOFF } from '../../components/ui/accentMesh';
import { RAINBOW_FIELDS, RAINBOW_LOOP_MS } from '../rainbowBackground';
import { activityColors } from '../theme';
import type { ActivityType } from '../../types/activity';
import { rainbowFieldTransform } from '../../utils/rainbowMotion';

// A phone-ish screen; only the proportions matter.
const WIDTH = 390;
const HEIGHT = 844;
const PHASES = [0, 0.25, 0.5, 0.75];

// The glow's added-up alpha at a point of the screen (fractions of its width and
// height) at a point in the loop — what the canvas adds together with `plus`.
function glowAt(phase: number, x: number, y: number) {
  const px = x * WIDTH;
  const py = y * HEIGHT;
  return RAINBOW_FIELDS.reduce((sum, field) => {
    const [{ translateX }, { translateY }, { rotate }, { scaleX }, { scaleY }] = rainbowFieldTransform(
      field,
      phase,
      WIDTH,
      HEIGHT,
    ) as [{ translateX: number }, { translateY: number }, { rotate: number }, { scaleX: number }, { scaleY: number }];
    const dx = px - translateX;
    const dy = py - translateY;
    const along = (dx * Math.cos(rotate) + dy * Math.sin(rotate)) / scaleX;
    const across = (-dx * Math.sin(rotate) + dy * Math.cos(rotate)) / scaleY;
    const distance = Math.hypot(along, across);
    if (distance >= 1) return sum;
    const next = MESH_FALLOFF.findIndex(([position]) => distance <= position);
    const [fromPosition, fromShare] = MESH_FALLOFF[next - 1] ?? MESH_FALLOFF[0];
    const [toPosition, toShare] = MESH_FALLOFF[next];
    const share = fromShare + ((toShare - fromShare) * (distance - fromPosition)) / (toPosition - fromPosition || 1);
    return sum + field.peak * share;
  }, 0);
}

describe('RAINBOW_FIELDS', () => {
  it('has EVERY activity color, once each — no category is missing from the picture', () => {
    const everyActivity = Object.keys(activityColors) as ActivityType[];

    expect(RAINBOW_FIELDS).toHaveLength(everyActivity.length);
    expect(RAINBOW_FIELDS.map((field) => field.activity).sort()).toEqual([...everyActivity].sort());
  });

  it('has very large fields — the main one wider than the screen', () => {
    expect(Math.max(...RAINBOW_FIELDS.map((field) => field.rx))).toBeGreaterThanOrEqual(1);
    for (const field of RAINBOW_FIELDS) {
      expect(field.rx).toBeGreaterThanOrEqual(0.7);
      expect(field.ry).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('spaces its colors widely apart, not squeezed together', () => {
    const centers = RAINBOW_FIELDS.map((field) => ({ x: field.x * WIDTH, y: field.y * HEIGHT }));
    let nearest = Infinity;
    for (let first = 0; first < centers.length; first += 1) {
      for (let second = first + 1; second < centers.length; second += 1) {
        nearest = Math.min(nearest, Math.hypot(centers[first].x - centers[second].x, centers[first].y - centers[second].y));
      }
    }

    // No two field centers within a third of the screen's height of each other.
    expect(nearest).toBeGreaterThan(HEIGHT / 3);
  });

  it('is unequal — the first field dominates (the biggest and the strongest), the others are weaker', () => {
    const peaks = RAINBOW_FIELDS.map((field) => field.peak);
    const [dominant, ...others] = RAINBOW_FIELDS;

    expect(dominant.peak).toBe(Math.max(...peaks));
    for (const other of others) {
      expect(dominant.rx * dominant.ry).toBeGreaterThan(other.rx * other.ry);
      expect(other.peak).toBeLessThan(dominant.peak);
    }
    expect(Math.max(...peaks) / Math.min(...peaks)).toBeGreaterThanOrEqual(2);
  });

  it('keeps every color present, not lost in the dark — each at least a tenth strong', () => {
    for (const field of RAINBOW_FIELDS) {
      expect(field.peak).toBeGreaterThanOrEqual(0.1);
    }
  });

  it('is dim, as if seen through tinted glass — never neon, at any point of the loop', () => {
    // About the strength of the dome light behind the info screens at its strongest.
    for (const field of RAINBOW_FIELDS) {
      expect(field.peak).toBeLessThanOrEqual(0.45);
    }
    for (const phase of PHASES) {
      for (let y = 0; y <= 1; y += 1 / 16) {
        for (let x = 0; x <= 1; x += 1 / 8) {
          expect(glowAt(phase, x, y)).toBeLessThanOrEqual(0.5);
        }
      }
    }
  });

  it('moves: every field drifts, on whole-number cycles so the loop has no seam', () => {
    for (const { motion } of RAINBOW_FIELDS) {
      expect(motion.drift).toBeGreaterThan(0);
      for (const cycles of [motion.cyclesX, motion.cyclesY, motion.cyclesSway, motion.cyclesBreathe]) {
        expect(Number.isInteger(cycles)).toBe(true);
        expect(cycles).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('moves calmly: a slow loop, a small drift, a gentle turn and swell', () => {
    expect(RAINBOW_LOOP_MS).toBeGreaterThanOrEqual(30_000);
    for (const { motion } of RAINBOW_FIELDS) {
      expect(motion.drift).toBeLessThanOrEqual(0.2);
      expect(motion.sway).toBeLessThanOrEqual(20);
      expect(motion.breathe).toBeLessThanOrEqual(0.1);
    }
  });

  it('keeps the fields from moving in step with one another', () => {
    expect(new Set(RAINBOW_FIELDS.map((field) => field.motion.offset)).size).toBe(RAINBOW_FIELDS.length);
  });

  it('really changes the picture as the loop runs', () => {
    // Somewhere on the screen the glow at the start of the loop is not the glow a quarter of the way in.
    let biggestChange = 0;
    for (let y = 0; y <= 1; y += 1 / 16) {
      for (let x = 0; x <= 1; x += 1 / 8) {
        biggestChange = Math.max(biggestChange, Math.abs(glowAt(0, x, y) - glowAt(0.25, x, y)));
      }
    }
    expect(biggestChange).toBeGreaterThan(0.03);
  });
});
