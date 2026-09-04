// AuthScreenShell: Full-screen layout wrapper shared by all auth screens (login, signup, etc.).
// Provides the activity background with gradient glow, a centered title/subtitle block,
// a card container for the form content, and an optional footer slot.
export * from './auth-screen-shell';

// AuthSwitchRow: Inline prompt for switching between auth modes (e.g., "Don't have an account? Sign up").
// Renders a short text label next to a tappable link that navigates to the alternate auth screen.
export * from './auth-switch-row';

// AuthInput / AuthFormField: the auth-screen input variant (recessed `ink`
// fill, `primary` focus border) and its label-less field + inline error
// wrapper, used by login/register.
export * from './auth-input';
export * from './auth-form-field';
