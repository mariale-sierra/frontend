import { Pressable, StyleSheet } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';

type AuthSwitchRowProps = {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
};

export function AuthSwitchRow({ prompt, actionLabel, onPress }: AuthSwitchRowProps) {
  return (
    <Row justify="center" gap="xs" align="center">
      <Text variant="body" tone="secondary">
        {prompt}
      </Text>
      <Pressable onPress={onPress}>
        <Text variant="body" style={styles.linkText}>
          {actionLabel}
        </Text>
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  linkText: {
    fontWeight: '600',
  },
});
