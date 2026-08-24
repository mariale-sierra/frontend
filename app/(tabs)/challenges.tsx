import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../components/layout/screenBackground';
import { Row } from '../../components/layout/row';
import { Icon } from '../../components/ui/icon';
import { Text } from '../../components/ui/text';
import { ChallengeStatusCard } from '../../components/challenge/list/ChallengeStatusCard';
import { ExploreChallengeCard } from '../../components/challenge/list/ExploreChallengeCard';
import { ChallengesViewToggle } from '../../components/challenge/list/ChallengesViewToggle';
import type { ChallengesView } from '../../components/challenge/list/ChallengesViewToggle';
import type { ExploreChallengeViewModel } from '../../components/challenge/list/challengeListSections';
import type { ChallengeMineCardViewModel } from '../../services/adapters/challengeListAdapter';
import { colors, radius, spacing } from '../../constants/theme';
import { getChallenges, getMyProgressPhotos } from '../../services/challenge/challenge.service';
import { getMyChallenges } from '../../services/user/user.service';
import { toChallengeMineViewModels, toExploreChallengeViewModels } from '../../services/adapters';
import { groupLatestPhotoByChallengeId } from '../../services/adapters/challengeState';

export default function Challenges() {
  const router = useRouter();
  const { t } = useTranslation();

  const [view, setView] = useState<ChallengesView>('mine');
  const [mineChallenges, setMineChallenges] = useState<ChallengeMineCardViewModel[]>([]);
  const [exploreChallenges, setExploreChallenges] = useState<ExploreChallengeViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refetches on focus (not just on mount) so joining/leaving/completing a
  // challenge elsewhere and coming back here shows the current state.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([getMyChallenges(), getChallenges(), getMyProgressPhotos()])
        .then(([enrolledRaw, all, myPhotos]) => {
          if (!active) return;
          const latestPhotoByChallengeId = groupLatestPhotoByChallengeId(myPhotos ?? []);
          setMineChallenges(toChallengeMineViewModels(enrolledRaw ?? [], latestPhotoByChallengeId));
          setExploreChallenges(toExploreChallengeViewModels(all ?? []));
          setError(null);
        })
        .catch((err) => {
          console.error('[challenges] load failed:', err?.response?.status, err?.response?.data ?? err?.message ?? err);
          if (active) setError(t('challenges.loadError'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [t]),
  );

  const handleCreateChallenge = () => router.push('/challenge/create');
  const handleOpenMineChallenge = (id: string) => router.push(`/challenge/${id}/progress`);
  const handleOpenExploreChallenge = (id: string) => router.push(`/challenge/${id}`);

  const listHeader = (
    <View style={styles.listHeader}>
      <Row justify="space-between" align="center">
        <Text variant="title">{t('challenges.screenTitle')}</Text>
        {/* Bespoke pill, not the shared Button — this wireframe wants 14px
            bold text, and Button's `sm` size renders `caption` (12px,
            regular) internally with no way to override just the text style
            per call site. Changing that globally wasn't safe to do off the
            strength of one wireframe when Button's `sm` size is already used
            elsewhere without a confirmed spec. */}
        <Pressable
          onPress={handleCreateChallenge}
          style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          accessibilityRole="button"
        >
          <Icon name="add-outline" size={16} color={colors.ink} />
          <Text variant="label" weight="bold" inverse>
            {t('challenges.newButton')}
          </Text>
        </Pressable>
      </Row>

      <ChallengesViewToggle
        view={view}
        onViewChange={setView}
        mineLabel={t('challenges.mineTab')}
        exploreLabel={t('challenges.exploreTab')}
      />
    </View>
  );

  if (loading) {
    return (
      <ScreenBackground variant="default">
        {listHeader}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenBackground>
    );
  }

  if (error) {
    return (
      <ScreenBackground variant="default">
        {listHeader}
        <View style={styles.center}>
          <Text tone="secondary">{error}</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="default">
      {view === 'mine' ? (
        <FlatList
          data={mineChallenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={({ item }) => (
            <ChallengeStatusCard challenge={item} onPress={() => handleOpenMineChallenge(item.challengeId)} />
          )}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" tone="secondary" align="center">
                {t('challenges.emptyMine')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={exploreChallenges}
          keyExtractor={(item) => item.challengeId}
          renderItem={({ item }) => (
            <ExploreChallengeCard challenge={item} onPress={() => handleOpenExploreChallenge(item.challengeId)} />
          )}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text variant="body" tone="secondary" align="center">
                {t('challenges.emptyExplore')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.big,
    backgroundColor: colors.primary,
  },
  newButtonPressed: {
    opacity: 0.9,
  },
  listHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
});
