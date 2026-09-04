import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { getMuscleRegions } from '../../../services/exercises/exercises.service';
import type { MuscleRegionSummary } from '../../../services/exercises/exercises.service';
import { colors, radius, spacing } from '../../../constants/theme';

export default function MuscleRegionsScreen() {
  const { t } = useTranslation();
  const [regions, setRegions] = useState<MuscleRegionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMuscleRegions()
      .then(setRegions)
      .catch((error: any) => console.error('[MuscleRegions] load', error?.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('exerciseCatalog.muscleBrowser.title')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <Text variant="body" tone="secondary" style={styles.subtitle}>
        {t('exerciseCatalog.muscleBrowser.regionsSubtitle')}
      </Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push(`/exercises/muscles/region/${item.code}`)}
            >
              <View style={styles.textColumn}>
                <Text variant="body" weight="bold">{t(`exerciseCatalog.regions.${item.code}` as never)}</Text>
                <Text variant="caption" tone="secondary">
                  {t('exerciseCatalog.muscleBrowser.muscleCount', { count: item.muscleCount })}
                </Text>
              </View>
              <Icon name="chevron-forward-outline" size={18} color={colors.neutral} />
            </Pressable>
          )}
        />
      )}
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
  subtitle: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  loadingWrap: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.medium,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    opacity: 0.9,
  },
  textColumn: {
    gap: spacing.xs,
  },
});
