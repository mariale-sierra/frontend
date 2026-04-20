import { create } from 'zustand';

export type ChallengeVisibility = 'Public' | 'Private';

interface ChallengeBuilderState {
  title: string;
  description: string;
  cycleDuration: number;
  challengeDuration: number | null;
  visibility: ChallengeVisibility | null;
  currentStep: number;
  selectedCategories: string[];
  selectedLocations: string[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setCycleDuration: (value: number) => void;
  setChallengeDuration: (value: number | null) => void;
  setVisibility: (value: ChallengeVisibility | null) => void;
  setCurrentStep: (value: number) => void;
  setSelectedCategories: (values: string[]) => void;
  setSelectedLocations: (values: string[]) => void;
  resetChallengeBuilder: () => void;
}

export const useChallengeBuilder = create<ChallengeBuilderState>((set) => ({
  title: '',
  description: '',
  cycleDuration: 3,
  challengeDuration: null,
  visibility: null,
  currentStep: 0,
  selectedCategories: [],
  selectedLocations: [],
  setTitle: (title) => set({ title }),
  setDescription: (description) => set({ description }),
  setCycleDuration: (cycleDuration) => set({ cycleDuration: Math.max(1, cycleDuration) }),
  setChallengeDuration: (challengeDuration) => set({ challengeDuration }),
  setVisibility: (visibility) => set({ visibility }),
  setCurrentStep: (currentStep) => set({ currentStep: Math.max(0, currentStep) }),
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setSelectedLocations: (selectedLocations) => set({ selectedLocations }),
  resetChallengeBuilder: () => set({
    title: '',
    description: '',
    cycleDuration: 3,
    challengeDuration: null,
    visibility: null,
    currentStep: 0,
    selectedCategories: [],
    selectedLocations: [],
  }),
}));