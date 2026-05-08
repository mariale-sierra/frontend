// ActivityBackground: Full-screen dark backdrop with purple and cyan gradient glows
// at the top and bottom corners for decorative ambient lighting.
export * from './activityBackground';

// ActivityScrollGradient: Gradient overlay layered on top of scrollable content,
// tinted by the current activity type color to create a hero gradient bleed effect.
export * from './activityScrollGradient';

// Column: Flexbox column wrapper with justify, align, gap, and padding props.
// Optionally wraps its children in a Pressable for tappable column layouts.
export * from './column';

// GradientBox: expo-linear-gradient wrapper with type-safe color pairs, a default
// diagonal direction (top-left to bottom-right), and built-in shadow styling.
export * from './gradient-box';

// IconStack: Overlaps multiple icon children using z-index layering.
// Defaults to a maximum of 3 visible items; useful for stacked avatar/icon groups.
export * from './iconStack';

// Row: Flexbox row wrapper with justify, align, gap, and padding props.
// Optionally wraps its children in a Pressable for tappable row layouts.
export * from './row';

// ScreenBackground: Full-screen background with named variants (default, top, activity, challenges)
// that apply different combinations of gradient overlays and bloom glow effects.
export * from './screenBackground';

// Spacer: Invisible element that adds fixed or flexible empty space between siblings.
export * from './spacer';

// Stack: Generic vertical flex container with gap, align, and justify props.
// Lighter than Column — no pressable support, intended for simple stacking of children.
export * from './stack';
