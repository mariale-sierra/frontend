import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { BackButton } from '../../components/ui/backButton';
import { Stack } from '../../components/layout/stack';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { OptionPillGrid } from '../../components/challenge/create';
import { ActivityIcon } from '../../components/icons/activityIcon';
import { WelcomeGlowBackground } from '../../components/onboarding/WelcomeGlowBackground';
import { getMyProfile, updateMyProfile } from '../../services/user/user.service';
import { colors, spacing, activityColors } from '../../constants/theme';
import { MAX_PRACTICE_PREFERENCES, PRACTICE_OPTIONS } from '../../constants/practiceOptions';
import { useErrorNotificationStore } from '../../store/errorNotificationStore';

/**
 * Two entry points into the same picker:
 * - Onboarding — the last step of the register wizard (see
 *   app/(auth)/register.tsx's own `router.replace('/onboarding/practices')`,
 *   called right after account creation). Gets the SAME dark-screen +
 *   rising-glow background as every register step before it
 *   (`WelcomeGlowBackground`, `activityColors.flexibility` — the same blue
 *   the wizard opened on, bookending the journey), per explicit "they have
 *   to have the same activity gradient flow, match the stage 0 ones"
 *   request. Skip and Continue both leave onboarding; Skip never calls the
 *   API (an empty practice_preferences list is exactly what a fresh profile
 *   already has, nothing to save).
 * - Editing — reached from Edit Profile (`?mode=edit`). Plain
 *   `ScreenBackground`, no glow (a settings screen, not part of the
 *   register journey). Loads the user's current picks first, a real back
 *   button replaces Skip, and Save always PATCHes (including down to an
 *   empty list — clearing every pick is a legitimate save here, unlike
 *   onboarding's Skip).
 *
 * Picks become colored badges on the profile screen (`ProfileHeader`), each
 * inheriting its `activityType`'s color from `constants/theme.ts` — see
 * `constants/practiceOptions.ts` for the full list/mapping rationale.
 */
export default function OnboardingPractices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { show } = useErrorNotificationStore();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isEditMode = mode === 'edit';

  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) return;
    let active = true;
    getMyProfile()
      .then((profile) => {
        if (active) setSelected(profile.practice_preferences ?? []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Only ever runs for the screen's initial edit-mode load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(value: string) {
    setSelected((current) => {
      if (current.includes(value)) {
        return current.filter((v) => v !== value);
      }
      if (current.length >= MAX_PRACTICE_PREFERENCES) {
        return current;
      }
      return [...current, value];
    });
  }

  function finish() {
    if (isEditMode) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  async function handleContinue() {
    if (saving) return;
    // Onboarding's Skip-equivalent (Continue with nothing picked) saves
    // nothing — a fresh profile already has an empty list. Editing always
    // saves, even back down to empty, since that's an explicit choice here.
    if (!isEditMode && selected.length === 0) {
      finish();
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({ practice_preferences: selected });
      finish();
    } catch {
      show({ message: t('onboardingPractices.saveError') });
      if (!isEditMode) finish();
    } finally {
      setSaving(false);
    }
  }

  const content = (
    <>
      <View
        style={[
          styles.header,
          // `ScreenBackground` (edit mode) already adds `insets.top` itself;
          // the raw `View` onboarding uses (for `WelcomeGlowBackground` to
          // sit behind) doesn't, so this adds it directly there instead.
          { paddingTop: (isEditMode ? 0 : insets.top) + spacing.md },
        ]}
      >
        {isEditMode ? (
          <>
            <BackButton />
            {/* Real bug, fixed 2026-09-24, per explicit "make the title not
                be only in one line" report: with no `flex`/width of its own,
                this sized to its own content in the row instead of wrapping
                within the space actually left between the back button and
                the spacer — `flex: 1` lets it wrap onto a real second line
                instead of overflowing past its neighbors. */}
            <Text variant="title" align="center" style={styles.editHeaderTitle}>
              {t('onboardingPractices.editTitle')}
            </Text>
            <View style={styles.headerSpacer} />
          </>
        ) : (
          <>
            <View />
            <Pressable onPress={finish} disabled={saving} hitSlop={8} accessibilityRole="button">
              <Text variant="label" weight="bold" tone="secondary">
                {t('onboardingPractices.skip')}
              </Text>
            </Pressable>
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {!isEditMode && (
            <Stack gap="xs">
              <Text variant="title">{t('onboardingPractices.title')}</Text>
              <Text variant="body" tone="secondary">
                {t('onboardingPractices.subtitle')}
              </Text>
            </Stack>
          )}

          <OptionPillGrid
            label=""
            options={PRACTICE_OPTIONS}
            selectedValues={selected}
            onToggle={toggle}
            renderIcon={(option, isSelected) => (
              <ActivityIcon
                type={option.activityType}
                size="md"
                variant="plain"
                color={isSelected ? colors.ink : colors.paper}
              />
            )}
            getSelectedFill={(option) => activityColors[option.activityType]}
            countLabel={(count) => t('onboardingPractices.selectedCount', { count })}
          />
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button variant="primary" size="md" onPress={handleContinue} loading={saving} style={styles.button}>
          {isEditMode ? t('profileEdit.save') : t('onboardingPractices.continue')}
        </Button>
      </View>
    </>
  );

  if (isEditMode) {
    return <ScreenBackground variant="default">{content}</ScreenBackground>;
  }

  return (
    <View style={styles.onboardingContainer}>
      <WelcomeGlowBackground color={activityColors.flexibility} fadeKey="badges" />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  // Real bug, fixed 2026-09-24, per explicit "gap between the top of the
  // screen and the title is too small" report: `ScreenBackground`'s own
  // `applyTopInset` only adds the raw safe-area inset, nothing else — this
  // had no additional top padding at all, unlike every other screen's own
  // header/listHeader (Home, Challenges, Edit Profile all add `spacing.md`
  // or `spacing.sm` on top of that inset). Its own `paddingTop` is computed
  // inline now (see the JSX) since edit mode's `ScreenBackground` already
  // adds the safe-area inset itself, but onboarding mode's raw `View`
  // doesn't — the two need different amounts.
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  editHeaderTitle: {
    flex: 1,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  headerSpacer: {
    width: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
  },
  button: {
    alignSelf: 'stretch',
  },
});
