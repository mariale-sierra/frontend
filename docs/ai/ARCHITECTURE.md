# ARCHITECTURE

## Purpose

Describe how `frontend/` is structured and *why*. This file intentionally stays short — [`../ARCHITECTURE-GUIDE.md`](../ARCHITECTURE-GUIDE.md) already covers this in depth (routing, API integration, state, UI conventions, feature rules, module-by-module maps). Read that one first; this file only adds what it doesn't cover.

## When to read

At the start of any non-trivial task, right after INDEX — but really, read `../ARCHITECTURE-GUIDE.md` in full.

## Keep updated

- When a structural pattern changes, update `../ARCHITECTURE-GUIDE.md` (the canonical doc) first, then reflect it here only if this file said something specific.

## Tech stack (quick reference — see the guide for versions/detail)

Expo, Expo Router, React Native, TypeScript `strict`, Axios, Zustand, `react-i18next`. **Not present:** Next.js, shadcn/Radix, Tailwind, TanStack Query, react-hook-form, zod — don't introduce any of these without being explicitly asked, they don't fit anything else in this codebase.

## What this file adds beyond the guide

- **Not a monorepo:** `frontend/` is one of three independent git repos under the shared `Havit/` folder (see root `CLAUDE.md`). There's no cross-repo build tooling.
- **i18n is two languages, not more:** `i18n/resources/en.ts` and `es.ts` only (plain TypeScript objects, not JSON).
- **No form library:** forms use local component/hook state + Zustand builder stores (`store/*BuilderStore.ts`) + hand-written per-step validation (see `hooks/useCreateChallengeFlow.ts`).

> This document must reflect the real current codebase, not assumptions. Prefer editing `../ARCHITECTURE-GUIDE.md` for anything structural.
