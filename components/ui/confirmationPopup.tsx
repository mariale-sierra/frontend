import { Modal, Pressable, StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Card } from './card';
import { Button } from './button';
import { Divider } from './divider';
import { Text } from './text';

export interface ConfirmationButtonConfig {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: 'primary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

interface ConfirmationPopupProps {
  visible: boolean;
  title: string;
  description?: string;
  primaryButton: ConfirmationButtonConfig;
  secondaryButton?: ConfirmationButtonConfig;
  onDismiss?: () => void;
}

export function ConfirmationPopup({
  visible,
  title,
  description,
  primaryButton,
  secondaryButton,
  onDismiss,
}: ConfirmationPopupProps) {
  const handleBackdropPress = () => {
    if (!primaryButton.loading && !secondaryButton?.loading) {
      onDismiss?.();
    }
  };

  const isPrimaryDisabled = !!(
    primaryButton.disabled || primaryButton.loading || secondaryButton?.loading
  );
  const isSecondaryDisabled = !!(
    secondaryButton?.disabled || secondaryButton?.loading || primaryButton.loading
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <Pressable
        style={styles.backdrop}
        onPress={handleBackdropPress}
        disabled={!!(primaryButton.loading || secondaryButton?.loading)}
      >
        <Pressable>
          <Card variant="basicGlass" radius="2xl" padding="xl" style={styles.card}>
            <Stack gap="lg">
              <Stack gap="sm" align="center" style={styles.textContent}>
                <Text variant="title" align="center">
                  {title}
                </Text>
                {description && (
                  <Text variant="body" tone="secondary" align="center">
                    {description}
                  </Text>
                )}
              </Stack>

              <Divider variant="section" />

              <Row justify="center" gap="md">
                {secondaryButton && (
                  <Button
                    variant={secondaryButton.variant ?? 'outline'}
                    size="md"
                    loading={secondaryButton.loading}
                    disabled={isSecondaryDisabled}
                    onPress={() => secondaryButton.onPress()}
                    style={styles.actionButton}
                  >
                    {secondaryButton.label}
                  </Button>
                )}
                <Button
                  variant={primaryButton.variant ?? 'primary'}
                  size="md"
                  loading={primaryButton.loading}
                  disabled={isPrimaryDisabled}
                  onPress={() => primaryButton.onPress()}
                  style={styles.actionButton}
                >
                  {primaryButton.label}
                </Button>
              </Row>
            </Stack>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
  },
  actionButton: {
    minWidth: 110,
  },
  textContent: {
    paddingTop: spacing.sm,
  },
});
