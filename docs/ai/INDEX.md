# INDEX — AI Documentation Entry Point

## Purpose

The single entry point for any Claude Code session working in `frontend/`. It explains what this repo is and links to every other AI doc, in reading order.

## When to read

**First, always.** Before any task in this repo.

## Keep updated

- Whenever a new doc is added under `docs/ai/`.
- Whenever the repo's scope or one-line summary changes.

## What this repo is

The Havit mobile app: Expo + Expo Router + React Native, consuming the `backend/` API. It is its own independent git repository (not part of a monorepo — see the root [`CLAUDE.md`](../../../CLAUDE.md)).

**The deepest, most authoritative architecture doc is [`../ARCHITECTURE-GUIDE.md`](../ARCHITECTURE-GUIDE.md)** (pre-existing, outside `docs/ai/`) — read it in full for any non-trivial change. The `docs/ai/` files here are a lighter entry point plus anything that doc doesn't cover (current state, changelog, decisions).

## Reading order

1. [`../ARCHITECTURE-GUIDE.md`](../ARCHITECTURE-GUIDE.md) — the canonical, detailed architecture doc.
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — short pointer + anything the guide above doesn't cover.
3. [CURRENT-STATE.md](./CURRENT-STATE.md) — what exists and its status.
4. [MAP.md](./MAP.md) — where things live.
5. [CHANGES.md](./CHANGES.md) — recent changes.
6. [CONVENTIONS.md](./CONVENTIONS.md) — how we write code here.
7. [DECISIONS.md](./DECISIONS.md) — why things are the way they are.
8. [ROADMAP.md](./ROADMAP.md) — what's planned.
9. [TASKS-LOG.md](./TASKS-LOG.md) — completed work log.

## Specialized docs

`frontend/` subfolder — routes, components, design system, forms, API client. Read via the `app-builder-frontend` skill.

> This index must reflect the real current codebase, not assumptions.
