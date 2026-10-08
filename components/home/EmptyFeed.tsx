import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Row } from '../layout/row';
import { colors, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

/**
 * Nothing in the feed yet. Instead of a dead end, points to the two ways the
 * feed fills up: joining challenges (people post their progress there) and
 * following people (their followers-only posts show up too).
 */
export function EmptyFeed() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Icon name="images-outline" size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
      <Text variant="body" weight="bold" align="center">
        {t('home.emptyFeedTitle')}
      </Text>
      <Text variant="body" tone="secondary" align="center">
        {t('home.emptyFeedMessage')}
      </Text>
      <Row gap="sm" justify="center" style={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          onPress={() => router.push('/(tabs)/challenges?view=explore')}
          testID="empty-feed-explore"
        >
          {t('home.emptyFeedExplore')}
        </Button>
        <Button variant="outline" size="sm" onPress={() => router.push('/(tabs)/search')} testID="empty-feed-people">
          {t('home.emptyFeedFindPeople')}
        </Button>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['2xl'],
  },
  actions: {
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
});
