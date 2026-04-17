// MOCK mapping used by challenge creation filters during offline design.
// Backend team: categories should come from DB/API with canonical activityType values.
// Frontend should eventually consume those values directly and remove this static map.

import type { ActivityType } from './theme';

export const CATEGORY_TO_ACTIVITY: Record<string, ActivityType> = {
  Strength: 'strength',
  'Cardio Intense': 'cardioIntense',
  'Cardio Low': 'cardioLow',
  Flexibility: 'flexibility',
  'Mind-Body': 'mindBody',
  Functional: 'functional',
};
