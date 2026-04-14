import { create } from 'zustand';

interface ChallengeBuilderState {
  selectedCategories: string[];
  selectedLocations: string[];
  setSelectedCategories: (values: string[]) => void;
  setSelectedLocations: (values: string[]) => void;
}

export const useChallengeBuilder = create<ChallengeBuilderState>((set) => ({
  selectedCategories: [],
  selectedLocations: [],
  setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
  setSelectedLocations: (selectedLocations) => set({ selectedLocations }),
}));