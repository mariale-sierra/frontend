import type { WithSpringConfig } from 'react-native-reanimated';
import { spacing } from './theme';

/**
 * The card deck of the "Log today's progress" picker (`ChallengeDeck`): the
 * challenges as cards piled one behind another and tilted in 3D, like a stack of
 * cards seen at a slight angle: the front card whole, turned so its right edge comes
 * toward you and set a degree or two clockwise, and the ones behind it standing out
 * well to its right and below it, nearly its size; dragging up throws the front card
 * up and to the left, turning as it goes, and brings the next forward. One drag moves
 * one card. Tuned by eye — expect to nudge them.
 */

/** Height over width of a card: nearly square, a little tall. */
export const DECK_CARD_ASPECT = 1.1;

/** The longest the picker's loading skeleton waits for the cards' photos to load, in
 * milliseconds, before it shows the deck anyway: a slow or broken photo should cost its
 * card its picture, not the screen its cards. */
export const DECK_IMAGES_TIMEOUT_MS = 6000;

/** How far in from the card's edge its content sits, all round: the inset the
 * challenge cards give their text (`md` of padding and an `sm` inset). */
export const DECK_CARD_PADDING = spacing.md + spacing.sm;

/** How wide a card is, as a share of the deck's width: a little square, centered,
 * not the whole width. */
export const DECK_CARD_WIDTH_SHARE = 0.6;

/** How far to drag to bring the next card forward, as a share of a card's height. */
export const DECK_STEP_SHARE = 0.7;

/** Where a flick lands: a drag that lets go with some speed carries on for this many
 * seconds at that speed before the deck settles on a card. */
export const DECK_FLING_SECONDS = 0.12;

/** How far past the card a drag can go, as a share of what the finger moved, and at
 * most this many cards. A drag moves ONE card at most — the one it began on to the one
 * before or after it — and past that, and past the first and last card, the deck only
 * gives a little, then holds, and springs back on release. */
export const DECK_OVERSCROLL = 0.2;
export const DECK_OVERSCROLL_MAX = 0.15;

/** The settle onto a card: soft, and no overshoot — a card past the front one would
 * start to leave, and back again. */
export const DECK_SPRING: WithSpringConfig = {
  damping: 22,
  stiffness: 170,
  mass: 1,
  overshootClamping: true,
};

/** The soft circle of light behind the deck, in the activity color of the front card:
 * its radius as a share of a card's width, and its alpha at the middle. */
export const DECK_HALO_RADIUS_SHARE = 1.15;
export const DECK_HALO_PEAK = 0.42;

/** The tilt every card of the pile rests at, in degrees: the top leaning back a
 * touch (`x`), the left side leaning away so the right edge comes toward you (`y`),
 * and turned a couple of degrees clockwise in its plane (`z`) — so each card is a
 * slab turned in space, not a flat rectangle. */
export const DECK_TILT = { x: 3, y: -12, z: 2 } as const;

/** The depth of the 3D the tilt is seen through. */
export const DECK_PERSPECTIVE = 900;

/** How many cards show behind the front one; the next one back fades out. */
export const DECK_VISIBLE_BEHIND = 2;

/** Each card behind sits this far below and this far to the right of the one in front
 * of it, so a good part of its edge shows below and beside it: the pile steps down a
 * diagonal. */
export const DECK_SLIVER = spacing.lg;
export const DECK_CASCADE = spacing.xl;

/** How much smaller each card is than the one in front of it: hardly — the ones behind
 * are nearly its size, set off to the side. */
export const DECK_SCALE_STEP = 0.04;

/** How much darker each card is than the one in front of it (an `ink` over it), up to
 * this much, so the pile reads as depth. */
export const DECK_SHADE_STEP = 0.25;
export const DECK_SHADE_MAX = 0.7;

/** A card that is leaving is thrown up (this share of its own height) and to the left
 * (this share of its width), turns on in the direction it is already tilted (this
 * many degrees more about each axis), and shrinks — all by the time the next card is
 * in front. It stays whole for the first part of the way, and only fades out over the
 * rest, so a card that comes back (dragging down) is seen coming, not appearing out of
 * nothing. */
export const DECK_LEAVE_RISE = 0.85;
export const DECK_LEAVE_DRIFT = 0.45;
export const DECK_LEAVE_SPIN = 16;
export const DECK_LEAVE_TURN = 14;
export const DECK_LEAVE_TIP = 8;
export const DECK_LEAVE_SHRINK = 0.1;
export const DECK_LEAVE_FADE_FROM = 0.5;
