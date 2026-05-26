import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChallengeProgress } from '../../../hooks/useChallengeProgress';
import { usePublicChallengePhotos } from '../../../hooks/usePublicChallengePhotos';
import ScreenBackground from '../../layout/screenBackground';
import { ChallengeProgressHeader } from './ChallengeProgressHeader';
import { ChallengePhotoGalleryModal } from './ChallengePhotoGalleryModal';
import { ChallengePhotoMosaicSkeleton } from './ChallengePhotoMosaicSkeleton';
import { ChallengeWorkoutCalendar } from './ChallengeWorkoutCalendar';
import { spacing } from '../../../constants/theme';
import { hoursUntilMidnight } from '../../../utils/time';
import { getMockPublicPhotosForChallenge } from '../../../services/mocks/publicChallengePhotos';

const mockChallenge = {
  id: 'mock-active-challenge-1',
  progress: 72,
  totalDays: 75,
  title: 'SEVENTY-FIVE HARD CHALLENGE',
  timeLeft: '8h left',
  participantsLabel: 'Cami, To',
  participants: [
    { id: '1', name: 'Cami', color: '#D9D9D9' },
    { id: '2', name: 'To', color: '#F472D0' },
    { id: '3', name: 'Alex', color: '#67E8F9' },
    { id: '4', name: 'Sam', color: '#A3A3A3' },
  ],
  // Day 1 = March 15, 2026 → day 72 lands on May 25, 2026 (today)
  startDate: new Date(2026, 2, 15),
  completedWorkoutDays: Array.from({ length: 71 }, (_, i) => i + 1),
};

export function ChallengeActiveProgressScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { challenge: backendChallenge } = useChallengeProgress();
  const [activePage, setActivePage] = useState(0);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const challengeId = typeof id === 'string' && id.length > 0 ? id : mockChallenge.id;
  const { photos: livePhotos } = usePublicChallengePhotos(challengeId);
  const publicPhotos = livePhotos.length > 0 ? livePhotos : getMockPublicPhotosForChallenge(challengeId);
  const photoDays = useMemo(
    () => Array.from(new Set(publicPhotos.map((photo) => photo.day))),
    [publicPhotos],
  );
  const progressChallenge = backendChallenge?.challengeId === challengeId
    ? backendChallenge
    : backendChallenge ?? null;
  const headerProgress = progressChallenge?.currentDay ?? mockChallenge.progress;
  const headerTotalDays = progressChallenge?.totalDays ?? mockChallenge.totalDays;
  const headerTitle = progressChallenge?.title?.toUpperCase() ?? mockChallenge.title;
  const headerTimeLeft = `${hoursUntilMidnight()}h left`;
  const galleryVisible = selectedPhotoId != null || selectedDay != null;

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x;
    setActivePage(Math.round(offsetX / width));
  }

  function handlePressInfo() {
    router.push(`/challenge/${challengeId}`);
  }

  function openPhotoGallery(photoId: string) {
    const photo = publicPhotos.find((item) => item.id === photoId);
    setSelectedPhotoId(photoId);
    setSelectedDay(photo?.day ?? null);
  }

  function openDayGallery(day: number) {
    const dayPhoto = publicPhotos.find((photo) => photo.day === day);
    if (!dayPhoto) return;
    setSelectedPhotoId(dayPhoto.id);
    setSelectedDay(day);
  }

  function closeGallery() {
    setSelectedPhotoId(null);
    setSelectedDay(null);
  }

  return (
    <ScreenBackground variant="challenges" applyTopInset={false} contentStyle={{ paddingTop: Math.max(insets.top, 0) }}>
      <ChallengeProgressHeader
        progress={headerProgress}
        totalDays={headerTotalDays}
        title={headerTitle}
        timeLeft={progressChallenge && hoursUntilMidnight() > 0 ? headerTimeLeft : mockChallenge.timeLeft}
        participantsLabel={mockChallenge.participantsLabel}
        participants={mockChallenge.participants}
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
            photos={publicPhotos}
            totalDays={headerTotalDays}
            bottomInset={insets.bottom}
            onPressPhoto={openPhotoGallery}
          />
          <ChallengeWorkoutCalendar
            width={width}
            startDate={mockChallenge.startDate}
            totalDays={headerTotalDays}
            completedWorkoutDays={mockChallenge.completedWorkoutDays}
            selectedDay={selectedDay}
            photoDays={photoDays}
            bottomInset={insets.bottom}
            onPressDay={openDayGallery}
          />
        </ScrollView>
      </View>

      <ChallengePhotoGalleryModal
        visible={galleryVisible}
        photos={publicPhotos}
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
});
