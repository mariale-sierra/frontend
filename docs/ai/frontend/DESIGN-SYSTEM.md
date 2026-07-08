# DESIGN-SYSTEM

## Purpose

Visual/interaction conventions. See `../../ARCHITECTURE-GUIDE.md` §9 ("UI and Component Architecture") for the fuller version.

## When to read

Before building or restyling any UI.

## Keep updated

- When theme tokens or layout conventions change.

## Tokens & theme

`constants/theme/{colors,spacing,radius,typography,shadows,gradients}.ts`, re-exported via `constants/theme/index.ts` and `constants/theme.ts`. Exposed at runtime via `context/themeContext.tsx`'s `useTheme()` (`hooks/useTheme.ts` is a thin wrapper). Use these tokens instead of hardcoded values; many screens still import tokens directly from `constants/theme` rather than going through `useTheme()` — either is acceptable, prefer `useTheme()` in reusable components that should react to theme changes.

## Component library usage

No third-party UI kit. Shared primitives are hand-built:
- `components/ui/`: `Text`, `Button`, `Card`, `Input`, `Icon`, `IconButton`, `Loader`, `Dropdown`, `SearchBar`, `Divider`, `ConfirmationPopup`, `ErrorNotification`, `UserAvatar`, `PhotoFrame`, etc.
- `components/layout/`: `ScreenBackground`, `Stack`, `Row`, `Column`, `Spacer`, `GradientBox`, `IconStack`, `ActivityBackground`, `ActivityScrollGradient`.
- Icons: `@expo/vector-icons` (Ionicons), wrapped via `components/icons/` and `components/ui/icon.tsx`/`iconButton.tsx`.

## Layout rules

- No horizontal overflow — use Flexbox layout primitives (`Stack`/`Row`/`Column`), not fixed pixel widths.
- Wrap screens in `ScreenBackground` and respect safe areas (`react-native-safe-area-context`), matching existing screens.
- Truncate/limit text that could overflow a card or row (`numberOfLines`/`ellipsizeMode`) rather than letting it wrap unpredictably.

> Must reflect the real current design system, not assumptions.
