import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { IconButton } from '../../../components/ui/iconButton';
import { SearchBar } from '../../../components/ui/searchBar';
import { Divider } from '../../../components/ui/divider';
import { FollowListItem } from '../../../components/profile/FollowListItem';
import { ChallengeAccentGlow } from '../../../components/challenge/challengeAccentGlow';
import { useChallengeParticipants } from '../../../hooks/useChallengeParticipants';
import { getChallenge } from '../../../services/challenge/challenge.service';
import { getMyChallenges } from '../../../services/user/user.service';
import { getChallengeAccentColor, parseActivityType, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { colors, spacing } from '../../../constants/theme';
import type { ChallengeContract } from '../../../types/challenge';

const HEADER_SIDE_SIZE = 44;

/**
 * Challenge members list — reached from the people-outline icon on the
 * Consistency screen (ChallengeProgressHeader) and Challenge-Info. Reuses
 * FollowListItem (Profile's followers/following row) since a challenge
 * member and a follower are both just "avatar + username, taps through to
 * their profile" — no need for a second near-identical row component.
 *
 * Refactored 2026-08-30 to match the Members-44A wireframe: centered header
 * title (was left-hugging next to a `people-outline` icon the wireframe
 * doesn't show), a member-count hero + local username search + "All
 * members" eyebrow above the list (all new — this screen previously jumped
 * straight from the header into the list). Background and the header's
 * invite icon now use this challenge's own Activity Color System v2 accent
 * (`ChallengeAccentGlow`, the same reusable top glow Challenge-Info and the
 * Consistency screen already use) — the wireframe's flat yellow is that
 * system's placeholder, not a literal color to hardcode; see
 * havit-design-system-SKILL.md's Activity Color System v2 section.
 *
 * The wireframe's own bottom tab bar is that mockup template's boilerplate
 * phone-frame chrome, not a real bottom nav for this screen — this is a
 * pushed stack route (`app/challenge/[id]/members.tsx`), not one of the
 * `(tabs)` screens, and no other pushed screen in the app grows a tab bar
 * to match its wireframe's frame. Same read given to invite.tsx's own
 * wireframe, which uses the same template without that chrome.
 *
 * Trailing header icon: person-add-outline, navigating to the
 * search-and-invite flow (app/challenge/[id]/invite.tsx) — added
 * 2026-08-29. That screen already existed, fully working and
 * backend-connected, but had been orphaned (no entry point anywhere)
 * since the Challenge-Info redesign dropped the old "invite people" icon
 * — see havit-design-system-SKILL.md's 🚩 Orphaned entry points note.
 * Member-only, matching that old icon's own gating rule — same
 * "created_by_user_id vs enrolled-list membership" check used everywhere
 * else in the app (see app/challenge/[id]/index.tsx).
 */
export default function ChallengeMembers() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, dominantActivityCategory: categoryParam } = useLocalSearchParams<{
    id: string;
    dominantActivityCategory?: string;
  }>();
  const challengeId = typeof id === 'string' && id.length > 0 ? id : null;
  const { participants, loading } = useChallengeParticipants(challengeId);
  const [isMember, setIsMember] = useState(false);
  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [query, setQuery] = useState('');

  // Whoever linked here may already have resolved this challenge's own
  // dominant activity category (Challenge-Info, the Consistency screen) —
  // passed through as a route param so the accent glow below can paint on
  // this screen's very first render instead of waiting out its own
  // `getChallenge()` round trip. `categoryParam !== undefined` (even as an
  // empty string, meaning "known: no dominant category") is what
  // distinguishes "caller told us" from "direct/deep link, truly unknown
  // yet" — `parseActivityType('')` alone can't, since it returns `null`
  // for both an empty string AND a genuinely missing param.
  const hasCategoryParam = typeof categoryParam === 'string';
  const dominantActivityCategory = challenge
    ? pickDominantActivityCategory(challenge)
    : hasCategoryParam
      ? parseActivityType(categoryParam)
      : undefined;
  const accentColorKnown = challenge !== null || hasCategoryParam;

  useEffect(() => {
    if (!challengeId) return;
    getMyChallenges()
      .then((enrolled) => {
        setIsMember(enrolled.some((c) => String(c.id) === challengeId && c.status !== 'left'));
      })
      .catch(() => setIsMember(false));
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId)
      .then(setChallenge)
      .catch(() => setChallenge(null));
  }, [challengeId]);

  const accentColor = getChallengeAccentColor(dominantActivityCategory ?? null);

  const trimmedQuery = query.trim().toLowerCase();
  const filteredParticipants = trimmedQuery
    ? participants.filter((user) => user.username.toLowerCase().includes(trimmedQuery))
    : participants;

  return (
    <ScreenBackground variant="default">
      {/* Gated on `accentColorKnown` (2026-08-30) — rendering this
          unconditionally showed the `colors.primary` fallback (white) for
          as long as the real color was unknown, then visibly snapped to
          it once resolved. When a caller already passed
          `dominantActivityCategory` as a route param (see above), this is
          true from the very first render — no flash, no delay. A cold/
          deep-linked visit with no param still waits on `getChallenge()`
          the same way `app/challenge/[id]/index.tsx` does via its own
          loading-skeleton return before its `ChallengeAccentGlow`. */}
      {accentColorKnown && <ChallengeAccentGlow color={accentColor} />}

      <View style={[styles.header, { paddingTop: spacing.lg }]}>
        <BackButton style={styles.headerSideButton} />
        <Text variant="title" align="center" style={styles.headerTitle}>
          {t('challengeProgress.membersScreenTitle')}
        </Text>
        {isMember ? (
          <IconButton
            name="person-add-outline"
            size={HEADER_SIDE_SIZE}
            iconColor={accentColor}
            onPress={() =>
              router.push(
                `/challenge/${challengeId}/invite?dominantActivityCategory=${dominantActivityCategory ?? ''}`,
              )
            }
            accessibilityLabel={t('challengeProgress.inviteMembersA11y')}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <View style={styles.hero}>
        {loading ? (
          <ActivityIndicator color={accentColor} />
        ) : (
          <>
            <Text variant="title">{participants.length}</Text>
            {challenge && (
              <Text variant="label" tone="secondary" align="center">
                {t('challengeProgress.membersDoingLabel', { challenge: challenge.name })}
              </Text>
            )}
          </>
        )}
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('challengeProgress.membersSearchPlaceholder')}
        />
      </View>

      <View style={styles.sectionLabelWrap}>
        <Text variant="header" tone="secondary">{t('challengeProgress.allMembersLabel')}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredParticipants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FollowListItem user={item} />}
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">
                {trimmedQuery ? t('challengeProgress.membersSearchEmpty') : t('challengeProgress.membersEmpty')}
              </Text>
            </View>
          }
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    // `paddingTop` is applied inline (see JSX: `spacing.lg`), not here —
    // matches `app/challenge/[id]/invite.tsx`'s own top padding, both fixed
    // 2026-08-29 (real bug, not just a "make it bigger" ask): both screens
    // used to add `insets.top` a SECOND time on top of `ScreenBackground`'s
    // own default `applyTopInset` (which already applies one `insets.top`
    // to its content wrapper — neither screen opts out of that default).
    // The doubled inset was liked at first (see git history — this was
    // briefly `insets.top + spacing.sm`/`insets.top + spacing.xs`), but
    // confirmed a real bug once a small token-only reduction made no
    // visible difference — the dominant term was the duplicated
    // `insets.top`, not the small spacing addend riding on top of it.
    // Fixed by dropping the redundant `insets.top` entirely on both
    // screens, keeping one generous token (`lg`, 24) as deliberate
    // breathing room on top of the ONE real inset already applied.
    paddingBottom: spacing.sm,
  },
  // Centered-title layout (2026-08-30, matches Members-44A): `BackButton`
  // and the trailing icon/spacer are both pinned to the SAME fixed width
  // (`HEADER_SIDE_SIZE`, matching the wireframe's literal 44×44 for both),
  // so the title's own `flex: 1` + `align="center"` lands it in the true
  // center of the row regardless of which side is present — not just
  // "between" two differently-sized siblings the way `justify-content:
  // space-between` alone would.
  headerSideButton: {
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: HEADER_SIDE_SIZE,
  },
  // Member-count hero (2026-08-30, new — Members-44A wireframe). The
  // wireframe's own number is 46px; capped at `title`'s `3xl` (30px)
  // instead, same "no size above `3xl`, redesign the layout instead" rule
  // already applied elsewhere (see havit-design-system-SKILL.md's
  // Typography section and the Consistency-ring number's own precedent).
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    minHeight: 64,
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionLabelWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
