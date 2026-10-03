import type { ComponentProps } from 'react';
import { AccentDome } from './accentDome';

type AccentTwinDomeProps = Omit<ComponentProps<typeof AccentDome>, 'edge'>;

/**
 * The accent light from BOTH ends: `AccentDome`'s half-moon hung from the top edge
 * and another rising from the bottom edge, same numbers for each. The look of the
 * exercise screen's backdrop and the Space cards' glow — one at screen scale, one
 * at card scale. Skia nodes only, so it goes inside a `Canvas`, over the base
 * (`ink`) the caller draws first.
 */
export function AccentTwinDome(props: AccentTwinDomeProps) {
  return (
    <>
      <AccentDome {...props} edge="top" />
      <AccentDome {...props} edge="bottom" />
    </>
  );
}
