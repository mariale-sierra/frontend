// MOCK ONLY: category and location option lists should come from backend/database.
// Backend team: send these as reference data so challenge setup is fully server-driven.
import type { ActivityType } from '../types/activity';
import type { LocationType } from '../components/icons/locationIcon';

export interface ChallengeCategoryOption {
  label: string;
  value: string;
  type: ActivityType;
  description: string;
}

export interface ChallengeLocationOption {
  label: string;
  value: string;
  type: LocationType;
  description: string;
}

export const CATEGORY_OPTIONS: ChallengeCategoryOption[] = [
  { label: 'Strength', value: 'Strength', type: 'strength', description: 'Load-based training focused on force, power, and muscular growth.' },
  { label: 'Cardio intense', value: 'Cardio Intense', type: 'cardioIntense', description: 'High-effort endurance work that elevates heart rate fast.' },
  { label: 'Cardio low', value: 'Cardio Low', type: 'cardioLow', description: 'Lower-impact aerobic work built for consistency and recovery.' },
  { label: 'Flexibility', value: 'Flexibility', type: 'flexibility', description: 'Mobility and range-of-motion sessions to improve movement quality.' },
  { label: 'Mind body', value: 'Mind-Body', type: 'mindBody', description: 'Practices that blend control, breath, and awareness with training.' },
  { label: 'Functional', value: 'Functional', type: 'functional', description: 'Full-body patterns that transfer to everyday movement and sport.' },
];

export const LOCATION_OPTIONS: ChallengeLocationOption[] = [
  { label: 'Gym', value: 'Gym', type: 'gym', description: 'Equipment-first sessions built around machines, weights, or racks.' },
  { label: 'Home', value: 'Home', type: 'home', description: 'Minimal-space training designed for home routines and convenience.' },
  { label: 'Outdoor', value: 'Outdoor', type: 'outdoor', description: 'Running, field work, or open-air movement with more space.' },
  { label: 'Studio', value: 'Studio', type: 'studio', description: 'Class-like sessions for guided formats such as yoga or pilates.' },
  { label: 'Anywhere', value: 'Anywhere', type: 'anywhere', description: 'Flexible setups that can be completed in almost any environment.' },
];

export const VISIBILITY_OPTIONS: string[] = ['Public', 'Private'];
