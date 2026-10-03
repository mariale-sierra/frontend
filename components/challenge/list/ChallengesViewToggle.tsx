import { useMemo } from 'react';
import { GlassSegmentedControl } from '../../ui/glassSegmentedControl';

export type ChallengesView = 'mine' | 'explore';

interface ChallengesViewToggleProps {
  view: ChallengesView;
  onViewChange: (view: ChallengesView) => void;
  mineLabel: string;
  exploreLabel: string;
}

// The Mine / Explore switch — a glass segmented control that behaves like the
// bottom nav bar (sliding chip, haptic, drag). See `GlassSegmentedControl`.
export function ChallengesViewToggle({ view, onViewChange, mineLabel, exploreLabel }: ChallengesViewToggleProps) {
  const segments = useMemo(
    () => [
      { key: 'mine' as const, label: mineLabel },
      { key: 'explore' as const, label: exploreLabel },
    ],
    [mineLabel, exploreLabel],
  );

  return <GlassSegmentedControl<ChallengesView> segments={segments} value={view} onChange={onViewChange} />;
}
