import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { BadgesSection } from '../../components/badges';
import { spacing } from '../../constants/theme';

/**
 * Badges (2026-10-23, explicit request): a user's badges on their own screen —
 * the session user's, or (Sprint 10) another user's when opened with `?userId=`
 * from their profile — opened from the badge icon at the top right of the profile, instead of
 * a row on the profile itself. Every badge in a grid, earned ones first, with the
 * earned count above; tapping one opens its detail sheet (how it's earned, the
 * progress so far). Same header as Settings: back, then the centered title.
 */
export default function BadgesScreen() {
  const { t } = useTranslation();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('badges.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content}>
        <BadgesSection layout="grid" userId={userId || undefined} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  trailingSpacer: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
});
