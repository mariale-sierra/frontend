import { Pressable, StyleSheet } from 'react-native';
import { Row } from '../layout/row';
import { Text } from '../ui/text';
import { colors } from '../../constants/theme';

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
        <Text variant="body" weight="bold" style={styles.linkText}>
          {actionLabel}
        </Text>
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  linkText: {
    color: colors.primary,
    opacity: 1,
  },
});
