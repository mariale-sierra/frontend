import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { AccentPill } from '../../components/ui/accentPill';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { ACTIVITY_ICON_NAME } from '../../components/icons/activityIcon';
import { LOCATION_ICON_NAME } from '../../components/icons/locationIcon';
import type { LocationType } from '../../components/icons/locationIcon';
import { ExerciseAccentBackdrop } from '../../components/exercises/exerciseAccentBackdrop';
import { ExercisePicture } from '../../components/exercises/exercisePicture';
import { MuscleAnatomyView } from '../../components/anatomy/muscleAnatomyView';
import type { AnatomyView, AnatomyHighlight } from '../../components/anatomy/muscleAnatomyView';
import { getExerciseDetail, getMuscleDetail } from '../../services/exercises/exercises.service';
import type { ExerciseDetail, MuscleSvgPartDto } from '../../services/exercises/exercises.service';
import {
  pickHeaderImageUrl,
  buildAnatomyHighlights,
  normalizeLocationCode,
} from '../../services/adapters/exerciseAdapter';
import { colors, radius, spacing, activityColors } from '../../constants/theme';
import { getChallengeAccentColor } from '../../services/adapters/challengeState';
import { activityTypeForCategoryCode, normalizeCategoryCode } from '../../constants/challengeFilters';

type MuscleWithRole = { role: 'primary' | 'secondary'; svgParts: MuscleSvgPartDto[] };

// The picture sits under the description, this share of the content's width.
const PICTURE_WIDTH = '60%';

export default function ExerciseDetailScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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
        <Row align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
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

  // The exercise's own activity color: its primary category's. The screen's light and
  // every badge are this color; an exercise with no category yet gets the neutral one.
  const primaryCategory = exercise.categories.find((category) => category.isPrimary) ?? exercise.categories[0];
  const accentColor = getChallengeAccentColor(primaryCategory ? activityTypeForCategoryCode(primaryCategory.code) : null);

  return (
    <ScreenBackground variant="top" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ExerciseAccentBackdrop color={accentColor} />

      {/* Just the back button: the exercise's name is right below, so a second copy
          of it up here would be redundant. */}
      <Row align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
      </Row>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="title" align="center">{exercise.name}</Text>

        {/* The official badges, the bigger size, on two centered lines: the
            activities, each in its own activity color, then the locations, as frosted
            glass with a `paper` icon and label — neutral, so the activity colors stay
            the only color here. The catalog's codes are normalized to the ones the labels and icons are keyed
            by, and a code with no translation shows the catalog's own name — never
            the raw key. */}
        <View style={styles.badges}>
          <Row justify="center" gap="sm" style={styles.badgeLine}>
            {exercise.categories.map((category) => {
              const code = normalizeCategoryCode(category.code);
              const activityType = activityTypeForCategoryCode(category.code);
              return (
                <AccentPill
                  key={category.code}
                  uppercase
                  icon={activityType ? ACTIVITY_ICON_NAME[activityType] : undefined}
                  label={t(`exerciseCatalog.categories.${code}` as never, { defaultValue: category.name })}
                  color={activityType ? activityColors[activityType] : accentColor}
                />
              );
            })}
          </Row>
          <Row justify="center" gap="sm" style={styles.badgeLine}>
            {exercise.locations.map((location) => {
              const code = normalizeLocationCode(location.code);
              return (
                <AccentPill
                  key={location.code}
                  uppercase
                  variant="glass"
                  icon={LOCATION_ICON_NAME[code as LocationType]}
                  label={t(`exerciseCatalog.locations.${code}` as never, { defaultValue: location.name })}
                />
              );
            })}
          </Row>
        </View>

        <Section title={t('exerciseCatalog.detail.description')}>
          <Text variant="body" tone="secondary">{exercise.description}</Text>
          {headerImage && <ExercisePicture uri={headerImage} width={PICTURE_WIDTH} />}
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
            <MuscleAnatomyView view={anatomyView} highlights={anatomyHighlights} width={220} color={accentColor} />
          </View>
        </Section>
      </ScrollView>
    </ScreenBackground>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="header" size="sm" style={styles.sectionTitle}>{title}</Text>
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A wide gap between the sections (major sections: `xl`).
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.xl,
  },
  // The two badge lines sit close together, each centered and wrapping if needed.
  badges: {
    gap: spacing.sm,
  },
  badgeLine: {
    flexWrap: 'wrap',
  },
  section: {
    gap: spacing.md,
  },
  // The section titles are `paper`, fully opaque (`Text`'s tone-opacity applies to a
  // custom color too, so it is cancelled back).
  sectionTitle: {
    color: colors.paper,
    opacity: 1,
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
