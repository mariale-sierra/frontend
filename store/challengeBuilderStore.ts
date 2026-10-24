import { create } from 'zustand';
import type { ChallengeVisibility } from '../types/challenge';

interface ChallengeBuilderState {
  title: string;
  description: string;
  // How many days the cycle has before it starts again — set by the "Cycle &
  // length" stepper (53A) and by the day list's Add day / × controls (53B).
  cycleLengthDays: number;
  // The challenge's total length in days ("Challenge length", 53A). It does
  // NOT have to be a multiple of the cycle: the last cycle can be cut short
  // ("N full cycles + R days") — the backend maps each day onto the cycle with
  // ((day - 1) % cycleLength) + 1. Never shorter than the cycle (the backend
  // rejects cycle_length_days > duration_days).
  durationDays: number;
  visibility: ChallengeVisibility | null;
  currentStep: number;
  selectedCategories: string[];
  selectedLocations: string[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setCycleLengthDays: (value: number) => void;
  addCycleDay: () => void;
  removeCycleDay: () => void;
  setDurationDays: (value: number) => void;
  setVisibility: (value: ChallengeVisibility | null) => void;
  setCurrentStep: (value: number) => void;
  setSelectedCategories: (values: string[]) => void;
  setSelectedLocations: (values: string[]) => void;
  resetChallengeBuilder: () => void;
}

export const MIN_CYCLE_LENGTH_DAYS = 1;
// Upper bounds for the steppers: a cycle is a few days to a few weeks, a
// challenge at most a year.
export const MAX_CYCLE_LENGTH_DAYS = 28;
export const MAX_DURATION_DAYS = 365;
const DEFAULT_CYCLE_LENGTH_DAYS = 4;
// 30 days: the "ideal first challenge" length the flow already recommends.
const DEFAULT_DURATION_DAYS = 30;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** A cycle length, and the challenge length stretched to fit it if needed. */
function withCycleLength(cycleLengthDays: number, durationDays: number) {
  const cycle = clamp(cycleLengthDays, MIN_CYCLE_LENGTH_DAYS, MAX_CYCLE_LENGTH_DAYS);
  return { cycleLengthDays: cycle, durationDays: Math.max(durationDays, cycle) };
}

export const useChallengeBuilder = create<ChallengeBuilderState>((set) => ({
  title: '',
  description: '',
  cycleLengthDays: DEFAULT_CYCLE_LENGTH_DAYS,
  durationDays: DEFAULT_DURATION_DAYS,
  visibility: null,
  currentStep: 0,
  selectedCategories: [],
  selectedLocations: [],
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setCycleLengthDays: (value) => set((state) => withCycleLength(value, state.durationDays)),
  addCycleDay: () => set((state) => withCycleLength(state.cycleLengthDays + 1, state.durationDays)),
  removeCycleDay: () => set((state) => withCycleLength(state.cycleLengthDays - 1, state.durationDays)),
  setDurationDays: (value) =>
    set((state) => ({ durationDays: clamp(value, state.cycleLengthDays, MAX_DURATION_DAYS) })),
  setVisibility: (visibility) => set({ visibility }),
  setCurrentStep: (currentStep) => set({ currentStep: Math.max(0, currentStep) }),
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setSelectedLocations: (selectedLocations) => set({ selectedLocations }),
  resetChallengeBuilder: () => set({
    title: '',
    description: '',
    cycleLengthDays: DEFAULT_CYCLE_LENGTH_DAYS,
    durationDays: DEFAULT_DURATION_DAYS,
    visibility: null,
    currentStep: 0,
    selectedCategories: [],
    selectedLocations: [],
  }),
}));
