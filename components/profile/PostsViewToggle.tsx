import { useTranslation } from 'react-i18next';
import { SegmentedIconToggle } from '../ui/segmentedIconToggle';

export type PostsView = 'posts' | 'photos';

interface PostsViewToggleProps {
  view: PostsView;
  onViewChange: (view: PostsView) => void;
}

/** Thin wrapper around the shared SegmentedIconToggle (components/ui) with this screen's icons/copy. */
export function PostsViewToggle({ view, onViewChange }: PostsViewToggleProps) {
  const { t } = useTranslation();

  return (
    <SegmentedIconToggle
      value={view}
      onChange={onViewChange}
      options={[
        { value: 'posts', icon: 'eye-outline', accessibilityLabel: t('profile.postsViewA11y') },
        { value: 'photos', icon: 'camera-outline', accessibilityLabel: t('profile.photosViewA11y') },
      ]}
    />
  );
}
