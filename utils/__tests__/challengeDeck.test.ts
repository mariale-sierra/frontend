import {
  deckCardMotion,
  deckDragProgress,
  deckHaloOpacity,
  deckSettleTarget,
  deckTransform,
  getDeckLayout,
} from '../challengeDeck';
import {
  DECK_CARD_ASPECT,
  DECK_CARD_WIDTH_SHARE,
  DECK_CASCADE,
  DECK_HALO_RADIUS_SHARE,
  DECK_LEAVE_DRIFT,
  DECK_LEAVE_FADE_FROM,
  DECK_LEAVE_RISE,
  DECK_LEAVE_SPIN,
  DECK_OVERSCROLL,
  DECK_OVERSCROLL_MAX,
  DECK_PERSPECTIVE,
  DECK_SHADE_MAX,
  DECK_SLIVER,
  DECK_STEP_SHARE,
  DECK_TILT,
  DECK_VISIBLE_BEHIND,
} from '../../constants/challengeDeck';

const WIDTH = 205;
const HEIGHT = 226;
const motion = (position: number) => deckCardMotion(position, WIDTH, HEIGHT);

describe('deckCardMotion', () => {
  describe('the front card', () => {
    it('is whole and in place, and at the pile’s tilt — not flat', () => {
      expect(motion(0)).toEqual({
        translateX: 0,
        translateY: 0,
        scale: 1,
        rotateX: DECK_TILT.x,
        rotateY: DECK_TILT.y,
        rotateZ: DECK_TILT.z,
        opacity: 1,
        shade: 0,
      });
    });

    it('is a slab turned in space: its right edge coming toward you, and a couple of degrees clockwise', () => {
      const { rotateY, rotateZ } = motion(0);

      // A negative turn about the vertical axis brings the right edge forward.
      expect(rotateY).toBeLessThan(0);
      expect(rotateZ).toBeGreaterThan(0);
    });
  });

  describe('the cards behind', () => {
    it('all rest at the same tilt as the front one', () => {
      for (const position of [0.5, 1, 2, 3]) {
        const { rotateX, rotateY, rotateZ } = motion(position);

        expect([rotateX, rotateY, rotateZ]).toEqual([DECK_TILT.x, DECK_TILT.y, DECK_TILT.z]);
      }
    });

    it('are each smaller than the one in front of them', () => {
      const scales = [1, 2, 3].map((position) => motion(position).scale);

      expect(scales[0]).toBeLessThan(1);
      expect(scales[1]).toBeLessThan(scales[0]);
      expect(scales[2]).toBeLessThan(scales[1]);
    });

    it('step down the diagonal: a sliver below the card in front, and a corner to its right', () => {
      for (const position of [1, 2]) {
        const { translateX, translateY, scale } = motion(position);
        // Scaled about its center, a card's bottom edge is at:
        const bottomEdge = (HEIGHT / 2) * (1 + scale) + translateY;

        expect(bottomEdge - HEIGHT).toBeCloseTo(DECK_SLIVER * position, 5);
        expect(translateX).toBeCloseTo(DECK_CASCADE * position, 5);
      }
    });

    it('are each darker than the one in front of them, up to a limit', () => {
      const shades = [0, 1, 2, 3, 6].map((position) => motion(position).shade);

      expect(shades[0]).toBe(0);
      expect(shades[1]).toBeGreaterThan(shades[0]);
      expect(shades[2]).toBeGreaterThan(shades[1]);
      expect(shades[4]).toBe(DECK_SHADE_MAX);
    });

    it('all show, up to DECK_VISIBLE_BEHIND, and the next one back is gone', () => {
      for (let position = 0; position <= DECK_VISIBLE_BEHIND; position += 1) {
        expect(motion(position).opacity).toBe(1);
      }
      expect(motion(DECK_VISIBLE_BEHIND + 1).opacity).toBe(0);
      expect(motion(DECK_VISIBLE_BEHIND + 5).opacity).toBe(0);
    });

    it('fade in as they come within reach, not pop in', () => {
      const opacity = motion(DECK_VISIBLE_BEHIND + 0.5).opacity;

      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    });
  });

  describe('a card being dragged past', () => {
    it('is thrown up and to the left, turning as it goes', () => {
      const early = motion(-0.25);
      const late = motion(-0.75);

      expect(early.translateY).toBeLessThan(0);
      expect(late.translateY).toBeLessThan(early.translateY);
      expect(early.translateX).toBeLessThan(0);
      expect(late.translateX).toBeLessThan(early.translateX);
      // ...turning on the way it is already tilted (clockwise, and the right edge coming round).
      expect(late.rotateZ).toBeGreaterThan(early.rotateZ);
      expect(late.rotateY).toBeLessThan(early.rotateY);
      expect(late.scale).toBeLessThan(early.scale);
    });

    it('is gone by the time it is a card away — up by DECK_LEAVE_RISE, left by DECK_LEAVE_DRIFT, turned DECK_LEAVE_SPIN more', () => {
      const gone = motion(-1);

      expect(gone.opacity).toBe(0);
      expect(gone.translateY).toBeCloseTo(-HEIGHT * DECK_LEAVE_RISE, 5);
      expect(gone.translateX).toBeCloseTo(-WIDTH * DECK_LEAVE_DRIFT, 5);
      expect(gone.rotateZ).toBeCloseTo(DECK_TILT.z + DECK_LEAVE_SPIN, 5);
    });

    it('stays whole for the first part of the way, and only then fades — so a card dragged back is seen coming', () => {
      expect(motion(-DECK_LEAVE_FADE_FROM).opacity).toBe(1);
      expect(motion(-0.25).opacity).toBe(1);
      expect(motion(-0.75).opacity).toBeGreaterThan(0);
      expect(motion(-0.75).opacity).toBeLessThan(1);
      expect(motion(-0.95).opacity).toBeLessThan(motion(-0.75).opacity);
    });

    it('is not darkened', () => {
      expect(motion(-0.5).shade).toBe(0);
    });

    it('stays gone, and where it went, however far past', () => {
      expect(motion(-3)).toEqual(motion(-1));
    });
  });

  it('has no jump where a card reaches the front, from either side', () => {
    const front = motion(0);

    for (const near of [motion(0.0001), motion(-0.0001)]) {
      for (const key of Object.keys(front) as (keyof typeof front)[]) {
        expect(near[key]).toBeCloseTo(front[key], 1);
      }
    }
  });

  it('moves the same way both ways: the path back is the path out', () => {
    // A card at a position is the same wherever it came from — it depends on nothing
    // but its position — so dragging down retraces the way it went.
    for (const position of [-0.9, -0.6, -0.3, 0, 0.5, 1.5]) {
      expect(motion(position)).toEqual(motion(position));
    }
    // ...and the path is continuous, with no step anywhere along it.
    let previous = motion(-1);
    for (let position = -1; position <= 1; position += 0.01) {
      const next = motion(position);
      expect(Math.abs(next.translateY - previous.translateY)).toBeLessThan(HEIGHT * 0.05);
      expect(Math.abs(next.translateX - previous.translateX)).toBeLessThan(WIDTH * 0.05);
      expect(Math.abs(next.opacity - previous.opacity)).toBeLessThan(0.1);
      previous = next;
    }
  });

  it('scales its distances with the card: the same picture at any size', () => {
    const small = deckCardMotion(-0.5, 100, 110);
    const big = deckCardMotion(-0.5, 200, 220);

    expect(big.translateY).toBeCloseTo(small.translateY * 2, 5);
    expect(big.translateX).toBeCloseTo(small.translateX * 2, 5);
    expect(big.scale).toBe(small.scale);
    expect(big.opacity).toBe(small.opacity);
  });
});

describe('deckDragProgress', () => {
  const STEP = 200;

  it('brings the next card forward as the finger drags up, one card to a step', () => {
    expect(deckDragProgress(0, 0, STEP, 4)).toBe(0);
    expect(deckDragProgress(0, -100, STEP, 4)).toBe(0.5);
    expect(deckDragProgress(0, -STEP, STEP, 4)).toBe(1);
  });

  it('brings the last one back as it drags down, from wherever it began', () => {
    expect(deckDragProgress(2, 100, STEP, 4)).toBe(1.5);
    expect(deckDragProgress(2, STEP, STEP, 4)).toBe(1);
  });

  it('moves ONE card at most: a long drag stops at the next card and only gives a little past it', () => {
    // Three steps up from the second card would be the last; it stays at the third, give aside.
    const far = deckDragProgress(1, -STEP * 3, STEP, 4);

    expect(far).toBeGreaterThanOrEqual(2);
    expect(far).toBeLessThan(2.6);
    // And the same going back.
    const back = deckDragProgress(2, STEP * 3, STEP, 4);
    expect(back).toBeLessThanOrEqual(1);
    expect(back).toBeGreaterThan(0.4);
  });

  it('counts from the card the drag began on, so the next drag can move one more', () => {
    expect(deckDragProgress(2, -STEP * 3, STEP, 4)).toBeGreaterThanOrEqual(3);
    expect(deckDragProgress(2, -STEP * 3, STEP, 4)).toBeLessThan(3.6);
  });

  it('gives only a little past the first or the last card, and holds there', () => {
    // A finger dragging down a whole step at the top of the deck: a fifth of it, but never past the cap.
    expect(deckDragProgress(0, STEP, STEP, 4)).toBeCloseTo(-DECK_OVERSCROLL_MAX, 5);
    expect(deckDragProgress(3, -STEP, STEP, 4)).toBeCloseTo(3 + DECK_OVERSCROLL_MAX, 5);
    // Far past, it is still barely past.
    expect(deckDragProgress(0, 900, STEP, 4)).toBeGreaterThan(-1.1);
    expect(deckDragProgress(0, 900, STEP, 4)).toBeLessThan(0);
  });

  it('is continuous where it starts to give: no jump at the limit of a drag', () => {
    expect(deckDragProgress(0, 0.001, STEP, 4)).toBeCloseTo(0, 3);
    expect(deckDragProgress(3, -0.001, STEP, 4)).toBeCloseTo(3, 3);
    expect(deckDragProgress(1, -STEP - 0.001, STEP, 4)).toBeCloseTo(2, 3);
    expect(deckDragProgress(1, STEP + 0.001, STEP, 4)).toBeCloseTo(0, 3);
  });
});

describe('deckSettleTarget', () => {
  const STEP = 200;

  it('settles on the nearest card when let go at rest', () => {
    expect(deckSettleTarget(1.3, 0, STEP, 4, 1)).toBe(1);
    expect(deckSettleTarget(1.7, 0, STEP, 4, 1)).toBe(2);
  });

  it('is carried on by a flick: up goes to the next card, down back to the last', () => {
    // A short drag (a quarter of the way), let go fast.
    expect(deckSettleTarget(1.25, -1500, STEP, 4, 1)).toBe(2);
    expect(deckSettleTarget(1.75, 1500, STEP, 4, 2)).toBe(1);
  });

  it('is not moved by a slow release', () => {
    expect(deckSettleTarget(1.3, -50, STEP, 4, 1)).toBe(1);
  });

  it('is never more than one card from the one the drag began on, however hard the flick', () => {
    expect(deckSettleTarget(1.4, -9000, STEP, 6, 1)).toBe(2);
    expect(deckSettleTarget(3.6, 9000, STEP, 6, 4)).toBe(3);
    // Even a drag that somehow got further lets go on the one card.
    expect(deckSettleTarget(3.2, 0, STEP, 6, 1)).toBe(2);
  });

  it('comes back to the first or the last card from beyond it, and never goes past either', () => {
    expect(deckSettleTarget(-0.15, 0, STEP, 4, 0)).toBe(0);
    expect(deckSettleTarget(3.15, 0, STEP, 4, 3)).toBe(3);
    expect(deckSettleTarget(0.1, 9000, STEP, 4, 0)).toBe(0);
    expect(deckSettleTarget(2.9, -9000, STEP, 4, 3)).toBe(3);
  });
});

describe('deckHaloOpacity', () => {
  it('is all of the disc for the front card, and none from a card away', () => {
    expect(deckHaloOpacity(0)).toBe(1);
    expect(deckHaloOpacity(1)).toBe(0);
    expect(deckHaloOpacity(-1)).toBe(0);
    expect(deckHaloOpacity(3)).toBe(0);
    expect(deckHaloOpacity(-3)).toBe(0);
  });

  it('passes from one card to the next: as one fades the other comes in, the two adding up to the whole', () => {
    for (const between of [0.1, 0.25, 0.5, 0.9]) {
      // The card being left is `between` of a card from the front, the one coming `1 - between`.
      expect(deckHaloOpacity(-between) + deckHaloOpacity(1 - between)).toBeCloseTo(1, 10);
      expect(deckHaloOpacity(between) + deckHaloOpacity(between - 1)).toBeCloseTo(1, 10);
    }
  });

  it('is the same coming as going, and never outside 0 to 1', () => {
    for (const position of [0.2, 0.5, 0.8]) {
      expect(deckHaloOpacity(position)).toBe(deckHaloOpacity(-position));
    }
    for (let position = -3; position <= 3; position += 0.1) {
      expect(deckHaloOpacity(position)).toBeGreaterThanOrEqual(0);
      expect(deckHaloOpacity(position)).toBeLessThanOrEqual(1);
    }
  });
});

describe('getDeckLayout', () => {
  const WIDTH_OF_DECK = 342;

  it('makes the cards little squares, a bit tall, a share of the deck', () => {
    const { cardWidth, cardHeight } = getDeckLayout(WIDTH_OF_DECK, 3);

    expect(cardWidth).toBeCloseTo(WIDTH_OF_DECK * DECK_CARD_WIDTH_SHARE, 5);
    expect(cardHeight / cardWidth).toBeCloseTo(DECK_CARD_ASPECT, 5);
  });

  it.each([1, 2, 3, 4, 10])('centers the FRONT card for %s card(s): as much room to its left as to its right', (count) => {
    const { cardWidth, cardLeft } = getDeckLayout(WIDTH_OF_DECK, count);

    expect(cardLeft).toBeCloseTo((WIDTH_OF_DECK - cardWidth) / 2, 5);
    expect(cardLeft).toBeCloseTo(WIDTH_OF_DECK - (cardLeft + cardWidth), 5);
  });

  it('puts the front card in the same place for one card and for ten — the pile behind it does not move it', () => {
    expect(getDeckLayout(WIDTH_OF_DECK, 2).cardLeft).toBe(getDeckLayout(WIDTH_OF_DECK, 1).cardLeft);
    expect(getDeckLayout(WIDTH_OF_DECK, 10).cardLeft).toBe(getDeckLayout(WIDTH_OF_DECK, 1).cardLeft);
  });

  it('leaves the cards behind room to stand out to the right, inside the deck', () => {
    const { cardWidth, cardLeft } = getDeckLayout(WIDTH_OF_DECK, 10);

    expect(cardLeft + cardWidth + DECK_CASCADE * DECK_VISIBLE_BEHIND).toBeLessThanOrEqual(WIDTH_OF_DECK);
  });

  it('is a lone card, centered, with nothing standing out and no room below it, for one challenge', () => {
    const { cardWidth, cardHeight, cardLeft, viewportHeight } = getDeckLayout(WIDTH_OF_DECK, 1);

    expect(cardLeft).toBeCloseTo((WIDTH_OF_DECK - cardWidth) / 2, 5);
    expect(viewportHeight).toBeCloseTo(cardHeight, 5);
  });

  it('leaves room for the cards that are really behind, and no more: one for two challenges, two from three on', () => {
    const height = (count: number) => getDeckLayout(WIDTH_OF_DECK, count).viewportHeight;
    const { cardHeight } = getDeckLayout(WIDTH_OF_DECK, 1);

    expect(height(2)).toBeCloseTo(cardHeight + DECK_SLIVER, 5);
    expect(height(3)).toBeCloseTo(cardHeight + DECK_SLIVER * DECK_VISIBLE_BEHIND, 5);
    expect(height(10)).toBe(height(3));
  });

  it('centers the circle of light on the deck, with a radius that goes with the card', () => {
    const { cardWidth, haloRadius } = getDeckLayout(WIDTH_OF_DECK, 3);

    expect(haloRadius).toBeCloseTo(cardWidth * DECK_HALO_RADIUS_SHARE, 5);
  });

  it('takes a step of the drag that goes with the card', () => {
    const { cardHeight, step } = getDeckLayout(WIDTH_OF_DECK, 3);

    expect(step).toBeCloseTo(cardHeight * DECK_STEP_SHARE, 5);
  });

  it('is nothing at all before the deck has a width', () => {
    const { cardWidth, cardHeight, step } = getDeckLayout(0, 3);

    expect([cardWidth, cardHeight, step]).toEqual([0, 0, 0]);
  });

  it('is the same for the skeleton and the deck of three cards: one layout, written once', () => {
    expect(getDeckLayout(WIDTH_OF_DECK, DECK_VISIBLE_BEHIND + 1)).toEqual(getDeckLayout(WIDTH_OF_DECK, 3));
  });
});

describe('deckTransform', () => {
  it('puts the perspective first, then the shifts, the turns and the scale', () => {
    const transform = deckTransform(deckCardMotion(0, 200, 220)) as unknown as Record<string, unknown>[];

    expect(transform.map((entry) => Object.keys(entry)[0])).toEqual([
      'perspective',
      'translateX',
      'translateY',
      'rotateX',
      'rotateY',
      'rotateZ',
      'scale',
    ]);
    expect(transform[0]).toEqual({ perspective: DECK_PERSPECTIVE });
  });

  it('carries the motion’s numbers, the turns as degrees', () => {
    const motion = deckCardMotion(1, 200, 220);
    const transform = deckTransform(motion) as unknown as Record<string, unknown>[];
    const value = (key: string) => transform.find((entry) => key in entry)![key];

    expect(value('translateX')).toBe(motion.translateX);
    expect(value('translateY')).toBe(motion.translateY);
    expect(value('scale')).toBe(motion.scale);
    expect(value('rotateX')).toBe(`${motion.rotateX}deg`);
    expect(value('rotateY')).toBe(`${motion.rotateY}deg`);
    expect(value('rotateZ')).toBe(`${motion.rotateZ}deg`);
  });
});

describe('deckDragProgress — how far it gives at a limit', () => {
  const STEP = 200;

  it('gives a little at first, in proportion to what the finger moved', () => {
    // A quarter of a step past the first card: a fifth of that.
    expect(deckDragProgress(0, STEP * 0.25, STEP, 4)).toBeCloseTo(-0.25 * DECK_OVERSCROLL, 5);
  });

  it('never gives more than DECK_OVERSCROLL_MAX of a card, however far the finger goes', () => {
    expect(deckDragProgress(0, STEP * 20, STEP, 4)).toBeCloseTo(-DECK_OVERSCROLL_MAX, 5);
    expect(deckDragProgress(3, -STEP * 20, STEP, 4)).toBeCloseTo(3 + DECK_OVERSCROLL_MAX, 5);
    // And at the limit of a drag in the middle of the deck.
    expect(deckDragProgress(1, -STEP * 20, STEP, 4)).toBeCloseTo(2 + DECK_OVERSCROLL_MAX, 5);
  });

  it('leaves a lone card where it is, give aside', () => {
    expect(deckDragProgress(0, -STEP * 20, STEP, 1)).toBeCloseTo(DECK_OVERSCROLL_MAX, 5);
    expect(deckDragProgress(0, STEP * 20, STEP, 1)).toBeCloseTo(-DECK_OVERSCROLL_MAX, 5);
    // It never gets to leave: a card that is only a little past the front is still whole.
    expect(deckCardMotion(-DECK_OVERSCROLL_MAX, 200, 220).opacity).toBe(1);
  });
});
