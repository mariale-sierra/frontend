import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useChallengeProgress } from './useChallengeProgress';
import { useChallengeParticipants } from './useChallengeParticipants';
import { usePublicChallengePhotos } from './usePublicChallengePhotos';
import { hoursUntilMidnight } from '../utils/time';
import type { ChallengePhoto } from '../types/challenge';

interface Participant {
  id: string;
  name: string;
}

export interface ChallengeActiveProgressData {
  challengeId: string | null;
  loading: boolean;
  progress: number;
  totalDays: number;
  title: string;
  timeLeft: string;
  participants: Participant[];
  participantsLabel: string;
  startDate: Date;
  completedWorkoutDays: number[];
  photos: ChallengePhoto[];
  photoDays: number[];
}

/**
 * Data-fetching for the challenge active-progress screen, kept out of the presentational
 * component (`ChallengeActiveProgressScreen`). Sources real data from `useChallengeProgress`
 * (the cached `GET /challenges/progress` result), `useChallengeParticipants`
 * (`GET /challenges/{id}/users`) and `usePublicChallengePhotos`.
 *
 * Known backend gap (tracked, not faked here): `GET /challenges/progress` does not expose a
 * per-day completion array, so `completedWorkoutDays` is an honest empty default rather than
 * mock data. `startDate` is derived from today's date and `currentDay` (same approach as
 * `app/(add)/plan-rest-days.tsx`) since the backend doesn't return the challenge's actual
 * start date either.
 */
export function useChallengeActiveProgress(routeChallengeId: string | null): ChallengeActiveProgressData {
  const { t } = useTranslation();
  const { challenge: backendChallenge, loading: progressLoading } = useChallengeProgress(routeChallengeId);

  const challengeId = routeChallengeId ?? backendChallenge?.challengeId ?? null;

  const { photos, loading: photosLoading } = usePublicChallengePhotos(challengeId);
  const { participants: members, loading: participantsLoading } = useChallengeParticipants(challengeId);

  const photoDays = useMemo(
    () => Array.from(new Set(photos.map((photo) => photo.day))),
    [photos],
  );

  const participants = useMemo(
    () => members.map((member): Participant => ({ id: member.id, name: member.username })),
    [members],
  );
  const participantsLabel = useMemo(
    () => members.map((member) => member.username).join(', '),
    [members],
  );

  const startDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDay = backendChallenge?.currentDay ?? 1;
    const derived = new Date(today);
    derived.setDate(today.getDate() - (currentDay - 1));
    return derived;
  }, [backendChallenge?.currentDay]);

  return {
    challengeId,
    loading: progressLoading || photosLoading || participantsLoading,
    progress: backendChallenge?.currentDay ?? 0,
    totalDays: backendChallenge?.totalDays ?? 0,
    title: backendChallenge?.title?.toUpperCase() ?? '',
    timeLeft: t('home.hoursLeft', { hours: hoursUntilMidnight() }),
    participants,
    participantsLabel,
    startDate,
    completedWorkoutDays: [],
    photos,
    photoDays,
  };
}
