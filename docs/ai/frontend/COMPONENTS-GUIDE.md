# COMPONENTS-GUIDE

## Purpose

Inventory of reusable components so they get **reused, not duplicated**. See `DESIGN-SYSTEM.md` for the primitive list and `../../ARCHITECTURE-GUIDE.md` §9/§12 for more.

## When to read

Before creating any new component — check if one already exists.

## Keep updated

- When a reusable component is added, changed, or removed.

## UI primitives (`components/ui/`)

See `DESIGN-SYSTEM.md`'s "Component library usage" — full list lives there to avoid duplicating it in two places.

## Feature component groups

| Feature | Path |
| --- | --- |
| Challenge list/detail/create/progress | `components/challenge/{list,detail,create,progress}/` |
| Routine builder/picker/metrics | `components/routine/{builder,exercise-picker,metrics,shared}/` |
| Add/metrics entry, rest day | `components/add/` |
| Home feed | `components/home/` (`ActiveChallengeSection.tsx`, `FeedPostCard.tsx`) |
| Auth screens | `components/auth/` |
| Profile | `components/profile/` |
| Messaging / notifications / social / spaces / workout | `.gitkeep` + empty barrel only — not built, see `../CURRENT-STATE.md` |

## Feature-local vs shared

Start a component inside its feature folder (`components/<feature>/`); only promote it to `components/ui/` or `components/layout/` once a second, unrelated feature needs the same thing.

## Reuse rules

- Search `components/ui/`, `components/layout/`, and `components/<feature>/` before building new.
- Extend via props rather than forking a near-duplicate component.

> Must reflect the real current components, not assumptions.
