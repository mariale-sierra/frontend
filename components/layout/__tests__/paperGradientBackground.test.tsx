import { render } from '@testing-library/react-native';
import { PaperGradientBackground } from '../PaperGradientBackground';
import { PAPER_GRADIENT, PAPER_GRADIENT_EDGE, TINTED_GRADIENT } from '../../../constants/screenBackground';
import { activityColors, colors } from '../../../constants/theme';

describe('PaperGradientBackground', () => {
  it.each(['top', 'bottom'] as const)('renders from the %s edge', async (edge) => {
    const screen = await render(<PaperGradientBackground edge={edge} />);

    expect(screen.toJSON()).toBeTruthy();
  });

  it('does not capture touches, so the screen above it stays usable', async () => {
    const screen = await render(<PaperGradientBackground />);

    expect(screen.toJSON()).toMatchObject({ props: { pointerEvents: 'none' } });
  });

  it('is a paper spotlight, visible over the screen', async () => {
    const screen = await render(<PaperGradientBackground />);
    const tree = JSON.stringify(screen.toJSON());

    expect(tree).toContain(colors.paper);
    expect(PAPER_GRADIENT.washPeak).toBeGreaterThan(0);
    expect(PAPER_GRADIENT.bloomPeak).toBeGreaterThan(0);
  });

  it('stays a spotlight, not a wash over the whole screen', () => {
    expect(PAPER_GRADIENT.domeHalfWidth).toBeLessThanOrEqual(0.7);
    expect(PAPER_GRADIENT.domeDepth).toBeLessThanOrEqual(0.35);
  });

  it('is a half moon, not a circle: wider than it is deep, so the arc’s center is on the edge or beyond it', () => {
    // On a phone (390 x 844): the circle through the dome's rim and its lowest point has its
    // center at `depth - radius` from the edge — at or past the edge (<= 0) for a half moon.
    const [width, height] = [390, 844];
    const halfWidth = PAPER_GRADIENT.domeHalfWidth * width;
    const depth = PAPER_GRADIENT.domeDepth * height;
    const radius = (halfWidth ** 2 + depth ** 2) / (2 * depth);

    expect(depth - radius).toBeLessThanOrEqual(0);
    expect(halfWidth).toBeGreaterThanOrEqual(depth);
  });

  it('is gentler than it was: the first version was .12 and .10, and read as too strong', () => {
    expect(PAPER_GRADIENT.washPeak).toBeLessThan(0.12);
    expect(PAPER_GRADIENT.bloomPeak).toBeLessThan(0.1);
  });

  it('shines in from the bottom edge unless told otherwise', async () => {
    expect(PAPER_GRADIENT_EDGE).toBe('bottom');

    const byDefault = JSON.stringify((await render(<PaperGradientBackground />)).toJSON());
    const bottom = JSON.stringify((await render(<PaperGradientBackground edge="bottom" />)).toJSON());
    const top = JSON.stringify((await render(<PaperGradientBackground edge="top" />)).toJSON());

    expect(byDefault).toBe(bottom);
    expect(byDefault).not.toBe(top);
  });

  it('takes the color of a tint instead of paper, a little stronger', async () => {
    const paper = JSON.stringify((await render(<PaperGradientBackground />)).toJSON());
    const tinted = JSON.stringify((await render(<PaperGradientBackground tint={activityColors.cardioLow} />)).toJSON());

    expect(tinted).not.toBe(paper);
    expect(TINTED_GRADIENT.washPeak).toBeGreaterThan(PAPER_GRADIENT.washPeak);
    expect(TINTED_GRADIENT.bloomPeak).toBeGreaterThan(PAPER_GRADIENT.bloomPeak);
  });

  // `washPeak`/`bloomPeak` bumped 2026-09-25, per explicit "the gradients
  // in the home background... don't have the saturation/brightness as the
  // gradients in the stage 0 / register flow... I want their saturation/
  // brightness to match" — now matches `WelcomeGlowBackground`'s own
  // `WASH_PEAK`/`BLOOM_PEAK` (module-private there, mirrored here as
  // literals). Shape untouched. `PAPER_GRADIENT` (the shared Search/
  // Challenges/Profile backdrop) was bumped the same way at first, then
  // reverted — that request was about Home's own background specifically,
  // not the screens this constant is shared with.
  it('keeps Home\'s tinted light own shape, matching the stage 0 / register flow brightness', () => {
    expect(TINTED_GRADIENT).toEqual({ domeHalfWidth: 0.5, domeDepth: 0.5, washPeak: 0.39, bloomPeak: 0.26 });
  });

  it('runs the other way when it is turned upside down', async () => {
    const top = JSON.stringify((await render(<PaperGradientBackground edge="top" />)).toJSON());
    const bottom = JSON.stringify((await render(<PaperGradientBackground edge="bottom" />)).toJSON());

    // Same light, mirrored: the half-moon hangs from the other edge.
    expect(bottom).not.toBe(top);
  });
});
