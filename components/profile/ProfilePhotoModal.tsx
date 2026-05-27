import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../ui/backButton';
import { PhotoDetailCard } from '../ui/photoDetailCard';
import { colors, spacing } from '../../constants/theme';
import type { ChallengePhoto } from '../../types/challenge';

interface ProfilePhotoModalProps {
  photo: ChallengePhoto | null;
  onClose: () => void;
}

export function ProfilePhotoModal({ photo, onClose }: ProfilePhotoModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={photo !== null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <BackButton onPress={onClose} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
        >
          {photo && <PhotoDetailCard photo={photo} />}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
});
