import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../constants/theme';
import { useChallengeActiveProgress } from '../../../hooks/useChallengeActiveProgress';
import ScreenBackground from '../../layout/screenBackground';
import { ChallengeProgressHeader } from './ChallengeProgressHeader';
import { ChallengePhotoGalleryModal } from './ChallengePhotoGalleryModal';
import { ChallengePhotoMosaicSkeleton } from './ChallengePhotoMosaicSkeleton';
import { ChallengeWorkoutCalendar } from './ChallengeWorkoutCalendar';
import { spacing } from '../../../constants/theme';

export function ChallengeActiveProgressScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routeChallengeId = typeof id === 'string' && id.length > 0 ? id : null;

  const data = useChallengeActiveProgress(routeChallengeId);
  const [activePage, setActivePage] = useState(0);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const galleryVisible = selectedPhotoId != null || selectedDay != null;

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x;
    setActivePage(Math.round(offsetX / width));
  }

  function handlePressInfo() {
    if (data.challengeId) {
      router.push(`/challenge/${data.challengeId}`);
    }
  }

  function openPhotoGallery(photoId: string) {
    // Mosaic shows every photo across the challenge, so opening one from here
    // should browse the full feed — leave selectedDay unset (that filter is
    // only for the calendar's per-day dots).
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
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="challenges" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ChallengeProgressHeader
        progress={data.progress}
        totalDays={data.totalDays}
        title={data.title}
        timeLeft={data.timeLeft}
        participantsLabel={data.participantsLabel}
        participants={data.participants}
        activePage={activePage}
        onPressInfo={handlePressInfo}
      />

      <View style={styles.pagerWrap}>
        <ScrollView
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          <ChallengePhotoMosaicSkeleton
            width={width}
            photos={data.photos}
            totalDays={data.totalDays}
            bottomInset={insets.bottom}
            onPressPhoto={openPhotoGallery}
          />
          <ChallengeWorkoutCalendar
            width={width}
            startDate={data.startDate}
            totalDays={data.totalDays}
            completedWorkoutDays={data.completedWorkoutDays}
            selectedDay={selectedDay}
            photoDays={data.photoDays}
            bottomInset={insets.bottom}
            onPressDay={openDayGallery}
          />
        </ScrollView>
      </View>

      <ChallengePhotoGalleryModal
        visible={galleryVisible}
        photos={data.photos}
        selectedPhotoId={selectedPhotoId}
        selectedDay={selectedDay}
        onClose={closeGallery}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  pagerWrap: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
