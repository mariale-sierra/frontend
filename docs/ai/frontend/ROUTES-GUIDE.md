# ROUTES-GUIDE

## Purpose

Document the Expo Router structure. See `../../ARCHITECTURE-GUIDE.md` §5 ("Routing Architecture") and §12 for the fuller version.

## When to read

Before adding/changing a route or navigation.

## Keep updated

- When routes, route groups, or layouts are added/moved/removed (mirror in `../../ARCHITECTURE-GUIDE.md` too).

## Route groups

- `(auth)` — unauthenticated flows: login, register, recover-password, onboarding.
- `(tabs)` — the 5 bottom tabs: index (home), search, add (intercepts tap → pushes `/(add)/metrics`), challenges, profile.
- `(add)` — presented as a full-screen modal: metrics, camera, preview, rest-day, plan-rest-days.

## Layouts & boundaries

- `app/_layout.tsx` — root: wraps in `ThemeProvider`/`AuthProvider`, restores auth session, redirects unauthenticated users to `/(auth)/login`, registers stack screens.
- `app/index.tsx` — redirects to `/(auth)/login` or `/(tabs)` based on auth state.
- `app/+not-found.tsx` — 404 route.
- `app/notifications.tsx` — registered with `presentation: 'modal'`.
- Dynamic routes: `app/challenge/[id]/index.tsx`, `app/challenge/[id]/info.tsx`, `app/challenge/[id]/routine/[day].tsx`, `app/profile/[username].tsx`, `app/messaging/[conversationId].tsx`.

## Navigation conventions

New screens go in the matching existing route group (tab-level → `(tabs)`, add-flow → `(add)`, challenge → `challenge/`) — don't create a new top-level group for something that fits an existing one.

> Must reflect the real current routes, not assumptions.
