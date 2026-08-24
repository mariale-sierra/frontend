import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Icon } from '../ui/icon';

export type PostsView = 'posts' | 'photos';

interface PostsViewToggleProps {
  view: PostsView;
  onViewChange: (view: PostsView) => void;
}

const SEGMENT_SIZE = { width: 64, height: 36 };
const INACTIVE_ICON_COLOR = withAlpha(colors.paper, textOpacity.tertiary);

// Segmented control, per design system → Components → Segmented control:
// `surface` track, `big` radius, `xs` internal padding; active segment is a
// filled `primary` pill (also `big` radius, fills its slot); inactive is
// transparent with a `text-tertiary` icon.
export function PostsViewToggle({ view, onViewChange }: PostsViewToggleProps) {
  return (
    <View style={styles.track}>
      <Pressable
        style={[styles.segment, view === 'posts' && styles.segmentActive]}
        onPress={() => onViewChange('posts')}
        accessibilityRole="button"
      >
        <Icon name="eye-outline" size={20} color={view === 'posts' ? colors.ink : INACTIVE_ICON_COLOR} />
      </Pressable>
      <Pressable
        style={[styles.segment, view === 'photos' && styles.segmentActive]}
        onPress={() => onViewChange('photos')}
        accessibilityRole="button"
      >
        <Icon name="camera-outline" size={20} color={view === 'photos' ? colors.ink : INACTIVE_ICON_COLOR} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  segment: {
    width: SEGMENT_SIZE.width,
    height: SEGMENT_SIZE.height,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
});
