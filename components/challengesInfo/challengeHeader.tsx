import { StyleSheet, View } from 'react-native';
import ActivityBackground from '../layout/activityBackground';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { spacing } from '../../constants/theme';

type Props = {
  challenge: { label: string };
  detail: { author: string; days: number };
};

export default function ChallengeHeader({ challenge, detail }: Props) {
  return (
    <ActivityBackground>
      <View style={styles.container}>
        <Text style={styles.author}>By {detail.author}</Text>

        <Text style={styles.title}>
          {challenge.label}
        </Text>

        <Text style={styles.days}>
          {detail.days}
          <Text style={styles.daysSmall}> days</Text>
        </Text>

        <View style={styles.buttonWrapper}>
          <Button>
            Get started
          </Button>
        </View>
      </View>
    </ActivityBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  author: {
    opacity: 0.8,
    fontSize: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  days: {
    fontSize: 60,
    fontWeight: '200',
  },
  daysSmall: {
    fontSize: 20,
    fontWeight: '300',
  },
  buttonWrapper: {
    marginTop: spacing.md,
    width: '80%',
  },
});