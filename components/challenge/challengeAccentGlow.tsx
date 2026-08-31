import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface ChallengeAccentGlowProps {
  color: string;
}

/**
 * Subtle top-to-bottom glow behind a challenge-scoped screen's content, in
 * that challenge's own activity accent color, fading into the screen's
 * `ink` base. Confirmed scope, per explicit request: Challenge-Info
 * (`app/challenge/[id]/index.tsx`), the Consistency/progress screen
 * (`ChallengeActiveProgressScreen.tsx`), and — added 2026-08-30, same
 * request that also brought the accent color into the Members/Invite
 * wireframes' own CTAs/icons — `app/challenge/[id]/members.tsx` and
 * `app/challenge/[id]/invite.tsx`. Still not a shared background treatment
 * for every challenge-scoped screen automatically (see design system →
 * Explicitly Rejected Patterns' gradient exceptions list before adding it
 * anywhere else) — each addition has been a specific, named request.
 *
 * Same `react-native-svg` `RadialGradient` mechanism `ScreenBackground`'s own
 * glows already use, centered (`cx="50%"`) and anchored at the very top
 * (`cy="0%"`) for left-right symmetry. `r="55%"` — was `85%` (reached too far
 * down the screen, per explicit correction 2026-08-28) — large enough that
 * the gradient's own curvature stays imperceptible (reads as a soft vertical
 * fade, not a visible circular blob), without spreading past roughly the
 * top third to half of the screen.
 *
 * A single `r` on an SVG radial gradient is circular, so on a portrait
 * screen (much taller than wide) that same `r` reads as narrow left-right
 * relative to full screen width even once the vertical reach is right. Per
 * explicit correction 2026-08-29 ("reach is great but not wide enough"),
 * `gradientTransform` stretches the circle into a horizontally-wide ellipse.
 *
 * First attempt scaled around a percentage `cx="50%"` anchor while staying
 * on the default `objectBoundingBox` gradient units — that came back
 * visibly off-center (a known `react-native-svg` gotcha: `gradientTransform`
 * doesn't reliably compose with percentage/objectBoundingBox coordinates on
 * every platform). Fixed by switching to `gradientUnits="userSpaceOnUse"`
 * with real pixel `cx`/`cy`/`r` from `useWindowDimensions()`, so the
 * transform's translate/scale math happens in the same absolute coordinate
 * space as the gradient itself — reliably centered on any screen width.
 */
export function ChallengeAccentGlow({ color }: ChallengeAccentGlowProps) {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const r = height * 0.55;
  const widenFactor = 1.8;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient
            id="challengeAccentGlow"
            gradientUnits="userSpaceOnUse"
            cx={cx}
            cy={0}
            r={r}
            gradientTransform={`translate(${cx}, 0) scale(${widenFactor}, 1) translate(${-cx}, 0)`}
          >
            <Stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.06} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#challengeAccentGlow)" />
      </Svg>
    </View>
  );
}
