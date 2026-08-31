import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/icon';
import { BackButton } from '../../ui/backButton';
import { Text } from '../../ui/text';
import { PhotoDetailCard } from '../../ui/photoDetailCard';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import type { ChallengePhoto } from '../../../types/challenge';

interface ChallengePhotoGalleryModalProps {
  visible: boolean;
  photos: ChallengePhoto[];
  selectedPhotoId: string | null;
  selectedDay: number | null;
  onClose: () => void;
}

function orderPhotosForFeed(photos: ChallengePhoto[], selectedPhotoId: string | null) {
  if (!selectedPhotoId) return photos;
  const selected = photos.find((p) => p.id === selectedPhotoId);
  if (!selected) return photos;
  return [selected, ...photos.filter((p) => p.id !== selectedPhotoId)];
}

/**
 * "Scroll pic mode" — opened from the Consistency screen by tapping a
 * calendar day (feed filtered to that day) or a grid photo (feed shows
 * every photo for the challenge, most-recent-first, selected one pinned to
 * the top). No wireframe for this one; retokenized and given a header title
 * for context (a bare back button with no indication of what you're
 * looking at was a real gap — a modal pushed over the current screen should
 * say what it's showing, same principle `members.tsx`'s screen title
 * already follows).
 */
export function ChallengePhotoGalleryModal({
  visible,
  photos,
  selectedPhotoId,
  selectedDay,
  onClose,
}: ChallengePhotoGalleryModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const feedPhotos = useMemo(() => {
    const relevant = selectedDay != null
      ? photos.filter((p) => p.day === selectedDay)
      : photos;
    return orderPhotosForFeed(relevant, selectedPhotoId);
  }, [photos, selectedDay, selectedPhotoId]);

  const title = selectedDay != null ? t('challenges.dayLabel', { day: selectedDay }) : t('challengeProgress.gallery.feedTitle');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <BackButton style={styles.backButton} onPress={onClose} />
          <Text variant="subheader" numberOfLines={1} style={styles.title}>{title}</Text>
          {/* Balances the back button so the title stays visually centered. */}
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={feedPhotos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PhotoDetailCard photo={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContent,
            { paddingBottom: insets.bottom + spacing['2xl'] },
            feedPhotos.length === 0 && styles.emptyContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Icon name="images-outline" size={34} color={withAlpha(colors.paper, textOpacity.tertiary)} />
              <Text variant="body" tone="secondary" align="center">
                {t('challengeProgress.gallery.emptyMessage')}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  backButton: {
    marginLeft: -spacing.sm,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  // Matches BackButton's rendered footprint (44 default size, minus the
  // -sm marginLeft pulling it flush with the screen edge) so the title
  // stays visually centered between the two.
  headerSpacer: {
    width: 36,
  },
  feedContent: {
    paddingHorizontal: spacing.base,
  },
  // Bumped a step up the scale (`xl` → `2xl`) — with a header row, photo,
  // caption, and a metrics table all inside each card, `xl` wasn't reading
  // as a clear break between one photo's content and the next.
  separator: {
    height: spacing['2xl'],
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    width: '100%',
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: withAlpha(colors.paper, 0.08),
    backgroundColor: colors.surface,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
});
