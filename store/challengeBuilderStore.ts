import { create } from 'zustand';
import type { ChallengeVisibility } from '../types/challenge';

interface ChallengeBuilderState {
  title: string;
  description: string;
  // Number of day-rows in "Build the cycle" — driven directly by the
  // wireframe's Add day / × controls, not a separate numeric stepper step.
  cycleLengthDays: number;
  // The wireframe's "Repeats" stepper: how many times the cycle runs.
  // durationDays = cycleLengthDays * cyclesCount (see useCreateChallengeFlow).
  cyclesCount: number;
  visibility: ChallengeVisibility | null;
  currentStep: number;
  selectedCategories: string[];
  selectedLocations: string[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  addCycleDay: () => void;
  removeCycleDay: () => void;
  setCyclesCount: (value: number) => void;
  setVisibility: (value: ChallengeVisibility | null) => void;
  setCurrentStep: (value: number) => void;
  setSelectedCategories: (values: string[]) => void;
  setSelectedLocations: (values: string[]) => void;
  resetChallengeBuilder: () => void;
}

const DEFAULT_CYCLE_LENGTH_DAYS = 4;
const DEFAULT_CYCLES_COUNT = 1;

export const useChallengeBuilder = create<ChallengeBuilderState>((set) => ({
  title: '',
  description: '',
  cycleLengthDays: DEFAULT_CYCLE_LENGTH_DAYS,
  cyclesCount: DEFAULT_CYCLES_COUNT,
  visibility: null,
  currentStep: 0,
  selectedCategories: [],
  selectedLocations: [],
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  addCycleDay: () => set((state) => ({ cycleLengthDays: state.cycleLengthDays + 1 })),
  removeCycleDay: () => set((state) => ({ cycleLengthDays: Math.max(1, state.cycleLengthDays - 1) })),
  setCyclesCount: (cyclesCount) => set({ cyclesCount: Math.max(1, cyclesCount) }),
  setVisibility: (visibility) => set({ visibility }),
  setCurrentStep: (currentStep) => set({ currentStep: Math.max(0, currentStep) }),
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setSelectedLocations: (selectedLocations) => set({ selectedLocations }),
  resetChallengeBuilder: () => set({
    title: '',
    description: '',
    cycleLengthDays: DEFAULT_CYCLE_LENGTH_DAYS,
    cyclesCount: DEFAULT_CYCLES_COUNT,
    visibility: null,
    currentStep: 0,
    selectedCategories: [],
    selectedLocations: [],
  }),
}));
