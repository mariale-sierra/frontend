import { Image, StyleSheet, View } from 'react-native';
import { AccentCard } from '../ui/accentCard';
import { Icon } from '../ui/icon';
import { Text } from '../ui/text';
import { challengeCardText } from '../challenge/card/challengeCardText';
import { USE_MESH_CARD_GLOW } from '../../constants/challengeCards';
import { DECK_CARD_PADDING } from '../../constants/challengeDeck';
import { getMeshRecipe } from '../../constants/meshRecipes';
import { colors, fillOpacity, radius, spacing, textOpacity } from '../../constants/theme';
import { withAlpha } from '../../utils/color';
import { getChallengeGlowColor, getChallengeGlowKey } from '../../services/adapters/challengeState';
import type { LogChallengeQuickPick } from '../../services/adapters/metricsAdapter';

const PLACEHOLDER_ICON_SIZE = 28;
const TITLE_LINES = 2;

interface ChallengeDeckCardProps {
  challenge: LogChallengeQuickPick;
}

/**
 * One card of the log picker's deck: the family look of the Challenges-Mine and
 * Explore cards — the dark `AccentCard` with a mesh gradient in the challenge's colors
 * and a soft outline in its activity color — with a gradient of its own (`deck`, see
 * `meshRecipes.ts`): two ribbons of light across the top, the bottom left dark. It holds
 * the challenge's title and, under it, its latest photo as a preview, which takes the
 * rest of the card. It fills the box it is given (a little square); the deck sizes and
 * places it.
 */
export function ChallengeDeckCard({ challenge }: ChallengeDeckCardProps) {
  // The picker lists what can be logged today, so every challenge here is `active`:
  // its activity color, or the neutral one when it has no dominant activity yet.
  const glowColor = getChallengeGlowColor('active', challenge.dominantActivityCategory);
  const glowRecipe = USE_MESH_CARD_GLOW
    ? getMeshRecipe('deck', getChallengeGlowKey('active', challenge.dominantActivityCategory))
    : undefined;

  return (
    <AccentCard color={glowColor} glowRecipe={glowRecipe} style={styles.card}>
      <Text variant="subheader" size="lg" numberOfLines={TITLE_LINES} style={challengeCardText.primary}>
        {challenge.name}
      </Text>

      {challenge.photoUrl ? (
        <Image source={{ uri: challenge.photoUrl }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Icon name="image-outline" size={PLACEHOLDER_ICON_SIZE} color={withAlpha(colors.paper, textOpacity.tertiary)} />
        </View>
      )}
    </AccentCard>
  );
}

const styles = StyleSheet.create({
  // The content inset `DECK_CARD_PADDING` all round, the title on top, the photo taking
  // the rest under it.
  card: {
    flex: 1,
    gap: spacing.sm,
    padding: DECK_CARD_PADDING,
  },
  // The `small` radius is the photo tiles' own, and concentric with the card's `big`
  // one, less this padding (28 - 20 = 8).
  photo: {
    flex: 1,
    borderRadius: radius.small,
  },
  // No photo yet: the app's own "no photo" placeholder, `paper` at `placeholder`.
  photoPlaceholder: {
    backgroundColor: withAlpha(colors.paper, fillOpacity.placeholder),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
