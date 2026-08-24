import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../constants/theme';
import { Text } from '../../ui/text';

export type ChallengesView = 'mine' | 'explore';

interface ChallengesViewToggleProps {
  view: ChallengesView;
  onViewChange: (view: ChallengesView) => void;
  mineLabel: string;
  exploreLabel: string;
}

// Segmented control, per design system → Components → Segmented control —
// same track/padding/radius as Profile's posts/photos toggle, but text
// segments that fill the available width instead of fixed-size icon slots,
// and `paper` (not `primary`) for the active segment background.
export function ChallengesViewToggle({ view, onViewChange, mineLabel, exploreLabel }: ChallengesViewToggleProps) {
  return (
    <View style={styles.track}>
      <Segment label={mineLabel} active={view === 'mine'} onPress={() => onViewChange('mine')} />
      <Segment label={exploreLabel} active={view === 'explore'} onPress={() => onViewChange('explore')} />
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segment, active && styles.segmentActive]}
      accessibilityRole="button"
    >
      <Text variant="label" weight={active ? 'bold' : 'medium'} inverse={active} tone={active ? 'primary' : 'tertiary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.big,
    backgroundColor: colors.surface,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.paper,
  },
});
