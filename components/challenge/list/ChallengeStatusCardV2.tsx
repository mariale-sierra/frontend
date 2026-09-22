import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccentPill } from '../../ui/accentPill';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';
import { ChallengeCard } from '../card/ChallengeCard';
import { ChallengeCardProgress } from '../card/ChallengeCardProgress';
import { ChallengeCardShimmer } from '../card/ChallengeCardShimmer';
import { challengeCardText } from '../card/challengeCardText';
import { getChallengeStatusCardModel } from './challengeStatusCardModel';
import type { ChallengeStatusCardProps, StatusCardSidePanel } from './challengeStatusCardModel';
import { colors, radius, spacing, textOpacity } from '../../../constants/theme';
import { getMeshRecipe } from '../../../constants/meshRecipes';
import { withAlpha } from '../../../utils/color';

/**
 * Challenges-Mine card, glow design: the shared `ChallengeCard` — dark, a color
 * glowing up from the bottom edge — with today's state as a badge (the state's
 * color: activity color on a train day, lavender on a rest day, green once
 * today is done, gray when finished or left), the title, the progress bar, and
 * the photo tile on the right (its camera and "Add photo" label in plain `paper`,
 * so they read against the glow). The glow, outline and progress fill all take one
 * color, `glowColor` (see `getChallengeGlowColor`): the *state's* color on a rest
 * day (lavender) and once today is completed (green), and the challenge's own
 * activity color otherwise.
 *
 * Same props and logic as the classic `ChallengeStatusCard` (both read
 * `getChallengeStatusCardModel`) — only the visuals differ.
 *
 * A finished (`won`) challenge's card is dimmed ("apagado") and gets a
 * periodic light sweep (`ChallengeCardShimmer`) — per explicit request
 * 2026-09-22, so a finished challenge reads as done/archival rather than
 * competing visually with the ones still active, while still catching the
 * eye a little (the sweep) for having been completed. The dimming is on the
 * card content only, not the sweep itself, so the sweep stays crisp on top
 * of the dimmed card instead of being dimmed along with it.
 */
export const ChallengeStatusCardV2 = memo(function ChallengeStatusCardV2({
  challenge,
  onPress,
  onPressAddPhoto,
}: ChallengeStatusCardProps) {
  const { t } = useTranslation();
  const { stateColor, glowColor, glowKey, stateIcon, stateLabel, progress, sidePanel } = getChallengeStatusCardModel(
    challenge,
    t,
  );
  const isFinished = challenge.state === 'won';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <View style={styles.cardWrap}>
        <View style={isFinished && styles.dimmed}>
          <ChallengeCard
            accentColor={glowColor}
            glowRecipe={getMeshRecipe('mine', glowKey)}
            top={<AccentPill size="sm" uppercase icon={stateIcon} label={stateLabel} color={stateColor} />}
            title={challenge.title}
            titleLines={2}
            footer={
              <ChallengeCardProgress
                progress={progress}
                currentDay={challenge.currentDay}
                totalDays={challenge.totalDays}
                accentColor={glowColor}
                track="light"
              />
            }
            side={
              <SidePanel kind={sidePanel} photoUrl={challenge.latestPhotoUrl} onPressAddPhoto={onPressAddPhoto} />
            }
          />
        </View>
        {isFinished ? <ChallengeCardShimmer /> : null}
      </View>
    </Pressable>
  );
});

interface SidePanelProps {
  kind: StatusCardSidePanel;
  photoUrl: string | null;
  onPressAddPhoto?: () => void;
}

/** The tile on the right: the "Add photo" shortcut, the latest real photo, or a placeholder. */
function SidePanel({ kind, photoUrl, onPressAddPhoto }: SidePanelProps) {
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
        <Icon name="camera-outline" size={PANEL_ICON_SIZE} color={colors.paper} />
        <Text variant="caption" weight="bold" style={[styles.addPhotoText, challengeCardText.paper]}>
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
// The tile is a darker inset in the card, so the paper camera stands out. (A
// brighter `paper` chip like the toggle's selected side was tried 2026-09-20 and
// put back on request.)
const PANEL_OPACITY = 0.62;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  // Plain wrapper so `ChallengeCardShimmer` (a sibling, only rendered when
  // finished) can absolutely-fill the same bounds as the card below it.
  cardWrap: {
    position: 'relative',
  },
  // The "apagado" dim for a finished challenge's card — content only, not
  // the shimmer sweep rendered alongside it (see the component doc comment).
  dimmed: {
    opacity: 0.78,
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
  // Plain `paper`, fully opaque, from `challengeCardText.paper`.
  addPhotoText: {
    textAlign: 'center',
  },
});
