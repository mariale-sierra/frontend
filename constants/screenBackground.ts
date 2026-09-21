/**
 * Which background the screens that opt in to the gradient get (Home / Search /
 * Challenges / Profile, and the create-challenge flow — the screens that pass
 * `gradientBackground` to `ScreenBackground`).
 *
 * `true` — the simple paper background (`PaperGradientBackground`): a subtle
 * spotlight of `paper` on `ink`, shining in from `PAPER_GRADIENT_EDGE`. Since
 * 2026-09-20 (explicit request; a first version fading linearly down the whole
 * screen was "too linear", not a spotlight).
 *
 * `false` — the mesh gradient (`MeshGradientBackground`), the look before that,
 * kept as it was so flipping this brings it back: its `soft` look, or the
 * original `vivid` one while `USE_VIVID_MESH_BACKGROUND` is on.
 */
export const USE_PAPER_GRADIENT_BACKGROUND = true;

/**
 * The edge the paper spotlight shines in from on every screen: `bottom`, the
 * "upside down" version the Challenges screen got first and then every other screen
 * (2026-09-20, explicit request). `top` turns them all back; a screen can also pass
 * its own `gradientEdge` to `ScreenBackground`.
 */
export const PAPER_GRADIENT_EDGE: 'top' | 'bottom' = 'bottom';

/**
 * Home's background takes the color of the challenge card in the carousel — the
 * spotlight cross-fades from one card's color to the next as the carousel is
 * scrolled (2026-09-20, explicit request) — instead of `paper`. `false` leaves it
 * the plain paper spotlight like every other screen.
 */
export const USE_HOME_ACTIVITY_GRADIENT = true;

/**
 * Home's background light is anchored to the top of the page and scrolls up and
 * away with the feed (2026-09-20, explicit request: it used to stay fixed on the
 * screen and follow you down into the posts). `false` puts it back fixed behind
 * the feed like every other screen's.
 */
export const HOME_GRADIENT_SCROLLS = true;

/**
 * The edge Home's light shines in from: `top`, the other way up from every other
 * screen (2026-09-20, explicit request), so it sits right behind the header and the
 * challenge card whose color it takes. `bottom` puts it with the other screens.
 */
export const HOME_GRADIENT_EDGE: 'top' | 'bottom' = 'top';

/**
 * The paper spotlight's numbers — an `AccentDome`'s. Tuned by eye: the light has
 * to stay quiet enough that `paper` text and the cards on it keep their contrast.
 */
export const PAPER_GRADIENT = {
  /** How wide the half-moon is where it meets the screen's edge, as a fraction of
   * the screen's width (0.5 = the whole width; more runs off the sides). */
  domeHalfWidth: 0.5,
  /** How far into the screen it reaches, as a fraction of the screen's height. */
  domeDepth: 0.5,
  /** Alpha of `paper` in the half-moon at its strongest... */
  washPeak: 0.12,
  /** ...and of the soft bloom on the middle of the edge, the light's focal point. */
  bloomPeak: 0.1,
} as const;

/**
 * The same spotlight in a color (Home's activity color): a little stronger, since
 * a color at the alpha `paper` gets reads dimmer.
 */
export const TINTED_GRADIENT = {
  ...PAPER_GRADIENT,
  washPeak: 0.2,
  bloomPeak: 0.16,
} as const;

/**
 * The create-challenge flow (details, routine, exercise picker) has the animated
 * rainbow (`RainbowGradientBackground`: the original vivid mesh, freshened, with all
 * six activity colors and moving) behind it — added 2026-09-20 ("add it to the
 * create challenge flow. just there"), and taken out again the same day ("remove the
 * rainbow gradient from the create challenge flow"), so it is `false`: the flow has
 * the same paper background as the other screens. The rainbow's code is kept, and
 * `true` brings it back on all three screens of the flow.
 */
export const USE_VIVID_CREATE_FLOW_BACKGROUND = false;

/**
 * Which look of the mesh gradient the screens get while
 * `USE_PAPER_GRADIENT_BACKGROUND` is off.
 *
 * `false` — the `soft` look: the same six activity-color fields on the same arc,
 * quiet enough (under half the strength, at the palette's own saturation, over a
 * faint paper light for depth) to sit behind the colored cards. Since 2026-09-20
 * (explicit request).
 *
 * `true` — the `vivid` look: the original mesh gradient, kept exactly as it was
 * (its numbers are the `vivid` entry of `LOOKS` in `MeshGradientBackground`) but
 * stashed, because it was too jarring next to the colored cards. Flipping this
 * brings it back on every one of those screens.
 */
export const USE_VIVID_MESH_BACKGROUND = false;
