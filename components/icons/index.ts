// ActivityIcon: Renders an Ionicon mapped to a given activity type (strength, cardioIntense,
// flexibility, cardioLow, mindBody, functional). Supports two variants: plain (icon only)
// and circle (icon inside a color-filled circle).
export * from './activityIcon';

// AvatarIcon: Circular user avatar placeholder displayed as an icon button with a person silhouette.
// Available in three sizes: sm, md, and lg.
export * from './avatarIcon';

// LocationIcon: Maps location types (home, outdoor, gym, studio, anywhere) to Ionicons
// displayed inside color-coded circles, matching the app's activity color palette.
export * from './locationIcon';

// RestDayIconButton: Pressable icon button used to mark a workout day as a rest day.
// Renders a moon icon and is styled to match the app's icon button conventions.
export * from './restDayIconButton';

// RestDayIcon: Non-pressable display icon for rest day state. Shares size keys (sm/md/lg)
// with ActivityIcon so both can be swapped at the same size slot.
export * from './restDayIcon';
