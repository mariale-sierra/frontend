import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { spacing } from '../../constants/theme';

type RoutineItem = {
  day: number;
  title?: string;
  subtitle?: string;
  rest?: boolean;
};

type Props = {
  routine: RoutineItem[];
};

export default function ChallengeRoutineList({ routine }: Props) {
  return (
    <View style={styles.container}>
      {routine.map((item, i) => (
        <View key={i} style={styles.block}>
          <Text style={styles.day}>DAY {item.day}</Text>

          <Card style={[styles.card, item.rest && styles.restCard]}>
            {item.rest ? (
              <Text style={styles.restText}>REST</Text>
            ) : (
              <>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </>
            )}
          </Card>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  block: {
    gap: spacing.sm,
  },
  day: {
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.6,
  },
  card: {
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: '#1c1c1e', 
  },
  restCard: {
    backgroundColor: '#1f3b4d', 
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  restText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
});