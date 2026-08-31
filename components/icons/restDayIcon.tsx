import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { withAlpha } from '../../utils/color';

interface RestDayIconProps {
  size?: number;
}

/** Soft `rest`-colored glow bloom behind a solid `rest`-filled badge holding
 * an `ink` moon glyph — used on both rest-day screens (RestDayContent/
 * RestDayAlreadyLogged). Was a white icon over a translucent glow (low
 * contrast against the dark screen background); switched to a solid badge
 * per explicit request (2026-08-28) — the outer/mid bloom stay as a soft
 * halo, the core became a fully-opaque `rest` circle instead of another
 * alpha layer, so the icon has real contrast to sit on. Was named
 * "Experimental"; that file's non-experimental sibling was dead code
 * (confirmed zero imports) and got deleted, so this is now the one real
 * implementation — renamed accordingly. */
export function RestDayIcon({ size = 80 }: RestDayIconProps) {
  return (
    <View style={styles.container}>
      {/* Diffuse outer bloom */}
      <View style={styles.bloomOuter} />
      {/* Mid bloom */}
      <View style={styles.bloomMid} />

      {/* Solid badge holding the icon */}
      <View style={styles.badge}>
        <Ionicons name="moon-outline" size={size} color={colors.ink} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: withAlpha(colors.rest, 0.07),
  },
  bloomMid: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: withAlpha(colors.rest, 0.13),
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rest,
  },
});
