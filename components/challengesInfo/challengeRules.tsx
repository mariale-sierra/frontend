import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/text';
import { spacing } from '../../constants/theme';

type Props = {
  rules: string[];
};

export default function ChallengeRules({ rules }: Props) {
  return (
    <View style={styles.container}>
      {rules.map((rule, i) => (
        <Text key={i} style={styles.rule}>
          • {rule}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: 6,
  },
  rule: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
});