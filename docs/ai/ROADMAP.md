# ROADMAP

## Purpose

What is planned but not yet built, and roughly in what order.

## When to read

When planning a new feature or deciding how far a change should go.

## Keep updated

- When a planned item is started (move it to CURRENT-STATE) or completed.
- When priorities change or new items are planned.

## Now / Next / Later

No formally tracked sprint/priority order exists for this repo. Treat the items below as backlog inferred from `CURRENT-STATE.md`'s gaps, not a committed order — confirm priority before starting large work.

### Next
- Replace the remaining mock data in the challenge area (`app/(tabs)/challenges.tsx`, `app/challenge/[id]/routine/[day].tsx`, `app/challenge/create.tsx`, `store/routineBuilderStore.ts`) with real backend-driven data, once the backend exposes the missing reference endpoints.
- Move the Axios base URL out of the hardcoded string in `services/api.ts` into env/config.

### Later
- Messaging UI (`app/messaging/`, `components/messaging/`) — blocked on the backend `spaces`/`direct_conversations` modules not existing yet.
- Notifications UI (`app/notifications.tsx`, `components/notifications/`) — blocked on the backend `notifications` module not existing yet.
- Social feed / likes UI (`components/social/`) — blocked on backend `user_follows`/`workout_post_likes` modules.
- A shared skeleton-loading component, if multiple screens converge on the same loading layout (libraries are already installed: `react-native-shimmer-placeholder`, `@shopify/react-native-skia`).

## Out of scope

- A form library (react-hook-form/zod/formik) or a query-cache library (TanStack Query) — not planned; the existing local-state + service pattern is intentional.
- Multi-tenant/business-branch context — not a fit for this single-tenant consumer app.

> This document must reflect the real current plan, not assumptions.
