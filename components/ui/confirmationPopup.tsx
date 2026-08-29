import { Modal, Pressable, StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { Row } from '../layout/row';
import { Stack } from '../layout/stack';
import { Card } from './card';
import { Button } from './button';
import { Divider } from './divider';
import { Text } from './text';

export interface ConfirmationButtonConfig {
  label: string;
  onPress: () => void | Promise<void>;
  /** `neutral` (solid `ink`) is the default secondary/cancel treatment — no
   * `outline` (bordered/transparent) buttons in a popup, ever. */
  variant?: 'primary' | 'danger' | 'neutral';
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
  /** `success` = solid `success`-green card with `ink` text, for celebratory
   * confirmations (upload/log success). Default is the standard solid
   * `surface` card with `paper` text. */
  tone?: 'default' | 'success';
}

export function ConfirmationPopup({
  visible,
  title,
  description,
  primaryButton,
  secondaryButton,
  onDismiss,
  tone = 'default',
}: ConfirmationPopupProps) {
  const isSuccess = tone === 'success';
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
          <Card variant="basic" radius="big" padding="xl" style={[styles.card, isSuccess && styles.cardSuccess]}>
            <Stack gap="lg">
              <Stack gap="sm" align="center" style={styles.textContent}>
                <Text variant="title" align="center" inverse={isSuccess}>
                  {title}
                </Text>
                {description && (
                  <Text variant="body" tone="secondary" align="center" inverse={isSuccess}>
                    {description}
                  </Text>
                )}
              </Stack>

              <Divider style={isSuccess && styles.dividerSuccess} />

              <Row justify="center" gap="md">
                {secondaryButton && (
                  <Button
                    variant={secondaryButton.variant ?? 'neutral'}
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
    backgroundColor: withAlpha(colors.ink, 0.75),
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    ...shadows.lg,
  },
  cardSuccess: {
    backgroundColor: colors.success,
  },
  dividerSuccess: {
    backgroundColor: withAlpha(colors.ink, 0.12),
  },
  actionButton: {
    minWidth: 110,
  },
  textContent: {
    paddingTop: spacing.sm,
  },
});
