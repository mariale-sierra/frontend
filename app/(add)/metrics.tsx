import { ScrollView, StyleSheet, View } from 'react-native';
import ScreenBackground from '../../components/layout/screenBackground';
import { MetricsExerciseTable } from '../../components/add/metricsExerciseTable';
import { MetricsPanel } from '../../components/add/metricsPanel';
import { MetricsTopBar } from '../../components/add/metricsTopBar';
import { MetricsRoutineSelector } from '../../components/add/metricsRoutineSelector';
import { Button } from '../../components/ui/button';
import { spacing } from '../../constants/theme';
import { useMetricsScreen } from '../../hooks/useMetricsScreen';

export default function Metrics() {
  const {
    challenges,
    selectedChallengeId,
    isChallengeMenuOpen,
    exerciseMetrics,
    activeRowKey,
    routines,
    selectedRoutineId,
    isRoutineMenuOpen,
    isSubmitting,
    toggleChallengeMenu,
    selectChallenge,
    updateMetricValue,
    updateExerciseNotes,
    onRowFocus,
    onRowBlur,
    toggleRoutineMenu,
    selectRoutine,
    goToCamera,
    goToRestDay,
    goBack,
    submitMetrics,
  } = useMetricsScreen();

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

          <View style={styles.routineRow}>
            <MetricsRoutineSelector
              routines={routines}
              selectedRoutineId={selectedRoutineId}
              isOpen={isRoutineMenuOpen}
              onToggle={toggleRoutineMenu}
              onSelect={selectRoutine}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <MetricsPanel>
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
        </MetricsPanel>

        <View style={styles.footer}>
          <Button onPress={submitMetrics} loading={isSubmitting}>
            Log workout
          </Button>
        </View>
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
  routineRow: {
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  metricsScroll: {
    flex: 1,
  },
  metricsContent: {
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
