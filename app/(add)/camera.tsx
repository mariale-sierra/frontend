import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ScreenBackground from '../../components/layout/screenBackground';
import { Text } from '../../components/ui/text';
import { colors, radius, spacing } from '../../constants/theme';
import { uploadImageAsync } from '../../services/uploads/upload.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';

export default function Camera() {
  const router = useRouter();
  const selectedChallengeId = useMetricsEntryStore((s) => s.selectedChallengeId);
  const currentRoutineId = useMetricsEntryStore((s) => s.currentRoutineId);

  const [pickingImage, setPickingImage] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [caption, setCaption] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [uploadedPublicUrl, setUploadedPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isBusy = pickingImage || uploadingImage || submittingProgress;

  function applyPickedAsset(asset: ImagePicker.ImagePickerAsset) {
    setSelectedImageUri(asset.uri);
    setSelectedMimeType(asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg');
    setUploadedPublicUrl(null);
    setError(null);
  }

  async function handleTakePhoto() {
    if (isBusy) return;
    setPickingImage(true);
    setError(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera permission needed', 'Allow camera access in Settings to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        applyPickedAsset(result.assets[0]);
      }
    } finally {
      setPickingImage(false);
    }
  }

  async function handleChooseFromGallery() {
    if (isBusy) return;
    setPickingImage(true);
    setError(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Gallery permission needed', 'Allow photo library access in Settings to pick a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets[0]) {
        applyPickedAsset(result.assets[0]);
      }
    } finally {
      setPickingImage(false);
    }
  }

  async function handleSubmit() {
    if (isBusy || !selectedImageUri) return;

    if (!selectedChallengeId) {
      setError('No challenge selected. Go back and select a challenge first.');
      return;
    }

    setError(null);
    let publicUrl = uploadedPublicUrl;

    if (!publicUrl) {
      setUploadingImage(true);
      try {
        publicUrl = await uploadImageAsync(selectedImageUri, selectedMimeType);
        setUploadedPublicUrl(publicUrl);
      } catch (uploadErr: unknown) {
        console.error('[Camera] Upload failed:', uploadErr);
        setError('Could not upload image.');
        return;
      } finally {
        setUploadingImage(false);
      }
    }

    setSubmittingProgress(true);
    try {
      const progressPayload = {
        challengeId: selectedChallengeId,
        imageUrl: publicUrl as string,
        caption: caption.trim() || undefined,
        isRestDay: false as const,
        routineId: currentRoutineId ?? undefined,
      };
      console.log('[Camera] Submitting progress:', progressPayload);
      await submitWorkoutProgress(progressPayload);
      router.replace('/(add)/preview');
    } catch (submitErr: unknown) {
      type AxiosLike = { response?: { data?: { message?: string } }; message?: string };
      const e = submitErr as AxiosLike;
      console.error('[Camera] Progress submit failed:', e?.response?.data ?? e?.message);
      setError(e?.response?.data?.message ?? 'Could not save progress.');
    } finally {
      setSubmittingProgress(false);
    }
  }

  const submitLabel = uploadingImage
    ? 'Uploading...'
    : submittingProgress
      ? 'Saving...'
      : 'Save Progress';

  return (
    <ScreenBackground variant="default">
      <View style={styles.container}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          hitSlop={12}
        >
          <Text variant="caption" style={styles.backLabel}>← Back</Text>
        </Pressable>

        <Text variant="title">Add proof</Text>
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          Take a photo or choose one from your gallery as proof of today's workout.
        </Text>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.pickerRow}>
          <Pressable
            onPress={handleTakePhoto}
            disabled={isBusy}
            style={({ pressed }) => [styles.pickerButton, pressed && styles.pressed, isBusy && styles.disabled]}
          >
            {pickingImage ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text variant="body" style={styles.pickerButtonLabel}>Take Photo</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleChooseFromGallery}
            disabled={isBusy}
            style={({ pressed }) => [styles.pickerButton, pressed && styles.pressed, isBusy && styles.disabled]}
          >
            <Text variant="body" style={styles.pickerButtonLabel}>From Gallery</Text>
          </Pressable>
        </View>

        {selectedImageUri ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {selectedImageUri ? (
          <>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption (optional)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.captionInput}
              multiline
              maxLength={200}
              editable={!isBusy}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={isBusy}
              style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, isBusy && styles.disabled]}
            >
              {isBusy ? (
                <View style={styles.submitRow}>
                  <ActivityIndicator color={colors.textInverse} />
                  <Text style={styles.submitLabel}>{submitLabel}</Text>
                </View>
              ) : (
                <Text style={styles.submitLabel}>{submitLabel}</Text>
              )}
            </Pressable>
          </>
        ) : null}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backLabel: {
    color: colors.textSecondary,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    lineHeight: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  pickerButtonLabel: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  previewWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
  },
  captionInput: {
    minHeight: 80,
    borderRadius: radius.lg,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  submitButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitLabel: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.82,
  },
});
