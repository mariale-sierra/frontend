import { View, StyleSheet } from 'react-native';
import { Text } from '../../../components/ui/text';
import { spacing } from '../../../constants/theme';

export default function ChallengeInfo() {
  return (
    <View style={styles.container}>
      <Text variant="title">Challenge Info</Text>
      <Text variant="body">More details coming soon..</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
});