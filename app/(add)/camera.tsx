import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { safeBack } from '../../utils/navigation';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../../components/ui/iconButton';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { GlassInput } from '../../components/ui/glassInput';
import { CameraChip, VisibilityToggle, type CameraPostVisibility } from '../../components/add/camera/CameraChips';
import { activityColors, colors, spacing, radius } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { useMetricsEntryStore } from '../../store/metricsEntryStore';
import { useAuth } from '../../hooks/useAuth';
import { useChallengeParticipants } from '../../hooks/useChallengeParticipants';
import { MAX_CAPTION_LENGTH, usePhotoProgressSubmit } from '../../hooks/usePhotoProgressSubmit';
import { isChallengeOwner } from '../../services/challenge/challenge.service';
import { TagParticipantsSheet } from '../../components/challenge/TagParticipantsSheet';
import type { ChallengeContract } from '../../types/challenge';
import { extractHashtags } from '../../utils/hashtags';
import { loadChallenge } from '../../services/cache/challengeLoaders';

/**
 * Daily evidence photo: take it, pick who sees it, add a caption (and, for a
 * challenge's owner, tag participants), then confirm. The upload + save +
 * close flow lives in usePhotoProgressSubmit; this screen owns the camera and
 * the form around the captured photo.
 */
export default function Camera() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const selectedChallengeId = useMetricsEntryStore((s) => s.selectedChallengeId);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progress = usePhotoProgressSubmit();

  const [visibility, setVisibility] = useState<CameraPostVisibility>('followers');
  // Optional caption on the photo (Sprint 9, B5) — #hashtags typed here are
  // parsed and stored by the backend; the chips below the field preview them.
  const [caption, setCaption] = useState('');
  const captionHashtags = useMemo(() => extractHashtags(caption), [caption]);
  const visAnim = useRef(new Animated.Value(1)).current;

  // Bloque 1 — joint owner posts: only shown/usable when the current user
  // owns the selected challenge. `getChallengeUsers`-backed participants
  // list (same hook members.tsx uses) doubles as the tag picker's source —
  // tagging only makes sense among people already in the challenge.
  const { userId } = useAuth();
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeContract | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [tagSheetVisible, setTagSheetVisible] = useState(false);

  useEffect(() => {
    if (!selectedChallengeId) {
      setSelectedChallenge(null);
      return;
    }
    loadChallenge(selectedChallengeId).then(setSelectedChallenge).catch(() => setSelectedChallenge(null));
  }, [selectedChallengeId]);

  const isOwner = isChallengeOwner(selectedChallenge, userId);
  // Only the owner tags, so only the owner's camera asks for the participants — and the
  // owner is not among the people to tag.
  const { participants } = useChallengeParticipants(isOwner ? selectedChallengeId ?? null : null);
  const taggable = useMemo(() => participants.filter((participant) => participant.id !== userId), [participants, userId]);

  const cameraRef = useRef<CameraView>(null);
  const isBusy = isTakingPicture || progress.isSubmitting;

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
    setCaption('');
    setCapturedUri(null);
    setError(null);
  }

  async function handleConfirm() {
    if (isBusy || !capturedUri) return;

    if (!selectedChallengeId) {
      // Shown inline under the challenge picker — one message, not an Alert on top.
      setError(t('camera.selectChallengeError'));
      return;
    }

    setError(null);
    const failure = await progress.submit({
      challengeId: selectedChallengeId,
      imageUri: capturedUri,
      visibility,
      caption,
      taggedUserIds: isOwner ? taggedUserIds : undefined,
    });
    if (failure) setError(failure);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.fill, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
      >
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
          {isOwner && (
            <CameraChip
              icon="pricetag-outline"
              label={
                taggedUserIds.length > 0
                  ? t('challengeProgress.tagParticipantsSelectedCount', { count: taggedUserIds.length })
                  : t('challengeProgress.tagParticipantsChip')
              }
              onPress={() => setTagSheetVisible(true)}
              style={styles.tagToggle}
            />
          )}
        </View>

        <View style={styles.captionWrap}>
          <GlassInput
            placeholder={t('camera.captionPlaceholder')}
            placeholderVariant="caption"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={MAX_CAPTION_LENGTH}
            showCounter={false}
            editable={!isBusy}
            testID="camera-caption"
          />
          {captionHashtags.length > 0 ? (
            <View style={styles.hashtagRow}>
              {captionHashtags.map((tag) => (
                <Text key={tag} variant="caption" style={styles.hashtagText}>
                  #{tag}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.bottomBar}>
          <Pressable
            testID="camera-confirm"
            onPress={handleConfirm}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.confirmButton,
              isBusy && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {progress.isSubmitting ? (
              <ActivityIndicator color={colors.ink} size="large" />
            ) : (
              <Icon name="checkmark-outline" size={38} color={colors.ink} />
            )}
          </Pressable>
        </View>

        <TagParticipantsSheet
          visible={tagSheetVisible}
          participants={taggable}
          selectedIds={taggedUserIds}
          onChange={setTaggedUserIds}
          onClose={() => setTagSheetVisible(false)}
        />
      </KeyboardAvoidingView>
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
          testID="camera-capture"
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
  captionWrap: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  hashtagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.sm,
    rowGap: spacing.xs,
  },
  // Same look as hashtags everywhere else (HashtagText): electric blue,
  // regular weight, no pill. Custom color on `Text` needs `opacity: 1`.
  hashtagText: {
    color: activityColors.flexibility,
    opacity: 1,
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
  // The tag picker's chip sits at the top left, the visibility chip's mirror.
  tagToggle: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
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
