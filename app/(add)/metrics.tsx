import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { LogMetricsExerciseCard } from '../../components/add/logMetricsExerciseCard';
import { CreateFlowPrimaryButton } from '../../components/challenge/create';
import { colors, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useMetricsScreen } from '../../hooks/useMetricsScreen';
import { countAdjustedSets } from '../../services/adapters/index';

export default function Metrics() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    challenges,
    selectedChallengeId,
    exerciseMetrics,
    isLoadingData,
    challengeLoadError,
    currentDay,
    routineName,
    updateMetricValue,
    goToCamera,
    goToRestDay,
    goBack,
  } = useMetricsScreen();

  const selectedChallenge = challenges.find((challenge) => challenge.id === selectedChallengeId) ?? challenges[0];
  const hasChallenges = challenges.length > 0;
  const isEmpty = !isLoadingData && !challengeLoadError && !hasChallenges;
  const totalAdjusted = exerciseMetrics.reduce((sum, exercise) => sum + countAdjustedSets(exercise), 0);

  function renderContent() {
    if (isLoadingData) {
      return (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={withAlpha(colors.paper, textOpacity.secondary)} />
        </View>
      );
    }

    if (challengeLoadError) {
      return (
        <View style={styles.stateWrap}>
          <Text tone="secondary" align="center">{t('metrics.alerts.submitErrorFallback')}</Text>
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.stateWrap}>
          <Text tone="secondary" align="center">{t('logMetrics.pickChallenge.emptyMessage')}</Text>
        </View>
      );
    }

    if (exerciseMetrics.length === 0) {
      return (
        <View style={styles.stateWrap}>
          <Text tone="secondary" align="center">{t('logMetrics.entry.noExercises')}</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Stack gap="base">
          {exerciseMetrics.map((exercise) => (
            <LogMetricsExerciseCard
              key={exercise.id}
              exercise={exercise}
              onChangeValue={(rowIndex, field, nextValue) =>
                updateMetricValue(exercise.id, rowIndex, field, String(nextValue))
              }
            />
          ))}
        </Stack>
      </ScrollView>
    );
  }

  return (
    <ScreenBackground variant="default" applyTopInset={false}>
      <View style={styles.headerPanel}>
        <Row justify="space-between" align="center" style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={goBack} hitSlop={12} style={styles.iconButton}>
            <Icon name="chevron-back-outline" size={24} color={colors.paper} />
          </Pressable>
          <Pressable
            onPress={goToRestDay}
            style={({ pressed }) => [styles.restDayButton, pressed && styles.restDayButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challenges.restDay')}
          >
            <Icon name="moon-outline" size={16} color={colors.ink} />
            <Text variant="label" weight="bold" style={styles.restDayButtonText}>
              {t('challenges.restDay')}
            </Text>
          </Pressable>
        </Row>

        <View style={styles.titleBlock}>
          <Text variant="header" size="xs" numberOfLines={1} style={styles.eyebrow}>
            {selectedChallenge?.label ?? ''}
          </Text>
          <Text variant="title" numberOfLines={2}>
            {routineName
              ? t('logMetrics.entry.dayWithRoutine', { day: currentDay ?? 1, routine: routineName })
              : t('logMetrics.pickChallenge.dayLabel', { day: currentDay ?? 1 })}
          </Text>
        </View>
      </View>

      <View style={styles.headerDivider} />

      <View style={styles.contentWrap}>{renderContent()}</View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text variant="caption" tone="secondary" align="center">
          {t('logMetrics.entry.footerCaption', { count: totalAdjusted })}
        </Text>
        <CreateFlowPrimaryButton
          onPress={goToCamera}
          label={t('logMetrics.entry.logDayCta')}
          disabled={!hasChallenges}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerPanel: {
    backgroundColor: colors.surface,
  },
  topBar: {
    paddingHorizontal: spacing.base,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.big,
    backgroundColor: colors.rest,
  },
  restDayButtonPressed: {
    opacity: 0.85,
  },
  restDayButtonText: {
    color: colors.ink,
    opacity: 1,
  },
  titleBlock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.base,
  },
  eyebrow: {
    color: colors.primary,
    opacity: 1,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: withAlpha(colors.paper, 0.08),
  },
  contentWrap: {
    flex: 1,
    paddingTop: spacing.base,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'] + 132,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  bottomBar: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
});
