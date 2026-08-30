import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import ScreenBackground from '../../../components/layout/screenBackground';
import { Row } from '../../../components/layout/row';
import { BackButton } from '../../../components/ui/backButton';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { ChallengeHeader, ChallengeAboutSection, ChallengeRoutineList, ChallengeInfoContentSkeleton } from '../../../components/challenge/detail';
import { ChallengeAccentGlow } from '../../../components/challenge/challengeAccentGlow';
import type { ChallengeInfoRow } from '../../../components/challenge/detail';
import { colors, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { getChallenge, joinChallenge } from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { toChallengeDetailViewModel } from '../../../services/adapters/index';
import { getChallengeAccentColor, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { useConfirmationPopup } from '../../../hooks/useConfirmationPopup';
import type { ChallengeContract } from '../../../types/challenge';

type MembershipStatus = 'creator' | 'joined' | 'none';

/**
 * Challenge info screen — title, info rows (duration/location/focus/proof),
 * "About", and the cycle's routine list. This is what the info-circle icon
 * on the Consistency screen (app/challenge/[id]/progress.tsx) navigates to,
 * and what a routine row's chevron leads BACK from — tapping a row here
 * pushes into Routine-Detail (app/challenge/[id]/routine/[day].tsx), never
 * the other way around.
 */
export default function ChallengeDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>('none');
  const [membershipLoading, setMembershipLoading] = useState(true);

  const joinPopup = useConfirmationPopup({
    type: 'join',
    challengeName: challenge?.name ?? t('challenges.fallbackName'),
    onConfirm: async () => {
      const challengeId = typeof id === 'string' ? id : '';
      if (!challengeId) return;
      try {
        await joinChallenge(challengeId);
        setMembershipStatus('joined');
      } catch {
        // The confirmation popup itself surfaces failure via its own error state; nothing else to do here.
      }
    },
  });

  useEffect(() => {
    if (!id) return;
    getChallenge(id)
      .then(setChallenge)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!challenge) return;

    // See app/challenge/[id]/routine/[day].tsx and progress.tsx — same
    // "created_by_user_id vs enrolled-list membership" check used everywhere
    // else in the app to decide whether the current user is already in.
    getMyChallenges()
      .then((enrolled) => {
        const isMember = enrolled.some(
          (c) => String(c.id) === String(challenge.id) && c.status !== 'left',
        );
        setMembershipStatus(isMember ? 'joined' : 'none');
      })
      .catch(() => setMembershipStatus('none'))
      .finally(() => setMembershipLoading(false));
  }, [challenge]);

  function handleShare() {
    if (!challenge) return;
    Share.share({ message: t('challengeInfo.shareMessage', { name: challenge.name }) }).catch(() => {});
  }

  if (loading) {
    return (
      <ScreenBackground variant="default">
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
          <View style={styles.iconButton} />
        </Row>
        <ChallengeInfoContentSkeleton />
      </ScreenBackground>
    );
  }

  const detailLabels = {
    locationFallbackLabel: t('challenges.locationFallback'),
    categoryFallbackLabel: t('challenges.categoryFallback'),
  };
  const result = challenge ? toChallengeDetailViewModel(challenge, detailLabels) : null;

  if (error || !result?.ok) {
    return (
      <ScreenBackground variant="default">
        <View style={styles.center}>
          <Text tone="secondary" align="center" style={styles.errorText}>
            {t('challenges.detailLoadError')}
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  const view = result.value;
  // Activity Color System v2 — this challenge's own resolved accent color,
  // used for the title, the "Lasts" row's calendar icon, the "Read more"
  // toggle, and each workout day's numbered badge below.
  const dominantActivityCategory = challenge ? pickDominantActivityCategory(challenge) : null;
  const accentColor = getChallengeAccentColor(dominantActivityCategory);

  const infoRows: ChallengeInfoRow[] = [
    {
      icon: 'calendar-outline',
      iconColor: accentColor,
      label: t('challengeInfo.lastsLabel'),
      value: `${t('challenges.durationDaysLabel', { count: view.durationDays })} · ${
        view.restDaysPerCycleCount > 0
          ? t('challengeInfo.restEveryCycle', { count: view.restDaysPerCycleCount, cycleLength: view.cycleLengthDays })
          : t('challenges.noRestDays')
      }`,
    },
    { icon: 'location-outline', label: t('challengeInfo.doItAtLabel'), value: view.locationsLabel },
    { icon: 'flash-outline', label: t('challengeInfo.focusLabel'), value: view.categoriesLabel },
    { icon: 'camera-outline', label: t('challengeInfo.dailyProofLabel'), value: t('challengeInfo.dailyProofValue') },
  ];

  return (
    <ScreenBackground variant="default" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ChallengeAccentGlow color={accentColor} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: membershipStatus === 'none' ? spacing['2xl'] : insets.bottom + spacing.xl }}
      >
        <Row justify="space-between" align="center" style={styles.topBar}>
          <BackButton style={styles.backButton} />
          <Row gap="xs" align="center">
            <Pressable
              // `dominantActivityCategory` passed through as a route param
              // (2026-08-30) — Members already resolved it here, so the
              // destination screen can paint its own accent glow on its
              // very first render instead of waiting out its own
              // `getChallenge()` round trip first (was a real ~1s "no
              // gradient, then it pops in" gap the user flagged on-device).
              // See `services/adapters/challengeState.ts`'s `parseActivityType`
              // for how the destination screen re-validates this untrusted
              // string before trusting it.
              onPress={() =>
                router.push(
                  `/challenge/${id}/members?dominantActivityCategory=${dominantActivityCategory ?? ''}`,
                )
              }
              style={({ pressed }) => [styles.membersPill, pressed && styles.pressed]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('challengeInfo.membersA11y')}
            >
              <Icon name="people-outline" size={18} color={colors.paper} />
              <Text variant="label" weight="bold">{view.membersJoined}</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t('challengeInfo.shareA11y')}
            >
              <Icon name="share-outline" size={22} color={colors.paper} />
            </Pressable>
          </Row>
        </Row>

        <View style={styles.section}>
          <ChallengeHeader title={view.title} rows={infoRows} accentColor={accentColor} />
        </View>

        <View style={styles.section}>
          <ChallengeAboutSection description={view.description} accentColor={accentColor} />
        </View>

        <View style={styles.section}>
          <ChallengeRoutineList
            days={view.days}
            cycleLengthDays={view.cycleLengthDays}
            durationDays={view.durationDays}
            accentColor={accentColor}
            onPressDay={(day) => router.push(`/challenge/${id}/routine/${day}`)}
          />
        </View>
      </ScrollView>

      {/* Per explicit request: an already-joined (or creator) user sees no
          button at all here, not a disabled/relabeled one — the wireframe
          only shows this bar for someone who hasn't joined yet. */}
      {!membershipLoading && membershipStatus === 'none' && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <Pressable
            onPress={joinPopup.show}
            style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challenges.joinButtonA11y')}
          >
            <Text variant="body" weight="bold" style={styles.joinButtonText}>
              {t('challengeInfo.joinChallengeButton')}
            </Text>
          </Pressable>
        </View>
      )}

      <joinPopup.Component />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    opacity: 1,
  },
  topBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  // Fixed 2026-08-29, per explicit "remove the dark pill-shaped element
  // behind it" request — was a `surface`-bg, `radius.big` pill (padding
  // included). Now just the icon+count, no background chrome, matching the
  // plain-icon look of its sibling `iconButton` (the share button) right
  // next to it. `hitSlop` on the Pressable itself (see JSX) keeps a
  // reasonable touch target now that padding isn't providing one.
  membersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    paddingBottom: spacing.lg,
  },
  bottomBar: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withAlpha(colors.paper, 0.08),
  },
  joinButton: {
    height: 52,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: colors.ink,
    opacity: 1,
  },
});
