import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { spacing } from '../../../constants/theme';
import { Text } from '../../ui/text';
import { SegmentedIconToggle } from '../../ui/segmentedIconToggle';
import { useChallengeActiveProgress } from '../../../hooks/useChallengeActiveProgress';
import { useConfirmationPopup } from '../../../hooks/useConfirmationPopup';
import { getChallengeAccentColor } from '../../../services/adapters/challengeState';
import { leaveChallenge } from '../../../services/challenge/challenge.service';
import ScreenBackground from '../../layout/screenBackground';
import { ChallengeProgressHeader } from './ChallengeProgressHeader';
import { ChallengePhotoGalleryModal } from './ChallengePhotoGalleryModal';
import { ChallengePhotoMosaicSkeleton } from './ChallengePhotoMosaicSkeleton';
import { ChallengeProgressContentSkeleton } from './ChallengeProgressContentSkeleton';
import { ChallengeWorkoutCalendar } from './ChallengeWorkoutCalendar';

type ConsistencyView = 'grid' | 'calendar';

export function ChallengeActiveProgressScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routeChallengeId = typeof id === 'string' && id.length > 0 ? id : null;

  const data = useChallengeActiveProgress(routeChallengeId);
  const [view, setView] = useState<ConsistencyView>('grid');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const galleryVisible = selectedPhotoId != null || selectedDay != null;

  const leavePopup = useConfirmationPopup({
    type: 'leave',
    challengeName: data.title,
    onConfirm: async () => {
      if (!data.challengeId) return;
      await leaveChallenge(data.challengeId);
      router.replace('/(tabs)/challenges');
    },
  });

  function handlePressInfo() {
    if (data.challengeId) {
      router.push(`/challenge/${data.challengeId}`);
    }
  }

  function handlePressMembers() {
    if (data.challengeId) {
      router.push(`/challenge/${data.challengeId}/members`);
    }
  }

  function handlePressRoutine() {
    if (!data.challengeId || data.isTodayRestDay) return;
    router.push(`/challenge/${data.challengeId}/routine/${data.currentDayInCycle}`);
  }

  function openPhotoGallery(photoId: string) {
    setSelectedPhotoId(photoId);
    setSelectedDay(null);
  }

  function openDayGallery(day: number) {
    const dayPhoto = data.photos.find((photo) => photo.day === day);
    if (!dayPhoto) return;
    setSelectedPhotoId(dayPhoto.id);
    setSelectedDay(day);
  }

  function closeGallery() {
    setSelectedPhotoId(null);
    setSelectedDay(null);
  }

  if (data.loading) {
    return (
      <ScreenBackground variant="challenges" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
        <ChallengeProgressContentSkeleton />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="challenges" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      {/* The whole screen scrolls as one — the grid/calendar below are plain
          content Views, not their own independently-scrolling pager pages,
          so the ring/header don't trap the rest of the screen behind a fixed
          viewport height. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
      >
        <ChallengeProgressHeader
          state={data.state}
          title={data.title}
          currentDay={data.currentDay}
          totalDays={data.totalDays}
          ticks={data.ticks}
          todayRoutineName={data.todayRoutineName}
          isTodayRestDay={data.isTodayRestDay}
          dominantActivityCategory={data.dominantActivityCategory}
          onPressRoutine={handlePressRoutine}
          onPressMembers={handlePressMembers}
          onPressInfo={handlePressInfo}
          onPressLeave={leavePopup.show}
        />

        <View style={styles.consistencyHeader}>
          <Text variant="subheader">{t('challengeProgress.consistency.title')}</Text>
          <SegmentedIconToggle
            value={view}
            onChange={setView}
            activeColor={getChallengeAccentColor(data.dominantActivityCategory)}
            options={[
              { value: 'grid', icon: 'grid-outline', accessibilityLabel: t('challengeProgress.consistency.gridViewA11y') },
              { value: 'calendar', icon: 'calendar-outline', accessibilityLabel: t('challengeProgress.consistency.calendarViewA11y') },
            ]}
          />
        </View>

        {view === 'grid' ? (
          <ChallengePhotoMosaicSkeleton
            width={width}
            photos={data.photos}
            totalDays={data.totalDays}
            onPressPhoto={openPhotoGallery}
          />
        ) : (
          <ChallengeWorkoutCalendar
            startDate={data.startDate}
            totalDays={data.totalDays}
            currentDay={data.currentDay}
            photoDays={data.photoDays}
            isRestDayFn={data.isDayRestDay}
            selectedDay={selectedDay}
            onPressDay={openDayGallery}
            accentColor={getChallengeAccentColor(data.dominantActivityCategory)}
          />
        )}
      </ScrollView>

      <ChallengePhotoGalleryModal
        visible={galleryVisible}
        photos={data.photos}
        selectedPhotoId={selectedPhotoId}
        selectedDay={selectedDay}
        onClose={closeGallery}
      />

      <leavePopup.Component />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  consistencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});
