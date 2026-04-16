import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../ui/text';
import { radius, spacing } from '../../constants/theme';

interface RestDayOptionCardProps {
  onPress: () => void;
}

export function RestDayOptionCard({ onPress }: RestDayOptionCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <LinearGradient
        colors={['#14384ef6', '#a1a7b3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text variant="header" tone="primary">Rest Day</Text>
        <Text variant="caption" style={styles.text}>Recovery, mobility, or total reset.</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 70,
    borderRadius: radius.xl,
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: spacing.md,
  },
  text: {
    color: 'rgba(255,255,255,0.82)',
  },
  pressed: {
    opacity: 0.82,
  },
});