import { useEffect, useMemo, useState } from 'react';
import { useChallengeProgress } from './useChallengeProgress';
import { useChallengeParticipants } from './useChallengeParticipants';
import { getChallenge, getMyProgressPhotos } from '../services/challenge/challenge.service';
import { deriveChallengeCardState, pickChallengeStatus, pickDominantActivityCategory, getChallengeAccentColor } from '../services/adapters/challengeState';
import type { ChallengeCardState } from '../services/adapters/challengeState';
import { buildRingTicks, computeConsistencyPercents, dayInCycle, findCycleDayFor, isRestDay } from '../utils/challengeCycle';
import { colors } from '../constants/theme';
import { withAlpha } from '../utils/color';
import type { ActivityType } from '../types/activity';
import type { ChallengeContract, ChallengePhoto } from '../types/challenge';

interface Participant {
  id: string;
  name: string;
}

export interface ChallengeActiveProgressData {
  challengeId: string | null;
  loading: boolean;
  state: ChallengeCardState;
  currentDay: number;
  totalDays: number;
  title: string;
  participants: Participant[];
  participantsLabel: string;
  startDate: Date;
  /** This user's own photos for this specific challenge — see the
   * "Consistency" section, which is a personal per-day view, not the
   * challenge-wide public gallery (that stays on GET /workout-posts/challenge/:id,
   * used by the separate photo-gallery modal). */
  photos: ChallengePhoto[];
  photoDays: number[];
  /** One resolved color per day 1..totalDays, for ChallengeProgressRing. */
  ticks: string[];
  /** Real routine name for today (from the challenge's cycle_days), or null on a rest day. */
  todayRoutineName: string | null;
  isTodayRestDay: boolean;
  /** Activity Color System v2 — this challenge's own dominant activity
   * category (`null` if it has none yet). Consumers resolve the actual
   * color they need via `challengeState.ts`'s `getChallengeAccentColor()`
   * (the eyebrow, Today's-routine banner, segmented-toggle active state) or
   * `getChallengeCardColor()` (anything state-gated). NOT used for the
   * ring's photo-arc/legend or the calendar's "photo in" marker — those use
   * the fixed `success` color instead (a per-day photo-logged indicator
   * needs to stay meaningful even when this is null/white, not fade into
   * "looks unstyled"). See havit-design-system-SKILL.md → Activity Color
   * System v2. */
  dominantActivityCategory: ActivityType | null;
  /** Today's 1-indexed position within the challenge's cycle — the routine-detail
   * route (app/challenge/[id]/routine/[day].tsx) is keyed by this, not the absolute challenge day. */
  currentDayInCycle: number;
  /** Deterministic rest-day check for ANY day in the challenge — the calendar needs this per-cell, not just for today. */
  isDayRestDay: (challengeDay: number) => boolean;
}

const RING_TRACK_COLOR = withAlpha(colors.paper, 0.12);
// Fixed regardless of totalDays — see buildRingTicks's doc comment. A 10-day
// and a 75-day challenge render the same dense, evenly-spaced dial; only the
// filled proportion changes.
const RING_SEGMENT_COUNT = 60;

/**
 * Data-fetching for the challenge active-progress screen. Combines:
 * - `useChallengeProgress` (cached GET /challenges/progress) for currentDay/totalDays/title.
 * - `getChallenge(id)` for `cycle_length_days`/`cycle_days`/`status` — the
 *   Consistency ring, the calendar's rest-day dots, and the Today's-routine
 *   banner are all derived from this, deterministically, with no backend gap
 *   (a day's cycle position is pure math — see utils/challengeCycle.ts —
 *   unlike the old `completedWorkoutDays: []` placeholder this replaces).
 * - `getMyProgressPhotos()` filtered to this challenge — this user's own
 *   photos, not the challenge-wide gallery (see the doc comment above).
 */
export function useChallengeActiveProgress(routeChallengeId: string | null): ChallengeActiveProgressData {
  const { challenge: backendChallenge, loading: progressLoading } = useChallengeProgress(routeChallengeId);
  const challengeId = routeChallengeId ?? backendChallenge?.challengeId ?? null;

  const { participants: members, loading: participantsLoading } = useChallengeParticipants(challengeId);

  const [fullChallenge, setFullChallenge] = useState<ChallengeContract | null>(null);
  const [myPhotos, setMyPhotos] = useState<ChallengePhoto[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) {
      setFullChallenge(null);
      setMyPhotos([]);
      setExtrasLoading(false);
      return;
    }

    let cancelled = false;
    setExtrasLoading(true);

    Promise.all([getChallenge(challengeId), getMyProgressPhotos()])
      .then(([challengeData, allMyPhotos]) => {
        if (cancelled) return;
        setFullChallenge(challengeData);
        setMyPhotos(allMyPhotos.filter((photo) => photo.challengeId === challengeId));
      })
      .catch(() => {
        if (cancelled) return;
        setFullChallenge(null);
        setMyPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setExtrasLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  const currentDay = backendChallenge?.currentDay ?? 1;
  const totalDays = backendChallenge?.totalDays ?? 0;
  const cycleLengthDays = fullChallenge?.cycle_length_days ?? totalDays;
  const cycleDays = useMemo(() => fullChallenge?.cycle_days ?? [], [fullChallenge]);

  const startDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const derived = new Date(today);
    derived.setDate(today.getDate() - (currentDay - 1));
    return derived;
  }, [currentDay]);

  const photoDays = useMemo(() => Array.from(new Set(myPhotos.map((photo) => photo.day))), [myPhotos]);
  const photoDaySet = useMemo(() => new Set(photoDays), [photoDays]);

  const isDayRestDay = useMemo(
    () => (challengeDay: number) => isRestDay(challengeDay, cycleLengthDays, cycleDays),
    [cycleLengthDays, cycleDays],
  );

  const state = useMemo<ChallengeCardState>(() => {
    if (!fullChallenge) return 'active';
    const latestPhotoDay = myPhotos[0]?.day ?? null;
    return deriveChallengeCardState({
      status: pickChallengeStatus(fullChallenge),
      isRestDay: isDayRestDay(currentDay),
      currentDay,
      latestPhotoDay,
    });
  }, [fullChallenge, myPhotos, isDayRestDay, currentDay]);

  const { photoPercent, restPercent } = useMemo(
    () => computeConsistencyPercents({ totalDays, cycleLengthDays, cycleDays, photoDays: photoDaySet }),
    [totalDays, cycleLengthDays, cycleDays, photoDaySet],
  );

  const dominantActivityCategory = useMemo(
    () => (fullChallenge ? pickDominantActivityCategory(fullChallenge) : null),
    [fullChallenge],
  );

  const ticks = useMemo(
    () =>
      buildRingTicks({
        segmentCount: RING_SEGMENT_COUNT,
        photoPercent,
        restPercent,
        // The ring's "Photo days" arc IS the activity color — distinct from
        // the calendar's "Photo in" dots, which stay fixed `success` (see
        // ChallengeWorkoutCalendar.tsx). Per explicit correction: these are
        // two different indicators, not the same rule applied twice.
        photoColor: getChallengeAccentColor(dominantActivityCategory),
        restColor: colors.rest,
        trackColor: RING_TRACK_COLOR,
      }),
    [photoPercent, restPercent, dominantActivityCategory],
  );

  const todayCycleDay = fullChallenge ? findCycleDayFor(currentDay, cycleLengthDays, cycleDays) : null;
  const isTodayRestDay = isDayRestDay(currentDay);
  const todayRoutineName = !isTodayRestDay && todayCycleDay?.routine_name ? todayCycleDay.routine_name : null;
  const currentDayInCycle = dayInCycle(currentDay, cycleLengthDays);

  const participants = useMemo(
    () => members.map((member): Participant => ({ id: member.id, name: member.username })),
    [members],
  );
  const participantsLabel = useMemo(
    () => members.map((member) => member.username).join(', '),
    [members],
  );

  return {
    challengeId,
    loading: progressLoading || participantsLoading || extrasLoading,
    state,
    currentDay,
    totalDays,
    title: backendChallenge?.title ?? '',
    participants,
    participantsLabel,
    startDate,
    photos: myPhotos,
    photoDays,
    ticks,
    todayRoutineName,
    isTodayRestDay,
    dominantActivityCategory,
    currentDayInCycle,
    isDayRestDay,
  };
}

