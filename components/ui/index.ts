// ActivityBadge: Compact badge showing an activity type's icon and label inside a rounded container.
// Used to tag challenges, routines, and exercises with their activity category.
export * from './activityBadge';

// Button: Multi-variant pressable button (primary, activity, outline, danger) with sm/md/lg sizes,
// a loading state spinner, and an optional right-side icon slot.
export * from './button';

// Card: General-purpose container with surface variants (basic, basicGlass, activityOutline,
// activityOutlineGlow), optional press handling, and configurable padding and border radius.
export * from './card';

// Container: Flexible content container with named background variants (background, surface,
// surfaceElevated, surfaceHighlight), configurable padding, and a centering option.
export * from './container';

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
// tone options (default, muted, inverted), alignment control, and activity-type color support.
export * from './text';

// ErrorNotification: Toast-style error notification that slides in from the top with an auto-dismiss timer,
// optional action button, and manual close button. Used with useErrorNotificationStore for global error handling.
export * from './errorNotification';

// ErrorNotificationProvider: Provider component that wraps your app root to enable error notifications
// throughout your application. Add this to your root layout (_layout.tsx).
export * from './ErrorNotificationProvider';
