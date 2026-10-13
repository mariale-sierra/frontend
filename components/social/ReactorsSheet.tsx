import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheetModal } from '../ui/bottomSheetModal';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { FollowListItem } from '../profile/FollowListItem';
import { colors, spacing } from '../../constants/theme';
import { listReactors } from '../../services/workout-posts/workout-posts.service';
import type { ReactorContract } from '../../types/workout-post-social';

interface ReactorsSheetProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

/** Everyone who reacted to a post, newest first — names and faces, no
 * count (Sprint 9, B5). Rows tap through to each profile. */
export function ReactorsSheet({ visible, postId, onClose }: ReactorsSheetProps) {
  const { t } = useTranslation();
  const [reactors, setReactors] = useState<ReactorContract[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    listReactors(postId)
      .then((page) => {
        if (cancelled) return;
        setReactors(page.reactors);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, postId]);

  function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    listReactors(postId, nextCursor)
      .then((page) => {
        setReactors((prev) => [...prev, ...page.reactors]);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} glass height="60%">
      <View style={styles.flexFill}>
        <Text variant="subheader" align="center" style={styles.title}>
          {t('reactions.sheetTitle')}
        </Text>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text tone="secondary">{t('reactions.loadError')}</Text>
          </View>
        ) : (
          <FlatList
            style={styles.flexFill}
            data={reactors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FollowListItem user={item} onNavigate={onClose} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text tone="secondary">{t('reactions.empty')}</Text>
              </View>
            }
            ListFooterComponent={
              nextCursor ? (
                <Button variant="outline" size="sm" loading={loadingMore} onPress={loadMore} style={styles.more}>
                  {t('reactions.loadMore')}
                </Button>
              ) : null
            }
          />
        )}
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
});
