import { render } from '@testing-library/react-native';
import { MuscleAnatomyView } from '../muscleAnatomyView';
import { activityColors, borderWidth, colors, textOpacity } from '../../../constants/theme';
import frontData from '../../../assets/anatomy/front.json';

type Node = { type: string; props: Record<string, unknown>; children?: Node[] | null };

// Every drawn stroke — only the body's contour has one — as [color, width].
function strokes(node: Node, found: { stroke: unknown; strokeWidth: unknown }[] = []) {
  if (node.props.stroke !== undefined) found.push({ stroke: node.props.stroke, strokeWidth: node.props.strokeWidth });
  node.children?.forEach((child) => strokes(child, found));
  return found;
}

const VIEW_BOX_WIDTH = Number(frontData.viewBox.split(' ')[2]);
// Opaque `neutral`, as the unsigned ARGB number the renderer holds it in.
const NEUTRAL_ARGB = (0xff000000 | Number.parseInt(colors.neutral.slice(1), 16)) >>> 0;

// The color the renderer holds a stroke in, as an unsigned ARGB number.
const argb = (stroke: unknown) => (((stroke as { payload: number }).payload) >>> 0);

describe('MuscleAnatomyView outline', () => {
  it.each(['front', 'back'] as const)('draws the %s body contour in the neutral gray — not paper, which was too strong', async (view) => {
    const screen = await render(<MuscleAnatomyView view={view} highlights={[]} />);
    const drawn = strokes(screen.toJSON() as unknown as Node);

    expect(drawn.length).toBeGreaterThan(0);
    expect(drawn.every(({ stroke }) => argb(stroke) === NEUTRAL_ARGB)).toBe(true);
  });

  it.each([120, 220, 300])('makes the line one thin (1px) line on screen at a width of %s', async (width) => {
    const screen = await render(<MuscleAnatomyView view="front" highlights={[]} width={width} />);
    const [{ strokeWidth }] = strokes(screen.toJSON() as unknown as Node);

    // The stroke is in the drawing's own units, which the view scales to `width`.
    expect((Number(strokeWidth) * width) / VIEW_BOX_WIDTH).toBeCloseTo(borderWidth.thin, 2);
  });

  it('is not dimmed — the contour has no opacity of its own', async () => {
    const screen = await render(<MuscleAnatomyView view="front" highlights={[]} />);

    expect(JSON.stringify(screen.toJSON())).not.toContain('"opacity"');
  });
});

// The fill of each body part, in the drawing's order: the paths with a fill and no stroke
// (the contour is all stroke).
function partFills(node: Node, found: unknown[] = []) {
  if (node.type === 'RNSVGPath' && node.props.stroke === undefined) found.push(node.props.fill);
  node.children?.forEach((child) => partFills(child, found));
  return found;
}

// A color at an alpha, as the unsigned ARGB number the renderer holds it in.
const argbOf = (hex: string, alpha: number) =>
  ((Math.round(alpha * 255) << 24) | Number.parseInt(hex.slice(1), 16)) >>> 0;

describe('MuscleAnatomyView highlights', () => {
  const [first, second] = frontData.parts;
  const highlights = [
    { svgPartId: first.id, role: 'primary' as const },
    { svgPartId: second.id, role: 'secondary' as const },
  ];

  it("draws the highlighted muscles in the given color — the exercise's activity color — at two strengths", async () => {
    const screen = await render(<MuscleAnatomyView view="front" highlights={highlights} color={activityColors.cardioLow} />);
    const fills = partFills(screen.toJSON() as unknown as Node);

    expect(argb(fills[0])).toBe(argbOf(activityColors.cardioLow, textOpacity.primary));
    expect(argb(fills[1])).toBe(argbOf(activityColors.cardioLow, textOpacity.tertiary));
  });

  it('draws them in the secondary orange without a color of its own to use (the muscle screen)', async () => {
    const screen = await render(<MuscleAnatomyView view="front" highlights={highlights} />);
    const fills = partFills(screen.toJSON() as unknown as Node);

    expect(argb(fills[0])).toBe(argbOf(colors.secondary, textOpacity.primary));
    expect(argb(fills[1])).toBe(argbOf(colors.secondary, textOpacity.tertiary));
  });

  it('leaves every other part a dim surface, whatever the color', async () => {
    const screen = await render(<MuscleAnatomyView view="front" highlights={highlights} color={activityColors.strength} />);
    const fills = partFills(screen.toJSON() as unknown as Node);

    expect(fills.slice(2).every((fill) => argb(fill) === argbOf(colors.surface, 0.5))).toBe(true);
  });
});
