# CHANGES

## Purpose

A changelog of meaningful changes to `frontend/`, newest first.

## When to read

At the start of any task, right after MAP.

## Keep updated

- After every meaningful change, append an entry at the top.

## Changelog

### 2026-07-07
- **Changed:** adapted the `app-builder`/`app-builder-frontend` skills (copied in from a different project, "Klyro") to Havit's real stack, and bootstrapped this `docs/ai/` tree with real content for the first time.
- **Reason:** the copied skills assumed Next.js + shadcn/Radix + TanStack Query + react-hook-form/zod + an 8-language i18n setup and a multi-tenant business/branch context — none of which exist in this Expo/React Native codebase. Left as-is, they would have pushed future sessions toward inventing libraries/patterns that don't belong here.
- **Impact:** `docs/ai/frontend/FORMS-GUIDE.md`, `API-CLIENT-GUIDE.md`, `DESIGN-SYSTEM.md`, etc. now describe the actual (library-free forms, single Axios client, no query cache, two-language i18n) patterns.

> This changelog must reflect real changes to the codebase, not assumptions.
