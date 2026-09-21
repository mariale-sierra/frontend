import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Fill } from '@shopify/react-native-skia';
import { AccentMesh } from '../ui/accentMesh';
import { getMeshRecipe } from '../../constants/meshRecipes';
import { colors } from '../../constants/theme';
import { getChallengeGlowColor, getChallengeGlowKey } from '../../services/adapters/challengeState';
import type { ActivityType } from '../../types/activity';

interface ChallengeMeshBackdropProps {
  /** The challenge's own dominant activity (none yet: the neutral fallback). */
  category: ActivityType | null | undefined;
}

const GRAIN_OPACITY = 0.02;

/**
 * Skia backdrop for a screen that is about one challenge's day (Log Metrics): the
 * challenge cards' mesh glow (`AccentMesh`) at the size of the screen — its few huge,
 * soft fields, in the challenge's own activity color, that fall off very slowly into
 * `ink`. The `screen` recipe puts the color across the top and bleeds it toward the
 * middle, ending in an arch: an INVERTED half-moon, higher in the middle and running
 * lower down the sides, where `ChallengeAccentBackdrop` is the half-moon of light
 * that hangs from the top of the challenge's info and progress screens.
 *
 * Takes the activity rather than a color, since the recipe (the shape) is the
 * activity's as much as the color is.
 */
export function ChallengeMeshBackdrop({ category }: ChallengeMeshBackdropProps) {
  const { width, height } = useWindowDimensions();
  const glowKey = getChallengeGlowKey('active', category);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={colors.ink} />

        <AccentMesh
          width={width}
          height={height}
          color={getChallengeGlowColor('active', category)}
          recipe={getMeshRecipe('screen', glowKey)}
          grainOpacity={GRAIN_OPACITY}
        />
      </Canvas>
    </View>
  );
}
