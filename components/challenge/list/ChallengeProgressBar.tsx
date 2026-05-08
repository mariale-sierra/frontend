import { StyleSheet, View } from 'react-native';
import { colors } from '../../../constants/theme';

interface ChallengeProgressBarProps {
  progressPercent: number;
}

export function ChallengeProgressBar({ progressPercent }: ChallengeProgressBarProps) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${progressPercent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.textPrimary,
  },
});

