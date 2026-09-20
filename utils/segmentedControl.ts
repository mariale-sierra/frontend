/**
 * Layout math for an evenly-divided segmented control: `count` segments of
 * equal width inside a track with `padding` all round and `gap` between
 * segments. `step` is the distance from one segment's left edge to the next
 * (segment width + gap), which is how far the sliding indicator moves per
 * segment.
 */
export function getSegmentGeometry(trackWidth: number, count: number, padding: number, gap: number) {
  if (trackWidth <= 0 || count <= 0) {
    return { segmentWidth: 0, step: 0 };
  }

  const segmentWidth = Math.max((trackWidth - padding * 2 - gap * (count - 1)) / count, 0);
  return { segmentWidth, step: segmentWidth + gap };
}
