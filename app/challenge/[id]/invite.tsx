import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { Button } from '../../../components/ui/button';
import { SearchBar } from '../../../components/ui/searchBar';
import { UserAvatar } from '../../../components/ui/userAvatar';
import { ConfirmationPopup } from '../../../components/ui/confirmationPopup';
import { Row } from '../../../components/layout/row';
import { ChallengeAccentGlow } from '../../../components/challenge/challengeAccentGlow';
import { searchUsers } from '../../../services/user/user.service';
import { createInvite } from '../../../services/invites/invite.service';
import { getChallenge } from '../../../services/challenge/challenge.service';
import { getChallengeAccentColor, parseActivityType, pickDominantActivityCategory } from '../../../services/adapters/challengeState';
import { useErrorNotificationStore } from '../../../store/errorNotificationStore';
import { colors, radius, spacing } from '../../../constants/theme';
import type { PublicProfileContract } from '../../../types/user';
import type { ChallengeContract } from '../../../types/challenge';

/**
 * Invite-users flow, reached from the members screen's invite icon. Search
 * by username, confirm before sending, per-user sent state so the same
 * user can't be invited twice from this screen.
 *
 * Refactored 2026-08-30 to match the Invite-44B wireframe: the old
 * back-chevron + "Invite Users" title header row is gone, replaced by the
 * wireframe's icon + headline + subtitle hero ("Bring your people in..."),
 * and a "Results" eyebrow now sits above the list (previously the list
 * started right under the search bar). Background and the "Invite" button
 * now use this challenge's own Activity Color System v2 accent
 * (`ChallengeAccentGlow`, the same reusable top glow Challenge-Info and the
 * Consistency screen already use, plus the same accent-fill CTA pattern
 * Routine-Detail's Join button uses) — the wireframe's flat yellow is that
 * system's placeholder, not a literal color to hardcode; see
 * havit-design-system-SKILL.md's Activity Color System v2 section.
 */
export default function InviteUsers() {
  const { t } = useTranslation();
  const { id: challengeId, dominantActivityCategory: categoryParam } = useLocalSearchParams<{
    id: string;
    dominantActivityCategory?: string;
  }>();

  const [challenge, setChallenge] = useState<ChallengeContract | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicProfileContract[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [confirmUser, setConfirmUser] = useState<PublicProfileContract | null>(null);
  const { show, showSuccess } = useErrorNotificationStore();

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId)
      .then(setChallenge)
      .catch(() => setChallenge(null));
  }, [challengeId]);

  // Debounced username search against GET /users/search.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      searchUsers(q)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  // Members already resolved this challenge's own dominant activity
  // category before linking here — passed through as a route param so the
  // accent glow/CTA below can paint on this screen's very first render
  // instead of waiting out its own `getChallenge()` round trip (the ~1s
  // "no gradient, then it pops in" gap flagged on-device). See
  // `members.tsx`'s own matching comment for why `hasCategoryParam` (not
  // just `parseActivityType(categoryParam)`) is what distinguishes "caller
  // told us" from "direct/deep link, truly unknown yet."
  const hasCategoryParam = typeof categoryParam === 'string';
  const dominantActivityCategory = challenge
    ? pickDominantActivityCategory(challenge)
    : hasCategoryParam
      ? parseActivityType(categoryParam)
      : undefined;
  const accentColorKnown = challenge !== null || hasCategoryParam;
  const accentColor = getChallengeAccentColor(dominantActivityCategory ?? null);
  const challengeName = challenge?.name ?? '';

  const handleSendConfirmed = async () => {
    const user = confirmUser;
    setConfirmUser(null);
    if (!user || !challengeId || sendingId) return;

    setSendingId(user.id);
    try {
      await createInvite(challengeId, user.id);
      setSentIds((prev) => new Set(prev).add(user.id));
      showSuccess({ message: t('invites.successSent', { username: user.username }) });
    } catch (error: any) {
      const status = error?.response?.status;
      show({
        message:
          status === 409
            ? t('invites.errorDuplicate', { username: user.username })
            : t('invites.errorSend'),
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <ScreenBackground variant="default">
      {/* Gated on `accentColorKnown` (2026-08-30) — see the matching
          comment above and in members.tsx for why. */}
      {accentColorKnown && <ChallengeAccentGlow color={accentColor} />}

      {/* `paddingTop: spacing.lg` — fixed 2026-08-29, real bug: this used to
          be `insets.top + spacing.sm`, double-counting the safe-area inset
          `ScreenBackground`'s own default `applyTopInset` already applies
          to its content wrapper (neither screen opts out of that default).
          The doubled inset was liked at first sight (see members.tsx's own
          padding, briefly matched to this exact formula the same day) but
          confirmed a bug once a small token-only reduction on members.tsx
          made no visible difference — the actual dominant term was the
          duplicated `insets.top`, not the small spacing addend. Fixed here
          by dropping the redundant `insets.top` entirely, keeping a single
          generous token (`lg`, 24) as deliberate breathing room on top of
          the ONE real inset `ScreenBackground` already provides. */}
      <View style={[styles.container, { paddingTop: spacing.lg }]}>
        <BackButton style={styles.backButton} />

        {/* Hero (2026-08-30, new — Invite-44B wireframe): replaces the old
            back-chevron + "Invite Users" title row entirely. The headline
            is `title` (Bebas Neue, capped at `3xl`/30px) — close enough to
            the wireframe's own 32px that no size-cap compromise shows. */}
        <View style={styles.hero}>
          <Icon name="mail-outline" size={52} color={colors.paper} />
          <Text variant="title" align="center">{t('invites.heroTitle')}</Text>
          <Text variant="body" size="sm" tone="secondary" align="center">
            {t('invites.heroSubtitle', { challenge: challengeName })}
          </Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('invites.searchPlaceholder')}
        />

        <Text variant="header" tone="secondary" style={styles.resultsLabel}>
          {t('invites.resultsLabel')}
        </Text>

        {searching ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(user) => user.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.trim() ? (
                <View style={styles.center}>
                  <Text tone="secondary">{t('invites.searchEmpty')}</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const alreadySent = sentIds.has(item.id);
              return (
                <Row align="center" gap="md" style={styles.userRow}>
                  <UserAvatar
                    username={item.username}
                    imageUrl={item.profile_image_url}
                    size={40}
                  />
                  <View style={styles.userInfo}>
                    <Text variant="subheader" numberOfLines={1}>
                      {item.display_name}
                    </Text>
                    <Text variant="caption" tone="secondary" numberOfLines={1}>
                      @{item.username}
                    </Text>
                  </View>
                  <Button
                    // Fixed 2026-08-29, per explicit "doesn't match the vibe"
                    // report: was `outline` (bordered). Same fix already
                    // applied to FollowButton's "Following" state — an
                    // already-completed toggle reads better as `subtle`
                    // (translucent fill, no border) than a bordered/hollow
                    // pill. See Button's own doc comment for the variant.
                    variant={alreadySent ? 'subtle' : 'primary'}
                    // Activity-color fill (2026-08-30) on the active "Invite"
                    // state only — `Button`'s own `style` prop is merged
                    // last over its variant style (see Button's own array
                    // merge), so this cleanly overrides just the background,
                    // keeping `primary`'s `ink` text. The already-sent
                    // `subtle` state is untouched — that's a fixed neutral
                    // "done" look, not this challenge's own color.
                    style={!alreadySent ? { backgroundColor: accentColor } : undefined}
                    size="sm"
                    disabled={alreadySent || sendingId !== null}
                    loading={sendingId === item.id}
                    onPress={() => setConfirmUser(item)}
                  >
                    {alreadySent ? t('invites.sentLabel') : t('invites.send')}
                  </Button>
                </Row>
              );
            }}
          />
        )}
      </View>

      <ConfirmationPopup
        visible={confirmUser !== null}
        title={t('invites.confirmSendTitle')}
        description={t('invites.confirmSendDescription', {
          username: confirmUser?.username ?? '',
          challenge: challengeName,
        })}
        primaryButton={{
          label: t('invites.send'),
          onPress: handleSendConfirmed,
        }}
        secondaryButton={{
          label: t('common.actions.back'),
          onPress: () => setConfirmUser(null),
        }}
        onDismiss={() => setConfirmUser(null)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  resultsLabel: {
    paddingTop: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  center: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fixed 2026-08-29, design-system audit (this screen was orphaned/
  // unreachable until now, so it missed the sweep that already fixed the
  // same "glass card" pattern elsewhere — see Card's own doc comment,
  // Explicitly Rejected Patterns): was `Card variant="basicGlass"
  // radius="big"`, the one lingering glass-card usage left in the app. Now
  // matches `SearchUserRow`'s own List-row convention exactly (`surface`
  // bg, `medium` radius, `md` padding) — the same "search result row"
  // shape, just with a send-invite action instead of a follow button.
  userRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.medium,
    padding: spacing.md,
  },
  userInfo: {
    flex: 1,
    // `spacing.xs` (4) — was a hardcoded `2`, not a real token on the
    // scale (theme.ts's own comment: "DO NOT use a spacing value outside
    // this scale"). `xs` is the smallest token; visually near-identical.
    gap: spacing.xs,
  },
});
