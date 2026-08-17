import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Row } from '../layout/row';
import { FriendStreakCard } from './FriendStreakCard';
import type { FriendStreakViewModel } from './FriendStreakCard';
import { colors, radius, spacing } from '../../constants/theme';

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
        <Row gap="xs">
          <Icon name="people-outline" size={18} color="rgba(255,255,255,0.7)" />
          <Text variant="header" tone="secondary">{t('home.streaksTitle')}</Text>
        </Row>

        {onSeeMore && friends.length > 0 && (
          <Row pressable onPress={onSeeMore} gap="xxs">
            <Text variant="body" tone="secondary">{t('home.seeMore')}</Text>
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
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingRight: spacing.lg,
  },
  separator: {
    width: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  skeletonCard: {
    width: 180,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
  },
  message: {
    paddingVertical: spacing.sm,
  },
});
