import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../ui/emptyState';
import { EMPTY_ILLUSTRATIONS } from '../../constants/illustrations';

/**
 * Nothing in the feed yet. Instead of a dead end, points to the two ways the
 * feed fills up: joining challenges (people post their progress there) and
 * following people (their followers-only posts show up too).
 */
export function EmptyFeed() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    // Sprint 10: an illustration and one line, then the two ways out.
    <EmptyState
      illustration={EMPTY_ILLUSTRATIONS.feed}
      title={t('home.emptyFeedTitle')}
      testID="empty-feed"
      actions={[
        { label: t('home.emptyFeedExplore'), onPress: () => router.push('/(tabs)/challenges?view=explore'), testID: 'empty-feed-explore' },
        { label: t('home.emptyFeedFindPeople'), onPress: () => router.push('/(tabs)/search'), testID: 'empty-feed-people' },
      ]}
    />
  );
}
