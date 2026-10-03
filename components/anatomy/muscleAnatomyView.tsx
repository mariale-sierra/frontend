import Svg, { Line, Path } from 'react-native-svg';
import frontData from '../../assets/anatomy/front.json';
import backData from '../../assets/anatomy/back.json';
import { borderWidth, colors, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

export type AnatomyView = 'front' | 'back';

export interface AnatomyHighlight {
  svgPartId: string;
  role: 'primary' | 'secondary';
}

interface OutlinePathElement {
  tag: 'path';
  d: string;
}
interface OutlineLineElement {
  tag: 'line';
  x1: string;
  y1: string;
  x2: string;
  y2: string;
}
type OutlineElement = OutlinePathElement | OutlineLineElement;

interface AnatomyData {
  viewBox: string;
  parts: { id: string; d: string }[];
  outline: OutlineElement[];
}

const DATA: Record<AnatomyView, AnatomyData> = {
  front: frontData as AnatomyData,
  back: backData as AnatomyData,
};

interface MuscleAnatomyViewProps {
  view: AnatomyView;
  highlights: AnatomyHighlight[];
  width?: number;
  height?: number;
  /** The color the highlighted muscles are drawn in — the exercise's activity color
   * on its screen. Default `colors.secondary`, for a screen with no activity of its
   * own (the muscle screen). */
  color?: string;
}

/**
 * Renders the muscle_mapper `minimal`-style body silhouette (vendored, MIT-licensed — see
 * assets/anatomy/NOTICE.md) and highlights the given raw SVG part ids. Anatomical meaning
 * (which muscle maps to which part, whether it's a real mapping or a borrowed fallback) lives
 * entirely in the backend's `muscle_svg_parts` table — this component only knows how to draw
 * a part id with a role, it never decides what a part "means".
 *
 * Deliberately a single accent color (`color`) at two opacity tiers for
 * primary/secondary, never a color per muscle — the design system explicitly rejects
 * arbitrary per-icon/per-muscle hue coloring.
 */
// The body's contour: the `neutral` gray, opaque (a translucent line would show a
// brighter dot wherever two of its segments meet), and one thin (1px) line whatever
// size the view is drawn at. (The source drawing's own 1-unit line came out about a
// third of a pixel at the 220px the exercise screen draws it, so it read as a faint
// smudge; `paper` at that thickness was too strong.)
const OUTLINE_COLOR = colors.neutral;
const OUTLINE_STROKE_PX = borderWidth.thin;

export function MuscleAnatomyView({ view, highlights, width = 240, height, color = colors.secondary }: MuscleAnatomyViewProps) {
  const data = DATA[view];
  const [, , vbWidthRaw, vbHeightRaw] = data.viewBox.split(' ');
  const vbWidth = Number(vbWidthRaw);
  const vbHeight = Number(vbHeightRaw);
  const resolvedHeight = height ?? Math.round((width * vbHeight) / vbWidth);
  // The stroke is in the drawing's own units, which the view scales down by
  // `width / vbWidth` — so ask for as many as make the line `OUTLINE_STROKE_PX` on screen.
  const outlineStrokeWidth = (OUTLINE_STROKE_PX * vbWidth) / width;

  const roleByPartId = new Map(highlights.map((h) => [h.svgPartId, h.role]));

  return (
    <Svg width={width} height={resolvedHeight} viewBox={data.viewBox}>
      {/* Decorative body contour — matches the source SVG's own "body" group,
          rendered once as the base layer beneath the labeled parts. */}
      {data.outline.map((el, index) =>
        el.tag === 'line' ? (
          <Line
            key={`outline-${index}`}
            x1={el.x1}
            y1={el.y1}
            x2={el.x2}
            y2={el.y2}
            stroke={OUTLINE_COLOR}
            strokeWidth={outlineStrokeWidth}
          />
        ) : (
          <Path key={`outline-${index}`} d={el.d} stroke={OUTLINE_COLOR} strokeWidth={outlineStrokeWidth} fill="none" />
        ),
      )}

      {data.parts.map((part) => {
        const role = roleByPartId.get(part.id);
        const fill =
          role === 'primary'
            ? withAlpha(color, textOpacity.primary)
            : role === 'secondary'
              ? withAlpha(color, textOpacity.tertiary)
              : withAlpha(colors.surface, 0.5);
        return <Path key={part.id} d={part.d} fill={fill} />;
      })}
    </Svg>
  );
}
