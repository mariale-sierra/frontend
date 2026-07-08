# FRONTEND-ARCHITECTURE

## Purpose

How the frontend is layered. **Read [`../../ARCHITECTURE-GUIDE.md`](../../ARCHITECTURE-GUIDE.md) in full first** — it already covers stack, root folder map, routing, API integration, state/hooks/contexts, UI/component architecture, loading/empty/error states, feature rules, and the challenge module map in depth. This file only adds a couple of things that guide doesn't spell out.

## When to read

Before any non-trivial frontend change, after the general ARCHITECTURE.

## Keep updated

- Prefer updating `../../ARCHITECTURE-GUIDE.md` for anything structural; update this file only for the deltas below.

## Deltas not in `ARCHITECTURE-GUIDE.md`

- **No form library.** Forms use local component/hook state + Zustand builder stores + hand-written validation (see `docs/ai/frontend/FORMS-GUIDE.md`). `ARCHITECTURE-GUIDE.md` doesn't call this out explicitly as a *constraint* (only describes hooks/stores) — treat "don't add react-hook-form/zod" as a hard rule, not just an observation.
- **No query-cache library.** Data fetching is plain `async`/`await` inside services/hooks with local loading/error state — no TanStack Query, no SWR.
- **Two i18n languages, TypeScript not JSON.** `i18n/resources/en.ts`, `i18n/resources/es.ts`.
- **This repo is not a monorepo member with shared tooling** — it's an independent git repo; see root `CLAUDE.md`.

> Must reflect the real current frontend, not assumptions.
