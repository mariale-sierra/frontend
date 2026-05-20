import { StyleSheet, View } from 'react-native';
import { RestDayIconButton } from '../icons/restDayIconButton';
import { spacing } from '../../constants/theme';
import { MetricsChallengeSelector } from './metricsChallengeSelector';
import type { ChallengeOption } from '../../types/metrics';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../ui/iconButton';

interface MetricsTopBarProps {
  challenges: ChallengeOption[];
  selectedChallengeId: string;
  isChallengeMenuOpen: boolean;
  onToggleChallengeMenu: () => void;
  onSelectChallenge: (challengeId: string) => void;
  onBack: () => void;
  onRestDay: () => void;
  onSkip: () => void;
}

export function MetricsTopBar({
  challenges,
  selectedChallengeId,
  isChallengeMenuOpen,
  onToggleChallengeMenu,
  onSelectChallenge,
  onBack,
  onRestDay,
  onSkip,
}: MetricsTopBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={onBack}
        size={28}
        iconSize={18}
        variant="ghost"
        accessibilityRole="button"
        accessibilityLabel={t('metrics.accessibilityBack')}
      />

      <MetricsChallengeSelector
        challenges={challenges}
        selectedChallengeId={selectedChallengeId}
        isOpen={isChallengeMenuOpen}
        onToggle={onToggleChallengeMenu}
        onSelect={onSelectChallenge}
      />

      <View style={styles.headerActions}>
        <RestDayIconButton onPress={onRestDay} />

        <IconButton
          name="camera"
          onPress={onSkip}
          size={44}
          iconSize={20}
          variant="ghost"
          accessibilityRole="button"
          accessibilityLabel={t('metrics.accessibilitySkip')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.lg,
  },
});
