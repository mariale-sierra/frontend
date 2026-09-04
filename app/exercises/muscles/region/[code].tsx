import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../../components/layout/screenBackground';
import { Row } from '../../../../components/layout/row';
import { BackButton } from '../../../../components/ui/backButton';
import { Text } from '../../../../components/ui/text';
import { MuscleListItem } from '../../../../components/exercises/muscleListItem';
import { getMusclesInRegion } from '../../../../services/exercises/exercises.service';
import type { MuscleSummary } from '../../../../services/exercises/exercises.service';
import { adaptMuscleSummary } from '../../../../services/adapters/exerciseAdapter';
import { colors, spacing } from '../../../../constants/theme';

export default function MuscleRegionListScreen() {
  const { t } = useTranslation();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [muscles, setMuscles] = useState<MuscleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    getMusclesInRegion(code)
      .then(setMuscles)
      .catch((error: any) => console.error('[MuscleRegionList] load', error?.message))
      .finally(() => setLoading(false));
  }, [code]);

  const regionLabel = code ? t(`exerciseCatalog.regions.${code}` as never) : '';

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} onPress={() => router.back()} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {regionLabel}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={muscles.map(adaptMuscleSummary)}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <MuscleListItem
              name={t(`exerciseCatalog.muscles.${item.code}` as never)}
              imageUrl={item.iconUrl}
              onPress={() => router.push(`/exercises/muscles/${item.code}`)}
            />
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
  loadingWrap: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
});
