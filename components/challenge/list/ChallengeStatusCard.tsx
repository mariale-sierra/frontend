import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { colors, fillOpacity, radius, spacing } from '../../../constants/theme';
import { withAlpha } from '../../../utils/color';
import { getChallengeCardColor } from '../../../services/adapters/challengeState';
import type { ChallengeMineCardViewModel } from '../../../services/adapters/challengeListAdapter';

interface ChallengeStatusCardProps {
  challenge: ChallengeMineCardViewModel;
  onPress?: () => void;
  /** Called when the "Add photo" dark camera square is tapped specifically
   * (only rendered in the `active`, i.e. not-yet-completed-today, state) —
   * a distinct action from tapping the rest of the card, added 2026-08-29
   * per explicit request so this shortcuts straight to logging THIS
   * challenge's progress instead of just opening its progress screen like
   * the rest of the card does. Optional so existing callers that don't need
   * this shortcut don't have to pass anything. */
  onPressAddPhoto?: () => void;
}

type IconName = React.ComponentProps<typeof Icon>['name'];

// State → card background: shared getChallengeCardColor() from
// challengeState.ts (also used by Home's hero card and the progress-ring
// eyebrow, so a palette tweak can't drift between screens). Every state uses
// the SAME ink pill chrome (see Components → Hero card) — only the card's
// own background and the pill's icon/label change. `rest`/`completed`/`won`/
// `left` keep their own fixed meaning (purple/green/neutral) unchanged;
// only `active` now resolves to the challenge's own dominant-activity color
// (Activity Color System v2), falling back to `colors.primary` (white) when
// the challenge has no dominant category yet. `won` and `left` intentionally
// share one background (`neutral`) — this one card variant covers every
// "this challenge is no longer in progress" case rather than growing a new
// color per reason. The wireframe's rest-day pill uses a slightly lightened
// one-off purple (#C4B0FF) instead of the `rest` token — normalized to
// `colors.rest` for token consistency with the other states, which all match
// their token exactly.
const STATE_ICON: Record<ChallengeMineCardViewModel['state'], IconName> = {
  active: 'camera-outline',
  rest: 'moon-outline',
  completed: 'checkmark-outline',
  won: 'trophy-outline',
  left: 'log-out-outline',
};

export function ChallengeStatusCard({ challenge, onPress, onPressAddPhoto }: ChallengeStatusCardProps) {
  const { t } = useTranslation();
  const accentColor = getChallengeCardColor(challenge.state, challenge.dominantActivityCategory);
  const progress = challenge.totalDays > 0 ? Math.min(challenge.currentDay / challenge.totalDays, 1) : 0;
  // Only the in-progress, no-photo-yet-today case gets the "Add photo" CTA —
  // every other state shows the latest real photo if one exists, or a
  // placeholder tile otherwise.
  const showAddPhoto = challenge.state === 'active';

  const stateLabel =
    challenge.state === 'active'
      ? t('challenges.trainDay')
      : challenge.state === 'rest'
        ? t('challenges.restDay')
        : challenge.state === 'completed'
          ? t('challenges.completed')
          : challenge.state === 'won'
            ? t('challenges.finished')
            : t('challenges.left');

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={[styles.card, { backgroundColor: accentColor }]}>
        <View style={styles.textCol}>
          <View style={styles.topGroup}>
            <View style={styles.pill}>
              <Icon name={STATE_ICON[challenge.state]} size={13} color={accentColor} />
              <Text variant="caption" weight="bold" style={[styles.pillText, { color: accentColor }]}>
                {stateLabel}
              </Text>
            </View>
            <Text variant="body" size="xl" weight="bold" inverse numberOfLines={2}>
              {challenge.title}
            </Text>
          </View>

          <View style={styles.bottomGroup}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text variant="label" inverse style={styles.dayText}>
              {t('home.dayOf', { current: challenge.currentDay })}
              <Text variant="label" inverse tone="secondary"> / {challenge.totalDays}</Text>
            </Text>
          </View>
        </View>

        {showAddPhoto ? (
          <Pressable
            onPress={onPressAddPhoto}
            hitSlop={4}
            style={({ pressed }) => [styles.sidePanel, { backgroundColor: colors.ink }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('challenges.addPhoto')}
          >
            <Icon name="camera-outline" size={26} color={accentColor} />
            <Text variant="caption" weight="bold" style={[styles.addPhotoText, { color: accentColor }]}>
              {t('challenges.addPhoto')}
            </Text>
          </Pressable>
        ) : challenge.latestPhotoUrl ? (
          <Image source={{ uri: challenge.latestPhotoUrl }} style={styles.sidePanel} resizeMode="cover" />
        ) : (
          <View style={[styles.sidePanel, { backgroundColor: withAlpha(colors.ink, fillOpacity.washOnAccent) }]}>
            <Icon name="image-outline" size={26} color={withAlpha(colors.ink, 0.4)} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const SIDE_PANEL_WIDTH = 114;
const SIDE_PANEL_HEIGHT = 152;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.big,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    gap: spacing.base,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
  },
  topGroup: {
    gap: spacing.sm,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.small,
    backgroundColor: colors.ink,
  },
  pillText: {
    textTransform: 'uppercase',
    // Text's tone-opacity (85% by default) applies even to a custom `color`
    // override, which would mute the pill's accent color — cancel it back
    // to fully opaque here since this isn't `paper`/`ink` body text.
    opacity: 1,
  },
  bottomGroup: {
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.small,
    backgroundColor: withAlpha(colors.ink, fillOpacity.washOnAccent),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.small,
    backgroundColor: colors.ink,
  },
  dayText: {
    textTransform: 'none',
  },
  sidePanel: {
    width: SIDE_PANEL_WIDTH,
    height: SIDE_PANEL_HEIGHT,
    flexShrink: 0,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    textAlign: 'center',
    opacity: 1,
  },
});
