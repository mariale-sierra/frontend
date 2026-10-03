import type { RainbowField } from '../constants/rainbowBackground';

const FULL_TURN = Math.PI * 2;

/**
 * Where a rainbow field is, and how it is turned and sized, at a point in the
 * loop: the transform that places its unit circle (the same
 * translate / rotate / scale placement the card fields use), from `phase` (0 to 1,
 * the share of the loop gone by) and the screen's size.
 *
 * Every cycle count is a whole number, so phase 1 lands exactly where phase 0
 * started and the loop has no seam. A worklet: it runs on the UI thread, every
 * frame, driving the Skia canvas.
 */
export function rainbowFieldTransform(field: RainbowField, phase: number, width: number, height: number) {
  'worklet';
  const { motion } = field;
  const turn = phase * FULL_TURN;
  const breathe = 1 + motion.breathe * Math.sin(motion.cyclesBreathe * turn + motion.offset);
  const angle = field.angle + motion.sway * Math.sin(motion.cyclesSway * turn + motion.offset);

  return [
    { translateX: (field.x + motion.drift * Math.sin(motion.cyclesX * turn + motion.offset)) * width },
    { translateY: field.y * height + motion.drift * width * Math.cos(motion.cyclesY * turn + motion.offset) },
    { rotate: (angle * Math.PI) / 180 },
    { scaleX: field.rx * width * breathe },
    { scaleY: field.ry * width * breathe },
  ];
}
