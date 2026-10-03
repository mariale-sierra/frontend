/**
 * The geometry of the Progress screen's tick ring (`ChallengeProgressRing`), in
 * one place so everything that echoes it stays in step — the Explore challenge
 * card's small tick ring scales the tick size down from these numbers rather than
 * making up its own (it has its own, smaller tick count, though: at its size the
 * full 60 were overcrowded).
 *
 * - `size`: the ring's diameter.
 * - `tickLength` / `tickWidth`: each tick's size — short and thick for the ring,
 *   with rounded ends.
 * - `tickInset`: the gap between the ring's outer edge and its ticks.
 * - `segmentCount`: the number of ticks. Fixed regardless of the challenge's
 *   length (see `buildDayRingTicks`): a 10-day and a 75-day challenge render the
 *   same dense, evenly-spaced dial, each day taking its own stretch of it.
 */
export const PROGRESS_RING = {
  size: 180,
  tickLength: 14,
  tickWidth: 3,
  tickInset: 3,
  segmentCount: 60,
} as const;
