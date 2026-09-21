interface TickRingPathParams {
  /** The ring's center, on both axes (the ring is drawn in a square box). */
  center: number;
  /** Radius of each tick's inner end. */
  innerRadius: number;
  /** Radius of each tick's outer end. */
  outerRadius: number;
  /** How many ticks, evenly spaced. */
  count: number;
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * SVG path data for a ring of short radial ticks: `count` line segments, evenly
 * spaced, the first at 12 o'clock and the rest running clockwise. One string, so
 * a whole ring is a single stroked path (give it a round `strokeCap` for rounded
 * ticks) instead of a view per tick.
 */
export function buildTickRingPath({ center, innerRadius, outerRadius, count }: TickRingPathParams): string {
  const segments: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    segments.push(
      `M${round(center + outerRadius * cos)} ${round(center + outerRadius * sin)}` +
        `L${round(center + innerRadius * cos)} ${round(center + innerRadius * sin)}`,
    );
  }

  return segments.join('');
}
