import { useTranslation } from 'react-i18next';
import { GlassSegmentedControl } from '../ui/glassSegmentedControl';

export type PostsView = 'posts' | 'photos';

interface PostsViewToggleProps {
  view: PostsView;
  onViewChange: (view: PostsView) => void;
}

// Same compact two-icon size the toggle has always had (64 x 36 segments).
const SEGMENT_WIDTH = 64;
const SEGMENT_HEIGHT = 36;

/** Profile's posts / photos toggle — the glass segmented control (sliding chip,
 * haptic, drag; see `GlassSegmentedControl`) with this screen's icons and copy. */
export function PostsViewToggle({ view, onViewChange }: PostsViewToggleProps) {
  const { t } = useTranslation();

  return (
    <GlassSegmentedControl<PostsView>
      value={view}
      onChange={onViewChange}
      segmentWidth={SEGMENT_WIDTH}
      segmentHeight={SEGMENT_HEIGHT}
      style={{ alignSelf: 'center' }}
      segments={[
        { key: 'posts', icon: 'eye-outline', accessibilityLabel: t('profile.postsViewA11y') },
        { key: 'photos', icon: 'camera-outline', accessibilityLabel: t('profile.photosViewA11y') },
      ]}
    />
  );
}
