import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fillOpacity, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface SkeletonProps {
  width?: DimensionValue;
  /** Omit when `style` supplies its own sizing (e.g. `aspectRatio`) instead of a fixed height. */
  height?: number;
  radius?: number;
  /** Slightly more visible fill for a skeleton block that sits on top of
   * another (e.g. an avatar circle over a card) — matches the two shades
   * `PostCardSkeleton` already used before this was extracted. */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * One placeholder block — the reusable building block for any screen's
 * loading state. Flat `paper`@8% fill (`12%` when `strong`), no animation:
 * matches the neutral-fill-wash convention already used for skeletons (see
 * design system skill's Open Items Tracker). Compose several of these into a
 * per-screen skeleton layout (see `PostCardSkeleton`, `HomeContentSkeleton`)
 * — to remove skeleton loading from a screen entirely, delete that
 * composition and the `isReady`-style gate around it; this primitive itself
 * has no dependency on either.
 */
export function Skeleton({ width = '100%', height, radius: cornerRadius = radius.small, strong = false, style }: SkeletonProps) {
  return (
    <View
      style={[
        { width, borderRadius: cornerRadius, backgroundColor: strong ? SHIMMER_STRONG : SHIMMER },
        height != null && { height },
        style,
      ]}
    />
  );
}

const SHIMMER = withAlpha(colors.paper, fillOpacity.subtle);
const SHIMMER_STRONG = withAlpha(colors.paper, fillOpacity.strong);
