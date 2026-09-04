import Svg, { G, Line, Path } from 'react-native-svg';
import frontData from '../../assets/anatomy/front.json';
import backData from '../../assets/anatomy/back.json';
import { colors, textOpacity } from '../../constants/theme';
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
}

/**
 * Renders the muscle_mapper `minimal`-style body silhouette (vendored, MIT-licensed — see
 * assets/anatomy/NOTICE.md) and highlights the given raw SVG part ids. Anatomical meaning
 * (which muscle maps to which part, whether it's a real mapping or a borrowed fallback) lives
 * entirely in the backend's `muscle_svg_parts` table — this component only knows how to draw
 * a part id with a role, it never decides what a part "means".
 *
 * Deliberately a single accent color (`colors.secondary`) at two opacity tiers for
 * primary/secondary, never a color per muscle — the design system explicitly rejects
 * arbitrary per-icon/per-muscle hue coloring.
 */
export function MuscleAnatomyView({ view, highlights, width = 240, height }: MuscleAnatomyViewProps) {
  const data = DATA[view];
  const [, , vbWidthRaw, vbHeightRaw] = data.viewBox.split(' ');
  const vbWidth = Number(vbWidthRaw);
  const vbHeight = Number(vbHeightRaw);
  const resolvedHeight = height ?? Math.round((width * vbHeight) / vbWidth);

  const roleByPartId = new Map(highlights.map((h) => [h.svgPartId, h.role]));

  return (
    <Svg width={width} height={resolvedHeight} viewBox={data.viewBox}>
      {/* Decorative body contour — matches the source SVG's own "body" group,
          rendered once as a dim, neutral base layer beneath the labeled parts. */}
      <G opacity={0.35}>
        {data.outline.map((el, index) =>
          el.tag === 'line' ? (
            <Line
              key={`outline-${index}`}
              x1={el.x1}
              y1={el.y1}
              x2={el.x2}
              y2={el.y2}
              stroke={colors.neutral}
              strokeWidth={1}
            />
          ) : (
            <Path key={`outline-${index}`} d={el.d} stroke={colors.neutral} strokeWidth={1} fill="none" />
          ),
        )}
      </G>

      {data.parts.map((part) => {
        const role = roleByPartId.get(part.id);
        const fill =
          role === 'primary'
            ? withAlpha(colors.secondary, textOpacity.primary)
            : role === 'secondary'
              ? withAlpha(colors.secondary, textOpacity.tertiary)
              : withAlpha(colors.surface, 0.5);
        return <Path key={part.id} d={part.d} fill={fill} />;
      })}
    </Svg>
  );
}
