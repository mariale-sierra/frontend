import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { GlassBackdrop, GlassHighlight, GlassSurface, glassRimmedStyle } from '../glassSurface';
import { borderWidth, colors, glass } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

const tree = async (element: React.ReactElement) => JSON.stringify((await render(element)).toJSON());

describe('GlassBackdrop', () => {
  it('is a blur under the shared translucent surface tint', async () => {
    const json = await tree(<GlassBackdrop />);

    expect(json).toContain('ExpoBlur');
    expect(json).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.tintOpacity)}"`);
  });

  it('takes a lighter tint when asked, with the same blur', async () => {
    const json = await tree(<GlassBackdrop tintOpacity={glass.badgeTintOpacity} />);

    expect(json).toContain('ExpoBlur');
    expect(json).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.badgeTintOpacity)}"`);
    expect(json).not.toContain(withAlpha(colors.surface, glass.tintOpacity));
  });
});

type TreeNode = { type?: string; props?: Record<string, unknown>; children?: TreeNode[] | null };

const walk = (node: TreeNode | null): TreeNode[] => (node ? [node, ...(node.children ?? []).flatMap(walk)] : []);

// A gradient's alphas, stop by stop: react-native-svg hands the stops over as
// `[offset, ARGB, offset, ARGB, ...]`.
function stopAlphas(root: TreeNode | null, name: string): number[] {
  const gradient = walk(root).find((node) => node.props?.name === name);
  const stops = (gradient?.props?.gradient ?? []) as number[];
  return stops.filter((_, index) => index % 2 === 1).map((argb) => ((argb >>> 24) & 0xff) / 255);
}

const ONE_STEP = 1 / 255;

describe('GlassSurface', () => {
  it('is plain glass by default: the blur, the tint and the hairline rim, no highlight', async () => {
    const json = await tree(<GlassSurface style={{ borderRadius: 16 }} />);

    expect(json).toContain('ExpoBlur');
    expect(json).toContain(`"borderWidth":${StyleSheet.hairlineWidth}`);
    expect(json).not.toContain('RNSVG');
  });

  describe('with the highlight — the light of a popup or a toast', () => {
    const renderHighlighted = async (radius = 40) =>
      (await render(<GlassSurface highlight style={{ borderRadius: radius }} />)).toJSON() as unknown as TreeNode;

    it('keeps the blur and the tint under it', async () => {
      const json = JSON.stringify(await renderHighlighted());

      expect(json).toContain('ExpoBlur');
      expect(json).toContain(`"backgroundColor":"${withAlpha(colors.surface, glass.tintOpacity)}"`);
    });

    it('lays a soft sheen over the glass, brightest at the top-left and gone by the far side', async () => {
      const [start, end] = stopAlphas(await renderHighlighted(), 'glassSheen');

      expect(start).toBeCloseTo(glass.sheenOpacity, 1);
      expect(end).toBe(0);
    });

    it('draws a gradient rim: bright at the top-left, faint through the middle, a fainter echo at the bottom-right', async () => {
      const [bright, dim, echo] = stopAlphas(await renderHighlighted(), 'glassRim');

      expect(Math.abs(bright - glass.rimOpacity.bright)).toBeLessThanOrEqual(ONE_STEP);
      expect(Math.abs(dim - glass.rimOpacity.dim)).toBeLessThanOrEqual(ONE_STEP);
      expect(Math.abs(echo - glass.rimOpacity.echo)).toBeLessThanOrEqual(ONE_STEP);
      expect(bright).toBeGreaterThan(echo);
      expect(echo).toBeGreaterThan(dim);
    });

    it('takes both from the palette: `paper` light, never a color', async () => {
      const json = JSON.stringify(await renderHighlighted());
      const sheen = walk(JSON.parse(json)).find((node) => node.props?.name === 'glassSheen');
      const rim = walk(JSON.parse(json)).find((node) => node.props?.name === 'glassRim');
      const paper = [1, 3, 5].map((index) => parseInt(colors.paper.slice(index, index + 2), 16));

      for (const gradient of [sheen, rim]) {
        const stops = (gradient?.props?.gradient ?? []) as number[];
        for (const argb of stops.filter((_, index) => index % 2 === 1)) {
          expect([(argb >>> 16) & 0xff, (argb >>> 8) & 0xff, argb & 0xff]).toEqual(paper);
        }
      }
    });

    it("follows the container's corner radius, and is as wide as the thin outline once the outer half is clipped", async () => {
      for (const radius of [16, 40]) {
        const rim = walk(await renderHighlighted(radius)).find((node) => node.props?.stroke !== undefined);

        expect(rim?.props).toMatchObject({ rx: radius, ry: radius, strokeWidth: borderWidth.thin * 2 });
      }
    });

    it('is the outline: the plain hairline goes', async () => {
      const root = await renderHighlighted();
      const flat = StyleSheet.flatten(root.props?.style as never) as { borderWidth?: number };

      expect(flat.borderWidth).toBe(0);
    });

    // Regression: the rim came out smaller than a padded card (the popup's), pinned to its
    // top-left. `Svg`'s `width` / `height` props turn into a `'100%'` size, which React Native
    // measures against an absolute child's container minus its padding.
    it("is sized by its insets, not by a percentage — so it is as big as a padded card, not its content box", async () => {
      const svg = walk(await renderHighlighted()).find((node) => node.type === 'RNSVGSvgView');
      const flat = StyleSheet.flatten(svg?.props?.style as never) as Record<string, unknown>;

      expect(flat).toMatchObject({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 });
      expect(flat.width).toBeUndefined();
      expect(flat.height).toBeUndefined();
      expect(svg?.props?.width).toBeUndefined();
      expect(svg?.props?.height).toBeUndefined();
    });

    it('is as big as a padded card too: the same insets as the blur and the tint under it', async () => {
      const screen = await render(<GlassSurface highlight style={{ borderRadius: 40, padding: 32 }} />);
      const layers = walk(screen.toJSON() as unknown as TreeNode).filter(
        (node) => node.type === 'RNSVGSvgView' || (node.type === 'View' && node.props?.pointerEvents === 'none'),
      );
      const insets = layers.map((node) => {
        const { left, right, top, bottom, width, height } = StyleSheet.flatten(node.props?.style as never) as Record<string, unknown>;
        return { left, right, top, bottom, width, height };
      });

      // The tint and the svg both fill by insets alone.
      expect(insets).toHaveLength(2);
      expect(insets[0]).toEqual(insets[1]);
    });

    it('sits over the blur and the tint, and never takes a touch', async () => {
      const json = JSON.stringify(await renderHighlighted());

      expect(json.indexOf('RNSVGSvgView')).toBeGreaterThan(json.indexOf('ExpoBlur'));
      expect(json.indexOf('RNSVGSvgView')).toBeGreaterThan(json.indexOf(withAlpha(colors.surface, glass.tintOpacity)));
      expect(json).toContain('"pointerEvents":"none","focusable":false');
    });

    it('draws over the content that comes after it, not under it', async () => {
      const screen = await render(
        <GlassSurface highlight style={{ borderRadius: 16 }}>
          <GlassBackdrop />
        </GlassSurface>,
      );
      const json = JSON.stringify(screen.toJSON());

      expect(json.indexOf('RNSVGSvgView')).toBeLessThan(json.lastIndexOf('ExpoBlur'));
    });
  });
});

describe('GlassHighlight as a sheet — the rim along the top of a bottom sheet', () => {
  const SHEET_RADIUS = 28;
  const renderSheetRim = async () =>
    (await render(<GlassHighlight kind="sheet" cornerRadius={SHEET_RADIUS} />)).toJSON() as unknown as TreeNode;

  it('is only the rim: no sheen over the glass', async () => {
    const json = JSON.stringify(await renderSheetRim());

    expect(json).toContain('glassRim');
    expect(json).not.toContain('glassSheen');
  });

  it('is lit along the whole top edge and fades down the sides: a gradient that runs down, not across', async () => {
    const root = await renderSheetRim();
    const rim = walk(root).find((node) => node.props?.name === 'glassRim');
    const [bright, dim] = stopAlphas(root, 'glassRim');

    expect(rim?.props).toMatchObject({ x1: '0', y1: '0', x2: '0', y2: '1' });
    expect(Math.abs(bright - glass.rimOpacity.bright)).toBeLessThanOrEqual(ONE_STEP);
    expect(Math.abs(dim - glass.rimOpacity.dim)).toBeLessThanOrEqual(ONE_STEP);
    expect(bright).toBeGreaterThan(dim);
  });

  it('has just those two stops: no echo at the far corner, which is off the screen', async () => {
    expect(stopAlphas(await renderSheetRim(), 'glassRim')).toHaveLength(2);
  });

  it('follows the sheet\'s top corners', async () => {
    const rim = walk(await renderSheetRim()).find((node) => node.props?.stroke !== undefined);

    expect(rim?.props).toMatchObject({ rx: SHEET_RADIUS, ry: SHEET_RADIUS, strokeWidth: borderWidth.thin * 2 });
  });

  it("is drawn in a rectangle taller than the sheet, so its bottom edge and corners fall outside the clip", async () => {
    const rim = walk(await renderSheetRim()).find((node) => node.props?.stroke !== undefined);

    expect(rim?.props?.height).toBe('200%');
  });

  it('takes the light from the palette: `paper`, never a color', async () => {
    const rim = walk(await renderSheetRim()).find((node) => node.props?.name === 'glassRim');
    const paper = [1, 3, 5].map((index) => parseInt(colors.paper.slice(index, index + 2), 16));

    for (const argb of ((rim?.props?.gradient ?? []) as number[]).filter((_, index) => index % 2 === 1)) {
      expect([(argb >>> 16) & 0xff, (argb >>> 8) & 0xff, argb & 0xff]).toEqual(paper);
    }
  });

  // Regression, as for the card: a percentage size on an absolute layer is measured without the padding.
  it('is sized by its insets, like the rest of the glass', async () => {
    const svg = walk(await renderSheetRim()).find((node) => node.type === 'RNSVGSvgView');
    const flat = StyleSheet.flatten(svg?.props?.style as never) as Record<string, unknown>;

    expect(flat).toMatchObject({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 });
    expect(flat.width).toBeUndefined();
    expect(flat.height).toBeUndefined();
  });

  it('leaves a card as it was: the default is the diagonal rim with its sheen', async () => {
    const root = (await render(<GlassHighlight cornerRadius={40} />)).toJSON() as unknown as TreeNode;
    const rim = walk(root).find((node) => node.props?.name === 'glassRim');

    expect(JSON.stringify(root)).toContain('glassSheen');
    expect(rim?.props).toMatchObject({ x2: '1', y2: '1' });
    expect(stopAlphas(root, 'glassRim')).toHaveLength(3);
  });
});

describe('glassRimmedStyle', () => {
  it('takes the place of the hairline: no border, so the gradient rim is the only outline', () => {
    expect(glassRimmedStyle.borderWidth).toBe(0);
  });
});

// Regression: on the toast — a short bar with a big radius — the rim came out "outstretched". The
// container is clipped to a circle of half its height, but an SVG rect clamps `rx` to half its width
// and `ry` to half its height separately, so the rim was an ellipse, off the clip at the ends.
describe('the rim\'s radius on a container too short for it', () => {
  const measure = (width: number, height: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height } } });
  const rimOf = (root: TreeNode | null) => walk(root).find((node) => node.props?.stroke !== undefined)?.props;
  const renderRim = (props: { cornerRadius: number; kind?: 'card' | 'sheet' }) => render(<GlassHighlight {...props} />);
  const rootOf = (screen: Awaited<ReturnType<typeof renderRim>>) => screen.toJSON() as unknown as TreeNode;

  it("is the container's radius until it has been measured", async () => {
    const screen = await renderRim({ cornerRadius: 40 });

    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 40, ry: 40 });
  });

  it('is clamped to half of the height once measured: a 40 radius on a 46-tall bar is a circle of 23', async () => {
    const screen = await renderRim({ cornerRadius: 40 });

    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(360, 46));

    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 23, ry: 23 });
  });

  it('has the SAME radius both ways, so the ends are circles and not ellipses', async () => {
    const screen = await renderRim({ cornerRadius: 40 });

    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(360, 46));

    const props = rimOf(rootOf(screen))!;
    expect(props.rx).toBe(props.ry);
  });

  it('is clamped to half of the width for a tall, narrow one', async () => {
    const screen = await renderRim({ cornerRadius: 40 });

    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(50, 300));

    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 25, ry: 25 });
  });

  it('leaves a radius that fits alone: 16 on the same bar', async () => {
    const screen = await renderRim({ cornerRadius: 16 });

    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(360, 46));

    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 16, ry: 16 });
  });

  it('leaves a popup alone: 40 on a card of 300 x 220', async () => {
    const screen = await renderRim({ cornerRadius: 40 });

    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(300, 220));

    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 40, ry: 40 });
  });

  it('follows the container when it is resized', async () => {
    const screen = await renderRim({ cornerRadius: 40 });
    const highlight = screen.getByTestId('glass-highlight');

    await fireEvent(highlight, 'layout', measure(360, 46));
    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 23 });

    await fireEvent(highlight, 'layout', measure(360, 90));
    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 40 });
  });

  // A sheet's rim is drawn twice as tall as the sheet, so it clamps against that.
  it("clamps a sheet's rim against the rectangle it is drawn in, twice the sheet's height", async () => {
    const screen = await renderRim({ cornerRadius: 28, kind: 'sheet' });

    // 28 fits in half of 2 x 40.
    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(390, 40));
    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 28, ry: 28 });

    // ...but not in half of 2 x 20.
    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(390, 20));
    expect(rimOf(rootOf(screen))).toMatchObject({ rx: 20, ry: 20 });
  });

  it('is what a GlassSurface hands its rim: the surface\'s own radius, then clamped', async () => {
    const screen = await render(<GlassSurface highlight style={{ borderRadius: 40 }} />);
    expect(rimOf(screen.toJSON() as unknown as TreeNode)).toMatchObject({ rx: 40 });

    await fireEvent(screen.getByTestId('glass-highlight'), 'layout', measure(360, 46));

    expect(rimOf(screen.toJSON() as unknown as TreeNode)).toMatchObject({ rx: 23, ry: 23 });
  });
});
