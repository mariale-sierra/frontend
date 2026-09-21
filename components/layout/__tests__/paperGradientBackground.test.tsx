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

  it('is a paper spotlight, quiet enough to sit behind cards and text', async () => {
    const screen = await render(<PaperGradientBackground />);
    const tree = JSON.stringify(screen.toJSON());

    expect(tree).toContain(colors.paper);
    // Strong enough to see, but never more than a quarter of the way to paper: the
    // wash and the bloom add up where they overlap.
    expect(PAPER_GRADIENT.washPeak + PAPER_GRADIENT.bloomPeak).toBeLessThanOrEqual(0.25);
    expect(PAPER_GRADIENT.washPeak).toBeGreaterThan(0);
    expect(PAPER_GRADIENT.bloomPeak).toBeGreaterThan(0);
  });

  it('stays a spotlight, not a wash over the whole screen', () => {
    expect(PAPER_GRADIENT.domeHalfWidth).toBeLessThanOrEqual(0.6);
    expect(PAPER_GRADIENT.domeDepth).toBeLessThanOrEqual(0.6);
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
    // Still the same size of spotlight, and still quiet.
    expect(TINTED_GRADIENT.domeHalfWidth).toBe(PAPER_GRADIENT.domeHalfWidth);
    expect(TINTED_GRADIENT.domeDepth).toBe(PAPER_GRADIENT.domeDepth);
    expect(TINTED_GRADIENT.washPeak + TINTED_GRADIENT.bloomPeak).toBeLessThanOrEqual(0.4);
  });

  it('runs the other way when it is turned upside down', async () => {
    const top = JSON.stringify((await render(<PaperGradientBackground edge="top" />)).toJSON());
    const bottom = JSON.stringify((await render(<PaperGradientBackground edge="bottom" />)).toJSON());

    // Same light, mirrored: the half-moon hangs from the other edge.
    expect(bottom).not.toBe(top);
  });
});
