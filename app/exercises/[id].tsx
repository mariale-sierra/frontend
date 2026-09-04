import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { LocationIcon } from '../../components/icons/locationIcon';
import type { LocationType } from '../../components/icons/locationIcon';
import { MuscleAnatomyView } from '../../components/anatomy/muscleAnatomyView';
import type { AnatomyView, AnatomyHighlight } from '../../components/anatomy/muscleAnatomyView';
import { getExerciseDetail, getMuscleDetail } from '../../services/exercises/exercises.service';
import type { ExerciseDetail, MuscleSvgPartDto } from '../../services/exercises/exercises.service';
import { pickHeaderImageUrl, buildAnatomyHighlights } from '../../services/adapters/exerciseAdapter';
import { colors, radius, spacing, activityColors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { CATEGORY_CODE_TO_ACTIVITY } from '../../constants/challengeFilters';

type MuscleWithRole = { role: 'primary' | 'secondary'; svgParts: MuscleSvgPartDto[] };

export default function ExerciseDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const locale = i18n.language.startsWith('es') ? 'es' : 'en';

  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [anatomyView, setAnatomyView] = useState<AnatomyView>('front');
  const [musclesWithParts, setMusclesWithParts] = useState<MuscleWithRole[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    getExerciseDetail(Number(id), locale)
      .then((data) => {
        if (!cancelled) setExercise(data);
      })
      .catch((error: any) => console.error('[ExerciseDetail] load', error?.response?.data ?? error?.message))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  // The list/full exercise endpoints deliberately don't embed every muscle's
  // svgParts (would bloat every exercise payload) — the anatomy panel needs
  // them, so it fetches each involved muscle's parts once the exercise is
  // known, reusing the same endpoint the muscle browser already calls.
  useEffect(() => {
    if (!exercise || exercise.muscles.length === 0) {
      setMusclesWithParts([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      exercise.muscles.map(async (m) => {
        try {
          const detail = await getMuscleDetail(m.code);
          return { role: m.role, svgParts: detail.svgParts };
        } catch {
          return { role: m.role, svgParts: [] as MuscleSvgPartDto[] };
        }
      }),
    ).then((results) => {
      if (!cancelled) setMusclesWithParts(results);
    });
    return () => {
      cancelled = true;
    };
  }, [exercise]);

  const anatomyHighlights: AnatomyHighlight[] = useMemo(
    () => buildAnatomyHighlights(musclesWithParts, anatomyView),
    [musclesWithParts, anatomyView],
  );

  if (loading || !exercise) {
    return (
      <ScreenBackground variant="top">
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
          <View style={styles.trailingSpacer} />
        </Row>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  const primaryMuscles = exercise.muscles.filter((m) => m.role === 'primary');
  const secondaryMuscles = exercise.muscles.filter((m) => m.role === 'secondary');
  const headerImage = pickHeaderImageUrl(exercise.assets);

  return (
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" numberOfLines={1} style={styles.headerTitle}>
          {exercise.name}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {headerImage && <Image source={{ uri: headerImage }} style={styles.heroImage} resizeMode="cover" />}

        <Text variant="title" style={styles.name}>{exercise.name}</Text>

        <Row style={styles.tagRow} gap="sm">
          {exercise.categories.map((category) => {
            const activityType = CATEGORY_CODE_TO_ACTIVITY[category.code];
            return (
              <View
                key={category.code}
                style={[styles.tag, activityType && { backgroundColor: withAlpha(activityColors[activityType], 0.16) }]}
              >
                {activityType && <ActivityIcon type={activityType} variant="plain" size="xs" color={activityColors[activityType]} />}
                <Text variant="caption" weight="medium">{t(`exerciseCatalog.categories.${category.code}` as never)}</Text>
              </View>
            );
          })}
          {exercise.locations.map((location) => (
            <View key={location.code} style={styles.tag}>
              <LocationIcon type={location.code as LocationType} variant="plain" size="xs" />
              <Text variant="caption" weight="medium">{t(`exerciseCatalog.locations.${location.code}` as never)}</Text>
            </View>
          ))}
        </Row>

        <Section title={t('exerciseCatalog.detail.description')}>
          <Text variant="body" tone="secondary">{exercise.description}</Text>
        </Section>

        <Section title={t('exerciseCatalog.detail.instructions')}>
          {exercise.instructions.map((step, index) => (
            <Row key={index} gap="sm" style={styles.listRow}>
              <Text variant="body" weight="bold" style={styles.listIndex}>{index + 1}.</Text>
              <Text variant="body" tone="secondary" style={styles.listText}>{step}</Text>
            </Row>
          ))}
        </Section>

        {exercise.tips.length > 0 && (
          <Section title={t('exerciseCatalog.detail.tips')}>
            {exercise.tips.map((tip, index) => (
              <Row key={index} gap="sm" style={styles.listRow}>
                <Text variant="body" style={styles.listIndex}>•</Text>
                <Text variant="body" tone="secondary" style={styles.listText}>{tip}</Text>
              </Row>
            ))}
          </Section>
        )}

        {primaryMuscles.length > 0 && (
          <Section title={t('exerciseCatalog.detail.primaryMuscles')}>
            <Row gap="sm" style={styles.chipWrap}>
              {primaryMuscles.map((m) => (
                <MuscleChip
                  key={m.id}
                  label={t(`exerciseCatalog.muscles.${m.code}` as never)}
                  onPress={() => router.push(`/exercises/muscles/${m.code}`)}
                />
              ))}
            </Row>
          </Section>
        )}

        {secondaryMuscles.length > 0 && (
          <Section title={t('exerciseCatalog.detail.secondaryMuscles')}>
            <Row gap="sm" style={styles.chipWrap}>
              {secondaryMuscles.map((m) => (
                <MuscleChip
                  key={m.id}
                  label={t(`exerciseCatalog.muscles.${m.code}` as never)}
                  onPress={() => router.push(`/exercises/muscles/${m.code}`)}
                />
              ))}
            </Row>
          </Section>
        )}

        <Section title={t('exerciseCatalog.detail.anatomy')}>
          <Row gap="sm" style={styles.viewToggleRow}>
            <ViewToggleButton label={t('exerciseCatalog.detail.front')} active={anatomyView === 'front'} onPress={() => setAnatomyView('front')} />
            <ViewToggleButton label={t('exerciseCatalog.detail.back')} active={anatomyView === 'back'} onPress={() => setAnatomyView('back')} />
          </Row>
          <View style={styles.anatomyWrap}>
            <MuscleAnatomyView view={anatomyView} highlights={anatomyHighlights} width={220} />
          </View>
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

function MuscleChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.muscleChip, pressed && styles.muscleChipPressed]} onPress={onPress}>
      <Text variant="caption" weight="medium">{label}</Text>
    </Pressable>
  );
}

function ViewToggleButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.viewToggleButton, active && styles.viewToggleButtonActive, pressed && styles.muscleChipPressed]}
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
    gap: spacing.base,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.small,
    backgroundColor: colors.surface,
  },
  name: {
    marginTop: spacing.sm,
  },
  tagRow: {
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  listRow: {
    alignItems: 'flex-start',
  },
  listIndex: {
    width: 20,
  },
  listText: {
    flex: 1,
  },
  chipWrap: {
    flexWrap: 'wrap',
  },
  muscleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  muscleChipPressed: {
    opacity: 0.8,
  },
  viewToggleRow: {
    marginBottom: spacing.sm,
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
  anatomyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
});
