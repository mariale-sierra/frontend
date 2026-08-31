import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { FriendStreakCard } from './FriendStreakCard';
import type { FriendStreakViewModel } from '../../services/adapters/followAdapter';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface FriendsStreakSectionProps {
  friends: FriendStreakViewModel[];
  loading?: boolean;
  error?: boolean;
  onSeeMore?: () => void;
}

function SkeletonCard() {
  return <View style={styles.skeletonCard} />;
}

export function FriendsStreakSection({
  friends,
  loading = false,
  error = false,
  onSeeMore,
}: FriendsStreakSectionProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Row justify="space-between" align="center" style={styles.header}>
        <Text variant="subheader">{t('home.streaksTitle')}</Text>

        {onSeeMore && friends.length > 0 && (
          <Row pressable onPress={onSeeMore} gap="xs">
            <Text variant="label">{t('home.seeMore')}</Text>
          </Row>
        )}
      </Row>

      {loading ? (
        <View style={styles.skeletonRow}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : error ? (
        <Text variant="body" tone="secondary" style={styles.message}>
          {t('home.streaksErrorMessage')}
        </Text>
      ) : friends.length === 0 ? (
        <Text variant="body" tone="secondary" style={styles.message}>
          {t('home.emptyStreaksMessage')}
        </Text>
      ) : (
        <FlatList
          data={friends}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <FriendStreakCard friend={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  listContent: {
    paddingRight: spacing.lg,
  },
  separator: {
    width: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  // Was `withAlpha(colors.paper, 0.1)` — a one-off value close to, but not
  // quite, the shared Skeleton primitive's own `subtle` fill (0.08),
  // purely because this predates that primitive and typed its own number.
  // Converged onto the real shared token — see `fillOpacity`.
  skeletonCard: {
    width: 58,
    height: 58 + spacing.xl,
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.paper, fillOpacity.subtle),
  },
  message: {
    paddingVertical: spacing.sm,
  },
});
