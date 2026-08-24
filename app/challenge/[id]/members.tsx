import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ScreenBackground from '../../../components/layout/screenBackground';
import { BackButton } from '../../../components/ui/backButton';
import { Text } from '../../../components/ui/text';
import { Icon } from '../../../components/ui/icon';
import { Divider } from '../../../components/ui/divider';
import { Row } from '../../../components/layout/row';
import { FollowListItem } from '../../../components/profile/FollowListItem';
import { useChallengeParticipants } from '../../../hooks/useChallengeParticipants';
import { colors, spacing } from '../../../constants/theme';

/**
 * Challenge members list — reached from the people-outline icon on the
 * Consistency screen (ChallengeProgressHeader). Reuses FollowListItem
 * (Profile's followers/following row) since a challenge member and a
 * follower are both just "avatar + username, taps through to their
 * profile" — no need for a second near-identical row component.
 */
export default function ChallengeMembers() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const challengeId = typeof id === 'string' && id.length > 0 ? id : null;
  const { participants, loading } = useChallengeParticipants(challengeId);

  return (
    <ScreenBackground variant="default">
      <View style={styles.header}>
        <BackButton />
        <Row gap="xs" align="center" justify="flex-start">
          <Icon name="people-outline" size={20} color={colors.paper} />
          <Text variant="title">{t('challengeProgress.membersScreenTitle')}</Text>
        </Row>
        <View style={styles.headerSpacer} />
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
    paddingTop: spacing.xs,
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
