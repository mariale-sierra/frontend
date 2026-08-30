import { StyleSheet, View } from 'react-native';
import { BackButton } from '../../ui/backButton';
import { Text } from '../../ui/text';
import { colors, fillOpacity, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';

interface CreateFlowProgressHeaderProps {
  currentIndex: number;
  total: number;
  stepLabel: string;
  onBack: () => void;
}

const BACK_BUTTON_FOOTPRINT = 44;

/**
 * Back button + "Step N of total" + segmented progress bar, shared by every
 * step of the create-challenge flow. No horizontal padding of its own — the
 * screen's single spacing.lg edge margin (see design system → Spacing →
 * Screen edge margin) applies to it like every other element on the screen.
 */
export function CreateFlowProgressHeader({ currentIndex, total, stepLabel, onBack }: CreateFlowProgressHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <BackButton onPress={onBack} style={styles.backButton} />
        <Text variant="label" tone="secondary" align="center" style={styles.stepLabel}>
          {stepLabel}
        </Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.track}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={`progress-segment-${index}`}
            style={[styles.segment, index <= currentIndex && styles.segmentFilled]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  stepLabel: {
    flex: 1,
  },
  spacer: {
    width: BACK_BUTTON_FOOTPRINT,
  },
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.paper, fillOpacity.chip),
  },
  segmentFilled: {
    backgroundColor: colors.primary,
  },
});
