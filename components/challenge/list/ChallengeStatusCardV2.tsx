import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentPill } from '../../ui/accentPill';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ChallengeCard } from '../card/ChallengeCard';
import { ChallengeCardProgress } from '../card/ChallengeCardProgress';
import { getChallengeStatusCardModel } from './challengeStatusCardModel';
import type { ChallengeStatusCardProps, StatusCardSidePanel } from './challengeStatusCardModel';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { LIST_CARD_GLOW_EDGE } from '../../../constants/challengeCards';
import { withAlpha } from '../../../utils/color';

/**
 * Challenges-Mine card, glow design: the shared `ChallengeCard` — dark, a color
 * glowing up from the bottom edge — with today's state as a badge (the state's
 * color: activity color on a train day, lavender on a rest day, green once
 * today is done, gray when finished or left), the title, the progress bar, and
 * the photo tile on the right. The glow, outline, progress fill and photo tile
 * all take one color, `glowColor` (see `getChallengeGlowColor`): the *state's*
 * color on a rest day (lavender) and once today is completed (green), and the
 * challenge's own activity color otherwise.
 *
 * Same props and logic as the classic `ChallengeStatusCard` (both read
 * `getChallengeStatusCardModel`) — only the visuals differ.
 */
export const ChallengeStatusCardV2 = memo(function ChallengeStatusCardV2({
  challenge,
  onPress,
  onPressAddPhoto,
}: ChallengeStatusCardProps) {
  const { t } = useTranslation();
  const { stateColor, glowColor, stateIcon, stateLabel, progress, sidePanel } = getChallengeStatusCardModel(
    challenge,
    t,
  );

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ChallengeCard
        accentColor={glowColor}
        glowEdge={LIST_CARD_GLOW_EDGE}
        top={<AccentPill size="sm" uppercase icon={stateIcon} label={stateLabel} color={stateColor} />}
        title={challenge.title}
        titleLines={2}
        footer={
          <ChallengeCardProgress
            progress={progress}
            currentDay={challenge.currentDay}
            totalDays={challenge.totalDays}
            accentColor={glowColor}
            glowEdge={LIST_CARD_GLOW_EDGE}
          />
        }
        side={
          <SidePanel
            kind={sidePanel}
            photoUrl={challenge.latestPhotoUrl}
            accentColor={glowColor}
            onPressAddPhoto={onPressAddPhoto}
          />
        }
      />
    </Pressable>
  );
});

interface SidePanelProps {
  kind: StatusCardSidePanel;
  photoUrl: string | null;
  accentColor: string;
  onPressAddPhoto?: () => void;
}

/** The tile on the right: the "Add photo" shortcut, the latest real photo, or a placeholder. */
function SidePanel({ kind, photoUrl, accentColor, onPressAddPhoto }: SidePanelProps) {
  const { t } = useTranslation();

  if (kind === 'addPhoto') {
    return (
      <Pressable
        onPress={onPressAddPhoto}
        hitSlop={4}
        style={({ pressed }) => [styles.panel, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('challenges.addPhoto')}
      >
        <Icon name="camera-outline" size={PANEL_ICON_SIZE} color={accentColor} />
        <Text variant="caption" weight="bold" style={[styles.addPhotoText, { color: accentColor }]}>
          {t('challenges.addPhoto')}
        </Text>
      </Pressable>
    );
  }

  if (kind === 'photo') {
    return <Image source={{ uri: photoUrl ?? undefined }} style={styles.panel} resizeMode="cover" />;
  }

  return (
    <View style={styles.panel}>
      <Icon name="image-outline" size={PANEL_ICON_SIZE} color={withAlpha(colors.paper, textOpacity.tertiary)} />
    </View>
  );
}

const PANEL_WIDTH = 114;
const PANEL_ICON_SIZE = 26;
// The tile is a darker inset in the card, so the accent camera stands out.
const PANEL_OPACITY = 0.62;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  // `medium` radius: concentric with the card's `big` corners inside its `md` padding.
  panel: {
    width: PANEL_WIDTH,
    flexShrink: 0,
    borderRadius: radius.medium,
    backgroundColor: withAlpha(colors.ink, PANEL_OPACITY),
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  addPhotoText: {
    // color set inline — this challenge's own accent color.
    // Text's tone-opacity (85%) applies even to a custom `color`; cancel it.
    textAlign: 'center',
    opacity: 1,
  },
});
