import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { IconButton } from '../../../components/ui/iconButton';
import { Divider } from '../../../components/ui/divider';
import { Row } from '../../../components/layout/row';
import { FollowListItem } from '../../../components/profile/FollowListItem';
import { useChallengeParticipants } from '../../../hooks/useChallengeParticipants';
import { getMyChallenges } from '../../../services/user/user.service';
import { colors, spacing } from '../../../constants/theme';

/**
 * Challenge members list — reached from the people-outline icon on the
 * Consistency screen (ChallengeProgressHeader). Reuses FollowListItem
 * (Profile's followers/following row) since a challenge member and a
 * follower are both just "avatar + username, taps through to their
 * profile" — no need for a second near-identical row component.
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = typeof id === 'string' && id.length > 0 ? id : null;
  const { participants, loading } = useChallengeParticipants(challengeId);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!challengeId) return;
    getMyChallenges()
      .then((enrolled) => {
        setIsMember(enrolled.some((c) => String(c.id) === challengeId && c.status !== 'left'));
      })
      .catch(() => setIsMember(false));
  }, [challengeId]);

  return (
    <ScreenBackground variant="default">
      <View style={[styles.header, { paddingTop: spacing.lg }]}>
        <BackButton />
        <Row gap="xs" align="center" justify="flex-start">
          <Icon name="people-outline" size={20} color={colors.paper} />
          <Text variant="title">{t('challengeProgress.membersScreenTitle')}</Text>
        </Row>
        {isMember ? (
          <IconButton
            name="person-add-outline"
            size={40}
            onPress={() => router.push(`/challenge/${challengeId}/invite`)}
            accessibilityLabel={t('challengeProgress.inviteMembersA11y')}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FollowListItem user={item} />}
          ItemSeparatorComponent={() => <Divider marginVertical="xs" />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="secondary">{t('challengeProgress.membersEmpty')}</Text>
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
    justifyContent: 'space-between',
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
    // `lg` (24) — same "section spacing" token used to separate a header
    // from the content below it elsewhere in the app, not the tighter `sm`
    // (8) this used to share with FollowListScreen (that screen's own list
    // sits close under its header by design; this one didn't read the same way).
    paddingBottom: spacing.lg,
  },
  headerSpacer: {
    width: 40,
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
