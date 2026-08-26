import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { Icon } from '../../components/ui/icon';
import { FormField } from '../../components/ui/formField';
import { Dropdown } from '../../components/ui/dropdown';
import { UserAvatar } from '../../components/ui/userAvatar';
import { Divider } from '../../components/ui/divider';
import { Row } from '../../components/layout/row';
import { Stack } from '../../components/layout/stack';
import { LogoutButton } from '../../components/profile/LogoutButton';
import {
  getMyProfile,
  updateMyProfile,
  updateMyProfilePhoto,
} from '../../services/user/user.service';
import { uploadImageAsync } from '../../services/uploads/upload.service';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';
import { colors, radius, spacing } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import type { MyProfileContract, UpdateProfilePayload } from '../../types/user';

const DISPLAY_NAME_MAX = 150;
const BIO_MAX = 1000;

/**
 * Edit-profile screen: loads the current profile, lets the user change
 * photo / display name / bio / language / privacy, validates locally and
 * PATCHes only the fields that changed.
 */
export default function EditProfile() {
  const { t } = useTranslation();
  const router = useRouter();

  const [profile, setProfile] = useState<MyProfileContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [language, setLanguage] = useState('en');
  const [isPrivate, setIsPrivate] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { show, showSuccess } = useErrorNotificationStore();

  const loadProfile = () => {
    setLoading(true);
    setLoadError(false);
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setDisplayName(data.display_name);
        setBio(data.bio ?? '');
        setLanguage(data.preferred_language || 'en');
        setIsPrivate(data.is_private);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadProfile, []);

  const validate = (): boolean => {
    if (!displayName.trim()) {
      setDisplayNameError(t('profileEdit.displayNameRequired'));
      return false;
    }
    setDisplayNameError(null);
    return true;
  };

  const handleSave = async () => {
    if (!profile || saving || !validate()) return;

    // PATCH semantics: only send what actually changed.
    const payload: UpdateProfilePayload = {};
    if (displayName.trim() !== profile.display_name) payload.display_name = displayName.trim();
    if (bio.trim() !== (profile.bio ?? '')) payload.bio = bio.trim();
    if (language !== profile.preferred_language) payload.preferred_language = language;
    if (isPrivate !== profile.is_private) payload.is_private = isPrivate;

    if (Object.keys(payload).length === 0) {
      router.back();
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
      router.back();
    } catch {
      show({ message: t('profileEdit.saveError') });
    } finally {
      setSaving(false);
    }
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
          <FormField
            label={t('profileEdit.displayName')}
            value={displayName}
            onChangeText={(value: string) => {
              setDisplayName(value);
              if (displayNameError && value.trim()) setDisplayNameError(null);
            }}
            maxLength={DISPLAY_NAME_MAX}
            error={displayNameError}
            placeholder={t('profileEdit.displayNamePlaceholder')}
            placeholderVariant="caption"
          />

          <FormField
            label={t('profileEdit.bio')}
            value={bio}
            onChangeText={setBio}
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
            <Dropdown
              options={[
                { value: 'en', label: t('profileEdit.languageEn') },
                { value: 'es', label: t('profileEdit.languageEs') },
              ]}
              selectedValues={[language]}
              onChange={(values) => {
                const next = values[values.length - 1];
                if (next) setLanguage(next);
              }}
              maxSelections={1}
              showValueInline
              rightIcon={<Icon name="chevron-down-outline" size={18} color={withAlpha(colors.paper, 0.55)} />}
            />
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
  photoSection: {
    alignItems: 'center',
  },
  avatarWrap: {
    width: 96,
    height: 96,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    // Matches UserAvatar's own corner radius (always the flat `big` token,
    // not size/2 — see userAvatar.tsx) so the loading dim doesn't bleed past
    // the avatar's actual squircle shape.
    borderRadius: radius.big,
    backgroundColor: withAlpha(colors.ink, 0.5),
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
