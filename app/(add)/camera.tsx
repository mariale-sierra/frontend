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
import { safeBack, safeBackTimes } from '../../utils/navigation';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../../components/ui/iconButton';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { colors, spacing, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { uploadImageAsync } from '../../services/uploads/upload.service';
import { submitWorkoutProgress } from '../../services/workout-log/workout-log.service';
import type { WorkoutLogContract } from '../../types/workout-log';
import { applyExerciseMetrics } from '../../services/metrics/applyExerciseMetrics';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';
import { invalidateChallengeProgressCache } from '../../hooks/useChallengeProgress';
import { useUploadSuccessStore } from '../../store/uploadSuccessStore';

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
          color={colors.paper}
        />
        <Text style={styles.visibilityLabel}>
          {isFollowers ? t('camera.visibilityFollowers') : t('camera.visibilityPrivate')}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Camera() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const selectedChallengeId = useMetricsEntryStore((s) => s.selectedChallengeId);
  const currentRoutineId = useMetricsEntryStore((s) => s.currentRoutineId);
  const exerciseMetrics = useMetricsEntryStore((s) => s.exerciseMetrics);

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
    if (isBusy || !capturedUri) return;

    if (!selectedChallengeId) {
      setError(t('camera.selectChallengeError'));
      Alert.alert(t('camera.noChallengeSelectedTitle'), t('camera.noChallengeSelectedMessage'));
      return;
    }

    setError(null);
    setUploadingImage(true);
    let publicUrl: string;
    try {
      publicUrl = await uploadImageAsync(capturedUri, 'image/jpeg');
    } catch (e: unknown) {
      type AxiosLike = { response?: { status?: number; data?: unknown }; message?: string };
      const err = e as AxiosLike;
      console.error('[Camera] upload failed:', err?.response?.status, err?.response?.data ?? err?.message);
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

    setSubmittingProgress(true);
    let workout: WorkoutLogContract;
    try {
      workout = await submitWorkoutProgress(progressPayload);
    } catch (e: unknown) {
      type AxiosLike = { response?: { status?: number; data?: { message?: string } }; message?: string };
      const err = e as AxiosLike;
      console.error('[Camera] confirm failed:', err?.response?.status, err?.response?.data ?? err?.message);
      const msg = err?.response?.data?.message ?? t('camera.saveProgressError');
      setError(msg);
      Alert.alert(t('common.errors.genericTitle'), msg);
      setSubmittingProgress(false);
      return;
    }

    // The workout + photo are already saved server-side at this point —
    // nothing below is allowed to surface as a "failed to save progress"
    // error, since that would misreport a successful save as a failure
    // (confirmed bug: a post-save hiccup here, e.g. router.dismissAll()
    // finding nothing left to dismiss, was being caught by the same
    // try/catch as the actual submission and shown as an upload error even
    // though the photo had already been persisted).

    // The routine copy inside POST /workout-logs/progress only creates
    // target (goal) rows for each exercise — the values actually entered
    // on the metrics screen still need to be saved against them here.
    if (exerciseMetrics.length > 0) {
      try {
        await applyExerciseMetrics(workout, exerciseMetrics);
      } catch (metricsError) {
        // The workout + photo already saved successfully — a metrics
        // save failure shouldn't block the flow or look like data loss,
        // just log it for now.
        console.error('[Camera] applyExerciseMetrics failed:', metricsError);
      }
    }
    invalidateChallengeProgressCache();
    // The success popup itself is global (mounted at app root), so it shows
    // on top of wherever the back() calls below land.
    useUploadSuccessStore.getState().show();
    setSubmittingProgress(false);
    try {
      // Closes the whole (add) modal group, back to whatever screen the user
      // actually started this flow from — NOT router.dismissAll(). Fixed
      // 2026-08-29, real bug confirmed by user report ("it sends me back to
      // log metrics... I leave and then I get the success message"):
      // dismissAll() dispatches POP_TO_TOP, which React Navigation resolves
      // against the NEAREST Stack navigator — here, (add)'s own nested Stack
      // (app/(add)/_layout.tsx: metrics -> camera), not the root Stack (add)
      // itself is presented on (see app/_layout.tsx's `fullScreenModal`
      // Stack.Screen). So it only ever popped back to metrics.tsx, leaving
      // the (add) modal still open — the user then had to manually back out,
      // and only saw the success popup once they did (it was queued the
      // whole time, just hidden behind the still-open modal).
      // log.tsx reaches metrics.tsx via router.replace(), never push(), so
      // the (add) group is always exactly 2 screens deep here (metrics,
      // camera) in every real flow — two plain back() calls pop camera then
      // metrics off (add)'s own stack, and since GO_BACK bubbles to the
      // parent navigator once the current one has nothing left to pop, the
      // second call correctly continues upward and pops the (add) entry
      // itself off the root stack too, actually closing the whole modal.
      safeBackTimes(2);
    } catch (navError) {
      console.error('[Camera] closing the (add) modal failed after a successful save:', navError);
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
          onPress={() => safeBack()}
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
            name="arrow-back-outline"
            onPress={handleRetry}
            size={40}
            iconSize={22}
            iconColor={colors.paper}
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
              <ActivityIndicator color={colors.ink} size="large" />
            ) : (
              <Icon name="checkmark-outline" size={38} color={colors.ink} />
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
          name="arrow-back-outline"
          onPress={() => safeBack()}
          size={40}
          iconSize={22}
          iconColor={colors.paper}
        />
        <IconButton
          name="camera-reverse-outline"
          onPress={flipCamera}
          size={40}
          iconSize={26}
          iconColor={colors.paper}
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
            <ActivityIndicator color={colors.ink} size="large" />
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
    backgroundColor: colors.ink,
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
    // Legacy radius['2xl'] (24) — that key no longer exists on the current
    // scale (none/small/medium/big); `big` (28) is the nearest token.
    borderRadius: radius.big,
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
  // Fixed-diameter true circles (72/52px) — size/2 radius is the documented
  // exception to "always radius.big for circular elements" (see design
  // system skill's Numbered circle badge note).
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: withAlpha(colors.paper, 0.4),
  },
  captureInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: withAlpha(colors.ink, 0.15),
  },
  confirmButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.paper,
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
    // Legacy radius.xl (18) — nearest current token is `medium` (16).
    borderRadius: radius.medium,
    backgroundColor: withAlpha(colors.ink, 0.45),
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.18),
  },
  // No `opacity: 1` alongside this custom color, unlike the usual rule for
  // Text custom-color overrides — kept exactly as shipped (already rendering
  // at the tone's default 85%) per an explicit "don't change this visually" request.
  visibilityLabel: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  errorText: {
    color: colors.error,
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
    // Legacy radius.xl (18) — nearest current token is `medium` (16).
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.3),
    backgroundColor: withAlpha(colors.paper, 0.1),
    marginTop: spacing.xs,
  },
  permissionButtonLabel: {
    color: colors.paper,
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
