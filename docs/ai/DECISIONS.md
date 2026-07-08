# DECISIONS

## Purpose

A lightweight decision log (ADR-style). Records *why* important technical choices were made so future sessions don't unknowingly reverse them.

## When to read

When a change touches an architectural choice, or you're tempted to "do it differently."

## Keep updated

- Whenever a non-trivial technical decision is made, add an entry.
- If a decision is reversed, add a new entry that supersedes the old one (don't delete history).

## Decisions

### 2026-07-07 — Point `docs/ai/` at `../ARCHITECTURE-GUIDE.md` instead of duplicating it
- **Context:** this repo already had a thorough, accurate `frontend/docs/ARCHITECTURE-GUIDE.md`. The `app-builder-frontend` skill's template expected a full `docs/ai/frontend/FRONTEND-ARCHITECTURE.md` with the same kind of content.
- **Decision:** keep `ARCHITECTURE-GUIDE.md` as the single canonical source; `docs/ai/` files reference it and only add what it doesn't cover (current state, changelog, decisions, a short frontend map).
- **Rationale:** two files describing the same architecture drift out of sync over time; one is safer to keep accurate.
- **Consequences:** anyone updating architecture must remember to update `ARCHITECTURE-GUIDE.md` (not `docs/ai/`) as the primary target.
- **Status:** accepted.

### 2026-07-07 — Adapted the `app-builder*` skills from Klyro instead of using them as-is
- **Context:** four `app-builder` skills were copied in from a different project ("Klyro"), assuming Next.js/shadcn/TanStack Query/react-hook-form/zod, an 8-language i18n setup, and a multi-tenant business/branch context — none of which exist in this Expo/React Native app.
- **Decision:** rewrote `SKILL.md` + `templates/` for `app-builder` and `app-builder-frontend` to describe the real stack (Expo Router, no form/query library, Zustand builder stores, two-language i18n).
- **Rationale:** leaving Klyro-specific assumptions in place would have pushed future sessions to introduce libraries and patterns inconsistent with the rest of the app.
- **Status:** accepted.

> This log must reflect real decisions affecting the codebase, not assumptions.
