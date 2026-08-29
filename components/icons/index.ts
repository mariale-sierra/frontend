// ActivityIcon: Renders an Ionicon mapped to a given activity type (strength, cardioIntense,
// flexibility, cardioLow, mindBody, functional). Supports two variants: plain (icon only)
// and circle (icon inside a color-filled circle).
export * from './activityIcon';

// LocationIcon: Maps location types (home, outdoor, gym, studio, anywhere) to Ionicons
// displayed inside color-coded circles, matching the app's activity color palette.
export * from './locationIcon';

// RestDayIcon: Non-pressable display icon for rest day state. Shares size keys (sm/md/lg)
// with ActivityIcon so both can be swapped at the same size slot.
export * from './restDayIcon';
