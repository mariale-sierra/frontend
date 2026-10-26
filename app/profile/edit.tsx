import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { safeBack } from '../../utils/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScroll } from '../../components/layout/keyboardAwareScroll';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Card } from '../../components/ui/card';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import { LogoutButton } from '../../components/profile/LogoutButton';
import { LanguageToggle } from '../../components/profile/LanguageToggle';
import { SettingsRow } from '../../components/profile/SettingsRow';
import { ControlledFormField } from '../../components/form/ControlledFormField';
import {
  updateMyProfile,
  updateMyProfilePhoto,
} from '../../services/user/user.service';
import { loadMyProfile } from '../../services/cache/loaders';
import { queryKeys } from '../../services/cache/queries';
import { setQueryData } from '../../services/cache/queryCache';
import {
  normalizeUploadMimeType,
  uploadImageAsync,
} from '../../services/uploads/upload.service';
import { isContentRejectedError } from '../../utils/contentModeration';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { MyProfileContract, UpdateProfilePayload } from '../../types/user';
import i18n, { PREFERRED_LANGUAGE_KEY } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';
import { storage } from '../../utils/storage';
import { createProfileEditSchema, type ProfileEditFormValues } from '../../validation/profileSchemas';
import { logError } from '../../utils/apiError';

const DISPLAY_NAME_MAX = 150;
const BIO_MAX = 1000;

/**
 * Edit-profile screen: loads the current profile, lets the user change
 * photo / display name / bio / language / privacy, validates locally and
 * PATCHes only the fields that changed. Log out and delete account moved to
 * Settings (Sprint 10, B2); log out stays on the load-error state below as the
 * way out when the profile cannot be read.
 */
export default function EditProfile() {
  const { t } = useTranslation();
  const router = useRouter();

  const [profile, setProfile] = useState<MyProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Real bug, fixed 2026-08-30, per explicit "toggle shows Spanish even
  // though the app is actually in English" report: this used to default to
  // a hardcoded 'en', then get silently overwritten by the profile fetch
  // below (`data.preferred_language`) — a backend field that's never kept
  // in sync with the real active language (only PATCHed on save, never
  // read back into i18next). That's the exact "disconnected mechanism" bug
  // i18n/index.ts's own doc comment already describes as supposedly fixed
  // 2026-08-29 — this one leftover read undid it. `i18n.language` (backed
  // by PREFERRED_LANGUAGE_KEY, restored on boot in app/_layout.tsx) is the
  // only real source of truth for what's actually active; read it directly
  // instead of the backend field.
  const [language, setLanguage] = useState<SupportedLanguage>(i18n.language === 'es' ? 'es' : 'en');
  const [isPrivate, setIsPrivate] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { show, showSuccess } = useErrorNotificationStore();

  const schema = useMemo(() => createProfileEditSchema(t), [t]);
  const { control, handleSubmit, reset } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', bio: '' },
  });

  const loadProfile = () => {
    setLoading(true);
    setLoadError(false);
    loadMyProfile()
      .then((data) => {
        setProfile(data);
        reset({ displayName: data.display_name, bio: data.bio ?? '' });
        // NOT `setLanguage(data.preferred_language)` — see the state's own
        // doc comment above for why that field must never drive this
        // toggle's displayed value.
        setIsPrivate(data.is_private);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadProfile, []);

  const handleSave = handleSubmit(async ({ displayName, bio }) => {
    if (!profile || saving) return;

    // PATCH semantics: only send what actually changed.
    const payload: UpdateProfilePayload = {};
    if (displayName.trim() !== profile.display_name) payload.display_name = displayName.trim();
    if (bio.trim() !== (profile.bio ?? '')) payload.bio = bio.trim();
    if (language !== profile.preferred_language) payload.preferred_language = language;
    if (isPrivate !== profile.is_private) payload.is_private = isPrivate;

    if (Object.keys(payload).length === 0) {
      safeBack('/(tabs)/profile');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      // The server's answer is the new cached profile: the tab shows it without refetching.
      setQueryData(queryKeys.myProfile, updated);
      if (payload.is_private !== undefined) {
        showSuccess({ message: t('profileEdit.privacyUpdated') });
      } else {
        showSuccess({ message: t('profileEdit.saved') });
      }
      safeBack('/(tabs)/profile');
    } catch (error) {
      // A bio rejected by moderation (B3) already got its own toast from the
      // global interceptor — don't overwrite it with the generic save error.
      if (!isContentRejectedError(error)) {
        show({ message: t('profileEdit.saveError') });
      }
    } finally {
      setSaving(false);
    }
  });

  const handleLanguageChange = (code: SupportedLanguage) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    storage.setItem(PREFERRED_LANGUAGE_KEY, code).catch((error) => {
      logError('EditProfile.language', error);
    });
  };

  const handleChangePhoto = async () => {
    if (uploadingPhoto) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingPhoto(true);
    try {
      // Reuses the shared R2 flow: sign → PUT → persist the public URL.
      // B5/CP6: the gallery can return PNG/WebP, not just JPEG — declare
      // whatever it actually reports instead of always claiming JPEG.
      const fileType = normalizeUploadMimeType(result.assets[0].mimeType);
      const publicUrl = await uploadImageAsync(result.assets[0].uri, fileType);
      const updated = await updateMyProfilePhoto(publicUrl);
      setProfile(updated);
      setQueryData(queryKeys.myProfile, updated);
      showSuccess({ message: t('profileEdit.photoUpdated') });
    } catch {
      show({ message: t('profileEdit.photoError') });
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  if (loadError || !profile) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.center}>
          <Text tone="secondary">{t('profileEdit.loadError')}</Text>
          <Button variant="outline" size="sm" onPress={loadProfile}>
            {t('common.actions.continue')}
          </Button>
          <View style={styles.errorLogoutWrap}>
            <LogoutButton />
          </View>
        </View>
      </ScreenBackground>
    );
  }

  return (
    // Laid out like Settings (2026-10-23, explicit request): its compact top bar,
    // small uppercase section labels, and the same subtle icon cards for rows.
    <ScreenBackground variant="top">
      <Row justify="space-between" align="center" style={styles.topBar}>
        <BackButton style={styles.backButton} />
        <Text variant="body" weight="bold" align="center" style={styles.headerTitle}>
          {t('profileEdit.screenTitle')}
        </Text>
        <View style={styles.trailingSpacer} />
      </Row>

      <KeyboardAwareScroll
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.photoSection}>
          <Pressable
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
            style={styles.avatarWrap}
            accessibilityRole="button"
            accessibilityLabel={t('profileEdit.changePhoto')}
          >
            <UserAvatar
              username={profile.username}
              imageUrl={profile.profile_image_url}
              size={96}
            />
            {uploadingPhoto && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator color={colors.primary} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Icon name="camera-outline" size={16} color={colors.ink} />
            </View>
          </Pressable>
        </View>

        <Section title={t('profileEdit.sectionProfile')}>
          <Stack gap="lg">
            <ControlledFormField
              control={control}
              name="displayName"
              label={t('profileEdit.displayName')}
              maxLength={DISPLAY_NAME_MAX}
              placeholder={t('profileEdit.displayNamePlaceholder')}
              placeholderVariant="caption"
            />

            <ControlledFormField
              control={control}
              name="bio"
              label={t('profileEdit.bio')}
              multiline
              maxLength={BIO_MAX}
              placeholder={t('profileEdit.bioPlaceholder')}
              placeholderVariant="caption"
            />
          </Stack>
        </Section>

        <Section title={t('settings.sections.preferences')}>
          <Card variant="basic" radius="medium">
            <View style={styles.cardStack}>
              <Row gap="sm" align="center" justify="flex-start">
                <Icon name="language-outline" size={20} color={colors.paper} />
                <Text variant="body">{t('profileEdit.language')}</Text>
              </Row>
              <LanguageToggle value={language} onChange={handleLanguageChange} />
            </View>
          </Card>

          <SettingsRow
            icon="barbell-outline"
            label={t('profileEdit.practices')}
            hint={t('profileEdit.practicesHint')}
            onPress={() => router.push('/onboarding/practices?mode=edit')}
            testID="edit-profile-practices"
          />

          <Card variant="basic" radius="medium">
            <Row justify="space-between" align="center" gap="sm">
              <Row gap="sm" align="center" justify="flex-start" style={styles.rowMain}>
                <Icon name="lock-closed-outline" size={20} color={colors.paper} />
                <View style={styles.privacyText}>
                  <Text variant="body">{t('profileEdit.privacy')}</Text>
                  <Text variant="caption" tone="secondary">
                    {t('profileEdit.privacyHint')}
                  </Text>
                </View>
              </Row>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.surface, true: colors.success }}
                thumbColor={colors.primary}
              />
            </Row>
          </Card>
        </Section>

        <Button
          variant="primary"
          size="md"
          onPress={handleSave}
          loading={saving}
          disabled={saving || uploadingPhoto}
        >
          {t('profileEdit.save')}
        </Button>
      </KeyboardAwareScroll>
    </ScreenBackground>
  );
}

// Settings' section: a small uppercase label over its rows.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="caption" tone="secondary" weight="bold" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // Same top bar as Settings.
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  trailingSpacer: {
    width: 44,
    height: 44,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    textTransform: 'uppercase',
  },
  cardStack: {
    gap: spacing.md,
  },
  rowMain: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
  },
  avatarWrap: {
    width: 96,
    height: 96,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    // Matches UserAvatar's own corner radius (always the flat `big` token,
    // not size/2 — see userAvatar.tsx) so the loading dim doesn't bleed past
    // the avatar's actual squircle shape.
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.ink, fillOpacity.dim),
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Camera badge overlapping the avatar's bottom-right corner — the
  // industry-standard "tap the avatar to change it" affordance, replacing a
  // separate "Change photo" text button below. Same "cut into" treatment
  // (ink border) as every other avatar-overlapping badge in the app
  // (ProfileHeader's streak badge, Home's streak-chip badge).
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorLogoutWrap: {
    width: '100%',
    maxWidth: 320,
  },
});
