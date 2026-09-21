import type { ViewStyle } from 'react-native';
import {
  DECK_CARD_ASPECT,
  DECK_CARD_WIDTH_SHARE,
  DECK_CASCADE,
  DECK_FLING_SECONDS,
  DECK_HALO_RADIUS_SHARE,
  DECK_LEAVE_DRIFT,
  DECK_LEAVE_FADE_FROM,
  DECK_LEAVE_RISE,
  DECK_LEAVE_SHRINK,
  DECK_LEAVE_SPIN,
  DECK_LEAVE_TIP,
  DECK_LEAVE_TURN,
  DECK_OVERSCROLL,
  DECK_OVERSCROLL_MAX,
  DECK_PERSPECTIVE,
  DECK_SCALE_STEP,
  DECK_SHADE_MAX,
  DECK_SHADE_STEP,
  DECK_SLIVER,
  DECK_STEP_SHARE,
  DECK_TILT,
  DECK_VISIBLE_BEHIND,
} from '../constants/challengeDeck';

export interface DeckLayout {
  cardWidth: number;
  cardHeight: number;
  /** Where the front card's left edge is, so that the front card is centered. */
  cardLeft: number;
  /** The height of the deck: the front card and the edges of the ones behind it. */
  viewportHeight: number;
  /** How far to drag to bring the next card forward. */
  step: number;
  /** The radius of the circle of light behind the pile. */
  haloRadius: number;
}

/**
 * The size and place of a deck of `count` cards in a space `width` wide: the cards a
 * share of it (`DECK_CARD_WIDTH_SHARE`), the FRONT card centered — however many cards
 * there are, and whichever one is in front, the card you are looking at is in the
 * middle, and the ones behind it stand out to its right — and room below for only as
 * many cards as are really behind it (at most `DECK_VISIBLE_BEHIND`). (It used to center
 * the whole pile, the front card and the edges of the others together, which put the
 * front card left of the middle, more so with more cards, and once the deck was down to
 * its last cards.) The loading skeleton that stands in for the deck is laid out the same.
 */
export function getDeckLayout(width: number, count: number): DeckLayout {
  const cardWidth = width * DECK_CARD_WIDTH_SHARE;
  const cardHeight = cardWidth * DECK_CARD_ASPECT;
  const behind = Math.min(Math.max(count - 1, 0), DECK_VISIBLE_BEHIND);

  return {
    cardWidth,
    cardHeight,
    cardLeft: (width - cardWidth) / 2,
    viewportHeight: cardHeight + DECK_SLIVER * behind,
    step: cardHeight * DECK_STEP_SHARE,
    haloRadius: cardWidth * DECK_HALO_RADIUS_SHARE,
  };
}

export interface DeckCardMotion {
  /** Px right of, and px down from, where the card sits in the deck. */
  translateX: number;
  translateY: number;
  scale: number;
  /** Degrees the card is turned about each axis: 3D tilt (`rotateX`, `rotateY`) and
   * the turn in the screen's own plane (`rotateZ`). */
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
  /** How dark the card is, 0 to 1: the alpha of the `ink` laid over it. */
  shade: number;
}

/**
 * Where a card of the deck is and how it looks, from its `position` — how many cards
 * away from the front it is: 0 is the front card, 1 the one right behind it, and so
 * on; a negative one has been scrolled past, -1 being a card that has just left. A
 * worklet, so the deck's drag drives it on the UI thread with nothing crossing to JS.
 *
 * Every card rests at the pile's 3D tilt (`DECK_TILT`). Behind the front card
 * (`position` above 0), each card is a step smaller and darker, and sits so that its
 * edge shows below the card in front (`DECK_SLIVER` a card) and beside it to the right
 * (`DECK_CASCADE`), the ones further back than `DECK_VISIBLE_BEHIND` fading out. Once
 * past it (below 0), a card is thrown up and to the left, turning on the way it is
 * tilted and shrinking as it goes; it stays whole for the first half of the
 * way and is gone by -1 — so a card that is dragged back is seen coming down the same
 * path, and settling into the pile.
 */
export function deckCardMotion(position: number, cardWidth: number, cardHeight: number): DeckCardMotion {
  'worklet';
  if (position < 0) {
    const leave = Math.min(-position, 1);
    return {
      translateX: -leave * cardWidth * DECK_LEAVE_DRIFT,
      translateY: -leave * cardHeight * DECK_LEAVE_RISE,
      scale: 1 - DECK_LEAVE_SHRINK * leave,
      rotateX: DECK_TILT.x + leave * DECK_LEAVE_TIP,
      rotateY: DECK_TILT.y - leave * DECK_LEAVE_TURN,
      rotateZ: DECK_TILT.z + leave * DECK_LEAVE_SPIN,
      opacity: 1 - Math.min(Math.max((leave - DECK_LEAVE_FADE_FROM) / (1 - DECK_LEAVE_FADE_FROM), 0), 1),
      shade: 0,
    };
  }

  const scale = 1 - DECK_SCALE_STEP * position;
  return {
    translateX: DECK_CASCADE * position,
    // Scaling shrinks the card about its center, which lifts its bottom edge by half
    // the height it lost; put that back, and then the sliver that is to show.
    translateY: (cardHeight / 2) * (1 - scale) + DECK_SLIVER * position,
    scale,
    rotateX: DECK_TILT.x,
    rotateY: DECK_TILT.y,
    rotateZ: DECK_TILT.z,
    opacity: Math.min(Math.max(DECK_VISIBLE_BEHIND + 1 - position, 0), 1),
    shade: Math.min(DECK_SHADE_STEP * position, DECK_SHADE_MAX),
  };
}

/**
 * A card's motion as the `transform` of its style: the 3D perspective first, then the
 * shifts, the turns and the scale. A worklet, so the deck's animated styles and the
 * loading skeleton's static ones are made the same way.
 */
export function deckTransform(motion: DeckCardMotion): NonNullable<ViewStyle['transform']> {
  'worklet';
  return [
    { perspective: DECK_PERSPECTIVE },
    { translateX: motion.translateX },
    { translateY: motion.translateY },
    { rotateX: `${motion.rotateX}deg` },
    { rotateY: `${motion.rotateY}deg` },
    { rotateZ: `${motion.rotateZ}deg` },
    { scale: motion.scale },
  ];
}

/**
 * How much of the circle of light behind the deck a card's disc shows, from how many
 * cards away from the front the card is (`position`, as in `deckCardMotion`): all of
 * it for the front card, less as the card is further from it either way, none from a
 * card away — so the light passes from one card's color to the next as the deck is
 * dragged between them. A worklet.
 */
export function deckHaloOpacity(position: number): number {
  'worklet';
  return Math.min(Math.max(1 - Math.abs(position), 0), 1);
}

/**
 * Which card is in front (between cards while a drag is on) after the finger has
 * moved `translationY` from where the drag began, when `origin` was in front: dragging
 * up — a negative translation — brings the next card forward, one card for every
 * `step` of drag. A drag moves ONE card at most: from the card it began on
 * (`origin`, rounded) to the one before or after it, however far the finger goes; and
 * past that, or past the first or the last card, it gives only a little
 * (`DECK_OVERSCROLL` of the finger's movement, and never more than
 * `DECK_OVERSCROLL_MAX` of a card), so the limit is felt and not passed. A worklet.
 */
export function deckDragProgress(origin: number, translationY: number, step: number, count: number): number {
  'worklet';
  const raw = origin - translationY / step;
  const anchor = Math.round(origin);
  const lowest = Math.max(anchor - 1, 0);
  const highest = Math.min(anchor + 1, count - 1);
  if (raw < lowest) {
    return lowest - Math.min((lowest - raw) * DECK_OVERSCROLL, DECK_OVERSCROLL_MAX);
  }
  if (raw > highest) {
    return highest + Math.min((raw - highest) * DECK_OVERSCROLL, DECK_OVERSCROLL_MAX);
  }
  return raw;
}

/**
 * The card the deck settles on when the finger lets go, `progress` being where the drag
 * had got it and `anchor` the card it began on: the nearest card, but carried on by the
 * speed of the release — a flick up (a negative `velocityY`) goes on to the next card
 * even from a short drag. Never more than one card from `anchor`, however hard the
 * flick, and never past the first or the last. A worklet.
 */
export function deckSettleTarget(
  progress: number,
  velocityY: number,
  step: number,
  count: number,
  anchor: number,
): number {
  'worklet';
  const carried = progress - (velocityY * DECK_FLING_SECONDS) / step;
  const lowest = Math.max(anchor - 1, 0);
  const highest = Math.min(anchor + 1, count - 1);
  return Math.min(Math.max(Math.round(carried), lowest), highest);
}
