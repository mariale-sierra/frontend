import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { ExerciseListItem } from '../../../components/routine';
import { MuscleAnatomyView } from '../../../components/anatomy/muscleAnatomyView';
import type { AnatomyView } from '../../../components/anatomy/muscleAnatomyView';
import { getMuscleDetail } from '../../../services/exercises/exercises.service';
import type { MuscleDetail } from '../../../services/exercises/exercises.service';
import { adaptMuscleExerciseRow, buildSingleMuscleHighlights } from '../../../services/adapters/exerciseAdapter';
import { colors, radius, spacing } from '../../../constants/theme';

export default function MuscleDetailScreen() {
  const { t } = useTranslation();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [muscle, setMuscle] = useState<MuscleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [anatomyView, setAnatomyView] = useState<AnatomyView>('front');

  useEffect(() => {
    if (!code) return;
    getMuscleDetail(code)
      .then(setMuscle)
      .catch((error: any) => console.error('[MuscleDetail] load', error?.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading || !muscle) {
    return (
      <ScreenBackground variant="top">
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} onPress={() => router.back()} />
          <View style={styles.trailingSpacer} />
        </Row>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  const highlights = buildSingleMuscleHighlights(muscle.svgParts, anatomyView);
  const hasBackView = muscle.svgParts.some((p) => p.view === 'back');
  const hasFrontView = muscle.svgParts.some((p) => p.view === 'front');

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} onPress={() => router.back()} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t(`exerciseCatalog.muscles.${muscle.code}` as never)}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {(hasFrontView || hasBackView) && (
          <View style={styles.anatomyWrap}>
            <MuscleAnatomyView view={anatomyView} highlights={highlights} width={200} />
            {hasFrontView && hasBackView && (
              <Row gap="sm" style={styles.viewToggleRow}>
                <ViewToggleButton label={t('exerciseCatalog.detail.front')} active={anatomyView === 'front'} onPress={() => setAnatomyView('front')} />
                <ViewToggleButton label={t('exerciseCatalog.detail.back')} active={anatomyView === 'back'} onPress={() => setAnatomyView('back')} />
              </Row>
            )}
          </View>
        )}

        <Section title={t('exerciseCatalog.muscleBrowser.primaryIn')}>
          {muscle.primaryExercises.data.length === 0 ? (
            <Text variant="body" tone="secondary">{t('exerciseCatalog.muscleBrowser.emptyPrimary')}</Text>
          ) : (
            <View style={styles.exerciseList}>
              {muscle.primaryExercises.data.map(adaptMuscleExerciseRow).map((row) => (
                <ExerciseListItem
                  key={row.id}
                  name={row.name}
                  meta=""
                  imageUrl={row.imageUrl}
                  selected={false}
                  mode="navigate"
                  onPress={() => router.push(`/exercises/${row.id}`)}
                />
              ))}
            </View>
          )}
        </Section>

        <Section title={t('exerciseCatalog.muscleBrowser.secondaryIn')}>
          {muscle.secondaryExercises.data.length === 0 ? (
            <Text variant="body" tone="secondary">{t('exerciseCatalog.muscleBrowser.emptySecondary')}</Text>
          ) : (
            <View style={styles.exerciseList}>
              {muscle.secondaryExercises.data.map(adaptMuscleExerciseRow).map((row) => (
                <ExerciseListItem
                  key={row.id}
                  name={row.name}
                  meta=""
                  imageUrl={row.imageUrl}
                  selected={false}
                  mode="navigate"
                  onPress={() => router.push(`/exercises/${row.id}`)}
                />
              ))}
            </View>
          )}
        </Section>
      </ScrollView>
    </ScreenBackground>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="header" size="sm" tone="secondary" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ViewToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.viewToggleButton, active && styles.viewToggleButtonActive, pressed && styles.viewToggleButtonPressed]}
    >
      <Text variant="label" size="sm" weight={active ? 'bold' : 'medium'} inverse={active} tone={active ? 'primary' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  anatomyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  viewToggleRow: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  exerciseList: {
    gap: spacing.sm,
  },
  viewToggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
  },
  viewToggleButtonPressed: {
    opacity: 0.85,
  },
});
