import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { MetricsExerciseTable } from '../../components/add/metricsExerciseTable';
import { MetricsPanel } from '../../components/add/metricsPanel';
import { MetricsTopBar } from '../../components/add/metricsTopBar';
import { CreateChallengePrimaryActionButton, CreateFlowFixedBottomBar } from '../../components/challenge/create';
import { Divider } from '../../components/ui/divider';
import { spacing } from '../../constants/theme';
import { useMetricsScreen } from '../../hooks/useMetricsScreen';
import { useTranslation } from 'react-i18next';
import { Text } from '../../components/ui/text';

export default function Metrics() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    challenges,
    selectedChallengeId,
    isChallengeMenuOpen,
    exerciseMetrics,
    activeRowKey,
    isSubmitting,
    isLoadingData,
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
          {isLoadingData ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator />
              <Text variant="body" tone="secondary" style={styles.loadingText}>
                {selectedChallenge?.label
                  ? `Cargando ${selectedChallenge.label}...`
                  : 'Cargando rutina...'}
              </Text>
            </View>
          ) : exerciseMetrics.length === 0 ? (
            <View style={styles.loadingWrap}>
              <Text variant="body" tone="secondary">
                No hay ejercicios para mostrar.
              </Text>
            </View>
          ) : (
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
          )}
        </MetricsPanel>

        <CreateFlowFixedBottomBar bottomInset={Math.max(insets.bottom, spacing.lg)}>
          <CreateChallengePrimaryActionButton
            onPress={submitMetrics}
            loading={isSubmitting}
            label={t('metrics.logWorkout')}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    textAlign: 'center',
  },
});
