import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Text } from './text';

/**
 * defines the configuration for a confirmation button.
 */
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
    if (!primaryButton.loading && !(secondaryButton?.loading)) {
      onDismiss?.();
    }
  };

  const isPrimaryDisabled =
    primaryButton.disabled || primaryButton.loading || secondaryButton?.loading;
  const isSecondaryDisabled =
    secondaryButton?.disabled ||
    secondaryButton?.loading ||
    primaryButton.loading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      {/* Backdrop */}
      <Pressable
        style={styles.backdrop}
        onPress={handleBackdropPress}
        disabled={primaryButton.loading || secondaryButton?.loading}
      >
        {/* Popup Container */}
        <Pressable style={styles.container}>
          {/* Content */}
          <View style={styles.content}>
            <Text variant="title" align="center">
              {title}
            </Text>

            {description && (
              <Text
                variant="body"
                tone="secondary"
                align="center"
                style={styles.description}
              >
                {description}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {secondaryButton && (
              <Pressable
                onPress={secondaryButton.onPress}
                disabled={isSecondaryDisabled}
                style={({ pressed }) =>
                  getSecondaryButtonStyle(
                    secondaryButton.variant || 'outline',
                    pressed,
                    isSecondaryDisabled
                  )
                }
              >
                {secondaryButton.loading ? (
                  <ActivityIndicator color={colors.textPrimary} size="small" />
                ) : (
                  <Text
                    variant="body"
                    tone="primary"
                    align="center"
                    style={styles.buttonText}
                  >
                    {secondaryButton.label}
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={primaryButton.onPress}
              disabled={isPrimaryDisabled}
              style={({ pressed }) =>
                getPrimaryButtonStyle(
                  primaryButton.variant || 'primary',
                  pressed,
                  isPrimaryDisabled
                )
              }
            >
              {primaryButton.loading ? (
                <ActivityIndicator
                  color={
                    primaryButton.variant === 'danger'
                      ? colors.error
                      : colors.textInverse
                  }
                  size="small"
                />
              ) : (
                <Text
                  variant="body"
                  tone={
                    primaryButton.variant === 'danger' ? 'secondary' : 'primary'
                  }
                  align="center"
                  style={styles.buttonText}
                >
                  {primaryButton.label}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    maxWidth: '85%',
    gap: spacing.lg,
  },
  content: {
    gap: spacing.md,
  },
  description: {
    marginTop: spacing.sm,
  },
  buttonsContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  buttonText: {
    paddingVertical: spacing.md,
  },
});

function getPrimaryButtonStyle(
  variant: 'primary' | 'danger' | 'outline',
  pressed: boolean,
  disabled: boolean
): any {
  const baseStyle = {
    borderRadius: radius.md,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  const variantStyle =
    variant === 'danger'
      ? {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.error,
        }
      : variant === 'outline'
      ? {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        }
      : {
          backgroundColor: colors.primary,
        };

  return [
    baseStyle,
    variantStyle,
    pressed && !disabled && { opacity: 0.7 },
    disabled && { opacity: 0.5 },
  ];
}

function getSecondaryButtonStyle(
  variant: 'primary' | 'danger' | 'outline',
  pressed: boolean,
  disabled: boolean
): any {
  const baseStyle = {
    borderRadius: radius.md,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  const variantStyle =
    variant === 'danger'
      ? {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.error,
        }
      : {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        };

  return [
    baseStyle,
    variantStyle,
    pressed && !disabled && { opacity: 0.7 },
    disabled && { opacity: 0.5 },
  ];
}
