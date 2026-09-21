import { RAINBOW_FIELDS } from '../../constants/rainbowBackground';
import { rainbowFieldTransform } from '../rainbowMotion';

const WIDTH = 390;
const HEIGHT = 844;

type Pose = [{ translateX: number }, { translateY: number }, { rotate: number }, { scaleX: number }, { scaleY: number }];
const pose = (index: number, phase: number) => rainbowFieldTransform(RAINBOW_FIELDS[index], phase, WIDTH, HEIGHT) as Pose;

describe('rainbowFieldTransform', () => {
  it.each(RAINBOW_FIELDS.map((field, index) => [field.activity, index] as const))(
    'places the %s field: move, turn, then size — the way the card fields are placed',
    (_name, index) => {
      const transform = pose(index, 0);

      expect(transform.map((step) => Object.keys(step)[0])).toEqual([
        'translateX',
        'translateY',
        'rotate',
        'scaleX',
        'scaleY',
      ]);
    },
  );

  it.each(RAINBOW_FIELDS.map((field, index) => [field.activity, index] as const))(
    'closes the loop for %s: the end of the loop is exactly its start',
    (_name, index) => {
      const start = pose(index, 0);
      const end = pose(index, 1);

      start.forEach((step, position) => {
        const [key] = Object.keys(step) as (keyof typeof step)[];
        expect((end[position] as Record<string, number>)[key]).toBeCloseTo((step as Record<string, number>)[key], 6);
      });
    },
  );

  it.each(RAINBOW_FIELDS.map((field, index) => [field.activity, index] as const))(
    'moves the %s field as the loop runs — but never further than its drift',
    (_name, index) => {
      const { drift } = RAINBOW_FIELDS[index].motion;
      const origin = pose(index, 0);
      let farthest = 0;
      let moved = false;

      for (let phase = 0.05; phase < 1; phase += 0.05) {
        const now = pose(index, phase);
        const dx = now[0].translateX - origin[0].translateX;
        const dy = now[1].translateY - origin[1].translateY;
        if (Math.hypot(dx, dy) > 1) moved = true;
        farthest = Math.max(farthest, Math.abs(now[0].translateX - RAINBOW_FIELDS[index].x * WIDTH), Math.abs(now[1].translateY - RAINBOW_FIELDS[index].y * HEIGHT));
      }

      expect(moved).toBe(true);
      expect(farthest).toBeLessThanOrEqual(drift * WIDTH + 1e-6);
    },
  );

  it('keeps every field a real, positive size all the way round', () => {
    for (let index = 0; index < RAINBOW_FIELDS.length; index += 1) {
      for (let phase = 0; phase <= 1; phase += 0.1) {
        const [, , , { scaleX }, { scaleY }] = pose(index, phase);

        expect(scaleX).toBeGreaterThan(0);
        expect(scaleY).toBeGreaterThan(0);
      }
    }
  });

  it('turns the field about its own angle, in radians, by no more than its sway', () => {
    RAINBOW_FIELDS.forEach((field, index) => {
      const base = (field.angle * Math.PI) / 180;
      const sway = (field.motion.sway * Math.PI) / 180;
      for (let phase = 0; phase <= 1; phase += 0.1) {
        expect(Math.abs(pose(index, phase)[2].rotate - base)).toBeLessThanOrEqual(sway + 1e-9);
      }
    });
  });

  it('scales with the screen, so a bigger screen has bigger fields', () => {
    const small = rainbowFieldTransform(RAINBOW_FIELDS[0], 0, 300, 600) as Pose;
    const big = rainbowFieldTransform(RAINBOW_FIELDS[0], 0, 600, 1200) as Pose;

    expect(big[3].scaleX).toBeCloseTo(small[3].scaleX * 2, 6);
    expect(big[0].translateX).toBeCloseTo(small[0].translateX * 2, 6);
  });
});
