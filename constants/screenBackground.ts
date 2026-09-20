/**
 * Which look of the mesh gradient the screens that opt in to the gradient
 * background get (Home / Search / Challenges / Profile, and the create-challenge
 * flow — the screens that pass `gradientBackground` to `ScreenBackground`).
 *
 * `false` — the `soft` look: the same six activity-color fields on the same arc,
 * quiet enough (under half the strength, at the palette's own saturation, over a
 * faint paper light for depth) to sit behind the colored cards. Since 2026-09-20
 * (explicit request).
 *
 * `true` — the `vivid` look: the original mesh gradient, kept exactly as it was
 * (its numbers are the `vivid` entry of `LOOKS` in `MeshGradientBackground`) but
 * stashed, because it was too jarring next to the colored cards. Flipping this
 * brings it back on every one of those screens.
 */
export const USE_VIVID_MESH_BACKGROUND = false;
