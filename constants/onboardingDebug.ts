// Was TEMPORARILY `true`, per an earlier explicit request ("make it so the
// screens appear even for an already logged in settled user... just for now,
// so I can check stuff out") — forced every "shown once ever per device"
// coach mark/tip to always render, bypassing the real seen-flag check, so
// they could be reviewed without a fresh install/account.
//
// Turned back OFF 2026-09-24, per explicit "it never goes away" report on
// Home's log coach mark: with this still on, dismissing a coach mark only
// ever hid it for the current mount — the underlying "seen" flag
// (utils/logCoachMark.ts etc.) was still being written correctly, but this
// flag made every screen ignore it and show the coach mark again on the very
// next mount (e.g. a Fast Refresh, or just re-visiting the tab), which read
// exactly like "Got it doesn't actually dismiss it." Flip back to `true`
// only for another deliberate, temporary preview pass — don't leave it on.
export const FORCE_SHOW_ONBOARDING_PREVIEWS = false;
