import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ScreenBackground from '../../components/layout/screenBackground';
import { MetricsExerciseTable } from '../../components/add/metricsExerciseTable';
import { MetricsPanel } from '../../components/add/metricsPanel';
import { MetricsTopBar } from '../../components/add/metricsTopBar';
import { CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../components/challenge/create';
import { Divider } from '../../components/ui/divider';
import { colors, radius, spacing } from '../../constants/theme';
import { useMetricsScreen } from '../../hooks/useMetricsScreen';
import { useTranslation } from 'react-i18next';
import { Text } from '../../components/ui/text';

export default function Metrics() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    challenges,
    selectedChallengeId,
    isChallengeMenuOpen,
    exerciseMetrics,
    activeRowKey,
    isSubmitting,
    isLoadingData,
    challengeLoadError,
    toggleChallengeMenu,
    selectChallenge,
    updateMetricValue,
    updateExerciseNotes,
    onRowFocus,
    onRowBlur,
    goToCamera,
    goToRestDay,
    goBack,
    submitMetrics,
  } = useMetricsScreen();

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ?? challenges[0];

  const hasChallenges = challenges.length > 0;
  const isEmpty = !isLoadingData && !challengeLoadError && !hasChallenges;

  function renderPanelContent() {
    if (isLoadingData) {
      return (
        <View style={styles.stateWrap}>
          <ActivityIndicator color={colors.textSecondary} />
          <Text variant="body" tone="secondary" style={styles.stateText}>
            Loading your challenges...
          </Text>
        </View>
      );
    }

    if (challengeLoadError === '401') {
      return (
        <View style={styles.stateWrap}>
          <Text variant="body" tone="secondary" style={styles.stateText}>
            Please log in again.
          </Text>
        </View>
      );
    }

    if (challengeLoadError) {
      return (
        <View style={styles.stateWrap}>
          <Text variant="body" tone="secondary" style={styles.stateText}>
            Could not load your challenges.
          </Text>
        </View>
      );
    }

    if (isEmpty) {
      return (
        <View style={styles.stateWrap}>
          <Text variant="body" tone="secondary" style={styles.stateText}>
            You are not part of any challenge yet.
          </Text>
          <Pressable
            onPress={() => router.replace('/challenge/explore-all')}
            style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]}
          >
            <Text variant="body" style={styles.exploreLabel}>
              Explore challenges
            </Text>
          </Pressable>
        </View>
      );
    }

    if (exerciseMetrics.length === 0) {
      return (
        <View style={styles.stateWrap}>
          <Text variant="body" tone="secondary" style={styles.stateText}>
            No exercises for today's routine.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.metricsScroll}
        contentContainerStyle={styles.metricsContent}
        showsVerticalScrollIndicator={false}
      >
        {exerciseMetrics.map((exercise, exerciseIndex) => (
          <MetricsExerciseTable
            key={exercise.id}
            exercise={exercise}
            index={exerciseIndex}
            activeRowKey={activeRowKey}
            onRowFocus={onRowFocus}
            onRowBlur={onRowBlur}
            onMetricChange={updateMetricValue}
            onNotesChange={updateExerciseNotes}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <ScreenBackground variant="default">
      <View style={styles.screen}>
        <View style={styles.headerWrap}>
          <MetricsTopBar
            challenges={challenges}
            selectedChallengeId={selectedChallengeId}
            isChallengeMenuOpen={isChallengeMenuOpen}
            onToggleChallengeMenu={toggleChallengeMenu}
            onSelectChallenge={selectChallenge}
            onBack={goBack}
            onRestDay={goToRestDay}
            onSkip={goToCamera}
          />
        </View>

        <Divider variant="section" />

        <MetricsPanel>
          {renderPanelContent()}
        </MetricsPanel>

        <CreateFlowFixedBottomBar bottomInset={Math.max(insets.bottom, spacing.lg)}>
          <CreateChallengePrimaryActionButton
            onPress={goToCamera}
            loading={false}
            label="Next"
            disabled={!hasChallenges}
          />
        </CreateFlowFixedBottomBar>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerWrap: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  metricsScroll: {
    flex: 1,
  },
  metricsContent: {
    paddingBottom: spacing['2xl'] + 132,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  stateText: {
    textAlign: 'center',
  },
  exploreButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  exploreLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
  },
});
