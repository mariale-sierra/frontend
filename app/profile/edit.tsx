import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { safeBack } from '../../utils/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Divider } from '../../components/ui/divider';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import { LogoutButton } from '../../components/profile/LogoutButton';
import { ControlledFormField } from '../../components/form/ControlledFormField';
import {
  getMyProfile,
  updateMyProfile,
  updateMyProfilePhoto,
} from '../../services/user/user.service';
import { uploadImageAsync } from '../../services/uploads/upload.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { colors, fillOpacity, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { MyProfileContract, UpdateProfilePayload } from '../../types/user';
import i18n, { PREFERRED_LANGUAGE_KEY } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';
import { storage } from '../../utils/storage';
import { createProfileEditSchema, type ProfileEditFormValues } from '../../validation/profileSchemas';

const DISPLAY_NAME_MAX = 150;
const BIO_MAX = 1000;

/**
 * Edit-profile screen: loads the current profile, lets the user change
 * photo / display name / bio / language / privacy, validates locally and
 * PATCHes only the fields that changed.
 */
export default function EditProfile() {
  const { t } = useTranslation();

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
    getMyProfile()
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
      if (payload.is_private !== undefined) {
        showSuccess({ message: t('profileEdit.privacyUpdated') });
      } else {
        showSuccess({ message: t('profileEdit.saved') });
      }
      safeBack('/(tabs)/profile');
    } catch {
      show({ message: t('profileEdit.saveError') });
    } finally {
      setSaving(false);
    }
  });

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
      const publicUrl = await uploadImageAsync(result.assets[0].uri, 'image/jpeg');
      const updated = await updateMyProfilePhoto(publicUrl);
      setProfile(updated);
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
    <ScreenBackground variant="default">
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BackButton />
          <Text variant="title">{t('profileEdit.screenTitle')}</Text>
          <View style={styles.headerSpacer} />
        </View>

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

        <Divider variant="section" marginVertical="sm" />

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

        <Divider variant="section" marginVertical="sm" />

        <Stack gap="lg">
          <View style={{ gap: spacing.xs }}>
            <Text variant="subheader">{t('profileEdit.language')}</Text>
            {/* Fixed 2026-08-29: was a `Dropdown` (components/ui/dropdown.tsx)
                — that component turns out to be used NOWHERE ELSE in the
                whole app (checked), so there was no "other working dropdown"
                to compare against when it kept not working across three
                separate fix attempts (a real `maxSelections` bug was found
                and fixed in it along the way, but the toggle stayed broken
                even after that). Replaced entirely with a plain two-option
                segmented toggle, the exact same proven structure
                `RoutineModeToggle` (components/routine/builder/routineModeToggle.tsx)
                already uses successfully elsewhere — single string value,
                one Pressable per option, no array-based multi-select
                machinery at all. */}
            <View style={styles.languageToggle}>
              {(['en', 'es'] as const).map((code) => {
                const active = language === code;
                return (
                  <Pressable
                    key={code}
                    onPress={() => {
                      if (active) return;
                      setLanguage(code);
                      i18n.changeLanguage(code as SupportedLanguage);
                      storage.setItem(PREFERRED_LANGUAGE_KEY, code).catch((error) => {
                        console.error('[EditProfile] failed to persist language choice', error);
                      });
                    }}
                    style={({ pressed }) => [
                      styles.languageOption,
                      active && styles.languageOptionActive,
                      pressed && styles.languageOptionPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      variant="label"
                      weight={active ? 'bold' : 'medium'}
                      inverse={active}
                      tone={active ? 'primary' : 'secondary'}
                    >
                      {code === 'en' ? t('profileEdit.languageEn') : t('profileEdit.languageEs')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Row align="center" justify="space-between">
            <View style={styles.privacyText}>
              <Text variant="subheader">{t('profileEdit.privacy')}</Text>
              <Text variant="caption" tone="secondary">
                {t('profileEdit.privacyHint')}
              </Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.surface, true: colors.success }}
              thumbColor={colors.primary}
            />
          </Row>

          <Button
            variant="primary"
            size="md"
            onPress={handleSave}
            loading={saving}
            disabled={saving || uploadingPhoto}
          >
            {t('profileEdit.save')}
          </Button>
        </Stack>

        <Divider variant="section" marginVertical="sm" />

        <LogoutButton />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 40,
  },
  // Same chrome as RoutineModeToggle's proven segmented-toggle pattern:
  // `surface` track, `big` radius, `xs` internal padding/gap.
  languageToggle: {
    flexDirection: 'row',
    borderRadius: radius.big,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  languageOption: {
    flex: 1,
    height: 48,
    borderRadius: radius.big,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageOptionActive: {
    backgroundColor: colors.primary,
  },
  languageOptionPressed: {
    opacity: 0.85,
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
