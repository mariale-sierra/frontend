import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing } from '../../constants/theme';

/** Attribution required by the RepDB Free Tier License (exercise data/images)
 * — a visible in-app credit, satisfied here. muscle_mapper's `minimal` style
 * (MIT) needs no attribution, but is credited anyway for provenance. */
export default function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} onPress={() => router.back()} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('about.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text variant="header" size="sm" tone="secondary" style={styles.cardTitle}>
            {t('about.exerciseDataTitle')}
          </Text>
          <Text variant="body">{t('about.exerciseDataCredit')}</Text>
        </View>

        <View style={styles.card}>
          <Text variant="header" size="sm" tone="secondary" style={styles.cardTitle}>
            {t('about.anatomyTitle')}
          </Text>
          <Text variant="body">{t('about.anatomyCredit')}</Text>
        </View>
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
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.base,
    gap: spacing.sm,
  },
  cardTitle: {
    textTransform: 'uppercase',
  },
});
