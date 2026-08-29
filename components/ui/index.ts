// BackButton: Reusable chevron back button that calls router.back(). Accepts optional color and size.
export * from './backButton';

// Button: Multi-variant pressable button (primary, activity, outline, danger) with sm/md/lg sizes,
// a loading state spinner, and an optional right-side icon slot.
export * from './button';

// Card: General-purpose container with surface variants (basic, basicGlass, activityOutline,
// activityOutlineGlow), optional press handling, and configurable padding and border radius.
export * from './card';

// Divider: Thin horizontal separator line with default and section variants
// and configurable top/bottom margins.
export * from './divider';

// Dropdown: Multi-select dropdown with labeled options, optional icons per option,
// a maximum selection limit, and a customizable header label.
export * from './dropdown';

// Icon: Thin wrapper around Ionicons with size and color props.
// Defaults to the theme's primary text color when no color is provided.
export * from './icon';

// IconButton: Pressable icon with size variants and surface/ghost style variants.
// Supports a custom icon color and applies opacity feedback on press.
export * from './iconButton';

// Input: Text input with an optional label, default/filled variant styles, left and right icon slots,
// multiline support, and a character counter shown when maxLength is set.
export * from './input';

// Loader: Conditional activity indicator overlay rendered on top of screen content.
// Only mounts when the `visible` prop is true.
export * from './loader';

// Text: Core typography component with variants (title, subheader, header, body, caption, label, activity),
// tone options (primary, secondary, tertiary, inverse — opacity tiers, not activity-type colors),
// alignment control, and an `inverse` flag for text on light/lime surfaces.
export * from './text';

// ErrorNotification: Toast-style error notification that slides in from the top with an auto-dismiss timer,
// optional action button, and manual close button. Used with useErrorNotificationStore for global error handling.
export * from './errorNotification';

// ErrorNotificationProvider: Provider component that wraps your app root to enable error notifications
// throughout your application. Add this to your root layout (_layout.tsx).
export * from './ErrorNotificationProvider';

// UserAvatar: Circular avatar showing the user's photo, or their first initial on a neutral
// (paper @ 20%) placeholder fill when no photo is set.
export * from './userAvatar';

// PhotoDetailCard: One photo in a vertical detail feed — header row (avatar/
// username/day), photo, caption, metrics table. Mirrors FeedPostCard's
// header-row-above-the-photo structure rather than overlaying text on the
// image. Used in ChallengePhotoGalleryModal and ProfilePhotoModal.
export * from './photoDetailCard';
