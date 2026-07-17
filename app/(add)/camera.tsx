import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../../components/ui/iconButton';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { spacing, radius } from '../../constants/theme';
import { uploadImageAsync } from '../../services/uploads/upload.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';

function VisibilityToggle({
  visibility,
  anim,
  onToggle,
}: {
  visibility: 'followers' | 'private';
  anim: Animated.Value;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const isFollowers = visibility === 'followers';
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.visibilityToggle, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Animated.View style={[styles.visibilityInner, { transform: [{ scale: anim }] }]}>
        <Icon
          name={isFollowers ? 'eye-outline' : 'eye-off-outline'}
          size={19}
          color="#fff"
        />
        <Text style={styles.visibilityLabel}>
          {isFollowers ? t('camera.visibilityFollowers') : t('camera.visibilityPrivate')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Camera() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const selectedChallengeId = useMetricsEntryStore((s) => s.selectedChallengeId);
  const currentRoutineId = useMetricsEntryStore((s) => s.currentRoutineId);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [visibility, setVisibility] = useState<'followers' | 'private'>('followers');
  const visAnim = useRef(new Animated.Value(1)).current;

  const cameraRef = useRef<CameraView>(null);
  const isBusy = isTakingPicture || uploadingImage || submittingProgress;

  function toggleVisibility() {
    setVisibility((v) => (v === 'followers' ? 'private' : 'followers'));
    Animated.sequence([
      Animated.timing(visAnim, { toValue: 0.82, duration: 80, useNativeDriver: true }),
      Animated.timing(visAnim, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
  }

  function flipCamera() {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  }

  async function handleCapture() {
    if (isBusy || !cameraRef.current) return;
    setIsTakingPicture(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch {
      setError(t('camera.takePhotoError'));
    } finally {
      setIsTakingPicture(false);
    }
  }

  function handleRetry() {
    setCapturedUri(null);
    setError(null);
  }

  async function handleConfirm() {
    console.log('[Camera] confirm pressed');
    console.log('[Camera] capturedUri:', capturedUri);
    console.log('[Camera] selectedChallengeId:', selectedChallengeId);
    console.log('[Camera] currentRoutineId:', currentRoutineId);

    if (isBusy || !capturedUri) {
      console.log('[Camera] confirm blocked — isBusy:', isBusy, '| capturedUri:', capturedUri);
      return;
    }

    if (!selectedChallengeId) {
      setError(t('camera.selectChallengeError'));
      Alert.alert(t('camera.noChallengeSelectedTitle'), t('camera.noChallengeSelectedMessage'));
      return;
    }

    setError(null);
    setUploadingImage(true);
    console.log('[Camera] upload start');
    let publicUrl: string;
    try {
      publicUrl = await uploadImageAsync(capturedUri, 'image/jpeg');
      console.log('[Camera] upload success publicUrl:', publicUrl);
    } catch (e: unknown) {
      type AxiosLike = { response?: { status?: number; data?: unknown }; message?: string };
      const err = e as AxiosLike;
      console.error('[Camera] confirm failed upload status:', err?.response?.status);
      console.error('[Camera] confirm failed upload data:', err?.response?.data ?? err?.message);
      setError(t('camera.uploadError'));
      setUploadingImage(false);
      return;
    }
    setUploadingImage(false);

    const progressPayload = {
      challengeId: selectedChallengeId,
      imageUrl: publicUrl,
      isRestDay: false as const,
      visibility,
      routineId: currentRoutineId ?? undefined,
    };
    console.log('[Camera] progress payload:', progressPayload);

    setSubmittingProgress(true);
    try {
      await submitWorkoutProgress(progressPayload);
      console.log('[Camera] progress success');
      router.replace('/(add)/preview');
    } catch (e: unknown) {
      type AxiosLike = { response?: { status?: number; data?: { message?: string } }; message?: string };
      const err = e as AxiosLike;
      console.error('[Camera] confirm failed status:', err?.response?.status);
      console.error('[Camera] confirm failed data:', err?.response?.data ?? err?.message);
      const msg = err?.response?.data?.message ?? t('camera.saveProgressError');
      setError(msg);
      Alert.alert(t('common.errors.genericTitle'), msg);
    } finally {
      setSubmittingProgress(false);
    }
  }

  if (!permission) {
    return <View style={styles.fill} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
        <Text variant="body" tone="secondary" style={styles.permissionText}>
          {t('camera.permissionMessage')}
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
        >
          <Text variant="body" style={styles.permissionButtonLabel}>{t('camera.grantPermission')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
        >
          <Text variant="caption" tone="secondary">{t('camera.goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <View style={styles.header}>
          <IconButton
            name="arrow-back"
            onPress={handleRetry}
            size={40}
            iconSize={22}
            iconColor="#fff"
          />
        </View>

        <View style={styles.cameraContainer}>
          <Image source={{ uri: capturedUri }} style={styles.cameraFill} resizeMode="cover" />
          <VisibilityToggle visibility={visibility} anim={visAnim} onToggle={toggleVisibility} />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.bottomBar}>
          <Pressable
            onPress={handleConfirm}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.confirmButton,
              isBusy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {uploadingImage || submittingProgress ? (
              <ActivityIndicator color="#000" size="large" />
            ) : (
              <Icon name="checkmark" size={38} color="#000" />
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
      <View style={styles.header}>
        <IconButton
          name="arrow-back"
          onPress={() => router.back()}
          size={40}
          iconSize={22}
          iconColor="#fff"
        />
        <IconButton
          name="camera-reverse-outline"
          onPress={flipCamera}
          size={40}
          iconSize={26}
          iconColor="#fff"
        />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.cameraFill} facing={facing} />
        <VisibilityToggle visibility={visibility} anim={visAnim} onToggle={toggleVisibility} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleCapture}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.captureButton,
            isBusy && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {isTakingPicture ? (
            <ActivityIndicator color="#000" size="large" />
          ) : (
            <View style={styles.captureInner} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  cameraFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  confirmButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityToggle: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  visibilityInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  visibilityLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  permissionText: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: spacing.xs,
  },
  permissionButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  backLink: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
