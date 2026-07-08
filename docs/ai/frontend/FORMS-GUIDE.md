# FORMS-GUIDE

## Purpose

The standard pattern for forms. **This codebase has no form library** — no react-hook-form, no zod/yup, no formik. Do not introduce one for a single screen.

## When to read

Before building or editing any form.

## Keep updated

- When the form pattern changes.

## Stack

Local component/hook state (`useState`) for single-screen forms. For multi-step flows, a Zustand store under `store/` holds the in-progress data across screens: `challengeBuilderStore.ts`, `routineBuilderStore.ts`, `metricsEntryStore.ts`.

## Standard pattern

Reference: `hooks/useCreateChallengeFlow.ts`. A hook owns the step sequence, reads/writes the builder store, and exposes a `getStepErrors(step, params)`-style function per step, called before allowing "next"/"submit":

```ts
function getStepErrors(step: CreateStep, params: { title: string; /* ...other fields... */ labels: ValidationLabels }) {
  switch (step.kind) {
    case 'identity':
      return params.title.trim().length === 0 ? [params.labels.challengeName] : [];
    // ...one case per step
  }
}
```

Follow this shape for new multi-step flows rather than inventing a schema-based validator.

## Validation

Hand-written validation functions colocated with the flow hook (not a shared schema file). Validation messages come from `labels`/`ValidationLabels`-style objects sourced from `i18n` — never hardcoded strings.

## Error & success feedback

- Inline/step errors are surfaced by the screen from `getStepErrors()`'s return value.
- Global/API errors surface via `store/errorNotificationStore.ts` + `components/ui/errorNotification.tsx`, driven automatically by `services/api.ts`'s Axios response interceptor — don't re-implement that mapping per screen.

## Conventions

- Labels/placeholders/validation strings go through `i18n/resources/{en,es}.ts`.
- Keep validation logic colocated with the flow hook/store it belongs to, not in the screen component.

> Must reflect the real current form patterns, not assumptions.
