import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from '../../layout/stack';
import { Text } from '../../ui/text';
import { colors, radius, spacing } from '../../../constants/theme';

export interface OptionInfoModalState {
  label: string;
  description: string;
  icon: ReactNode;
}

export interface OptionInfoModalProps {
  info: OptionInfoModalState | null;
  onClose: () => void;
}

export function OptionInfoModal({ info, onClose }: OptionInfoModalProps) {
  return (
    <Modal
      visible={Boolean(info)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.infoBackdrop} onPress={onClose}>
        <Pressable style={styles.infoDialog} onPress={() => {}}>
          <Pressable hitSlop={10} style={styles.infoCloseButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </Pressable>

          <Stack gap="md" style={styles.infoContent}>
            <View style={styles.infoIconShell}>{info?.icon ?? null}</View>
            <Text variant="subheader" style={styles.infoTitle}>{info?.label}</Text>
            <Text variant="body" tone="secondary" style={styles.infoDescription}>
              {info?.description}
            </Text>
          </Stack>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  infoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  infoDialog: {
    width: '100%',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    position: 'relative',
  },
  infoCloseButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  infoContent: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  infoIconShell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  infoTitle: {
    textAlign: 'center',
  },
  infoDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
