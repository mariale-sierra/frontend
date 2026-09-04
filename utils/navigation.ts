import { router } from 'expo-router';

/**
 * Safe "go back" — falls back to `fallbackHref` (the tabs root by default,
 * same fallback `BackButton`'s own default handler already uses) when
 * there's no screen left to pop to, instead of letting React Navigation
 * throw "The action 'GO_BACK' was not handled by any navigator." A screen
 * reached via a deep link, or revisited after a JS reload, has no
 * navigation history — every bare `router.back()` call in this app is a
 * potential instance of this, not just `BackButton`'s own default.
 */
export function safeBack(fallbackHref: string = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref as never);
  }
}

/**
 * Same idea as `safeBack`, but pops up to `times` screens in a row — for
 * the deliberate multi-level pop some flows use (e.g. camera.tsx/rest-day.tsx
 * popping their own inner `(add)` stack entry, then bubbling once more to
 * close the `(add)` modal group itself off the root stack). Stops as soon
 * as there's nothing left to pop; only falls back to `fallbackHref` if it
 * couldn't pop even once.
 */
export function safeBackTimes(times: number, fallbackHref: string = '/(tabs)') {
  for (let i = 0; i < times; i++) {
    if (!router.canGoBack()) {
      if (i === 0) router.replace(fallbackHref as never);
      return;
    }
    router.back();
  }
}
