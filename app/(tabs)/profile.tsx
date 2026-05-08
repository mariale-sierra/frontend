// SKELETON PLACEHOLDER — real Profile content not yet implemented.
// This screen renders animated shimmer loaders that approximate the final layout:
//   - Avatar circle + name / bio lines
//   - Two rows of stat chips
//   - 2-column grid of large content cards

import { StyleSheet, View, ScrollView } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors } from '../../constants/theme';

// Shimmer colors tuned to the dark theme palette
const SHIMMER_BASE = colors.surface;             // #1C1C1E
const SHIMMER_HIGHLIGHT = colors.surfaceHighlight; // #3C3C3E

// Convenience wrapper so every bone picks up the right gradient
function Bone({ style }: { style: object }) {
  return (
    <ShimmerPlaceholder
      LinearGradient={LinearGradient}
      shimmerColors={[SHIMMER_BASE, SHIMMER_HIGHLIGHT, SHIMMER_BASE]}
      style={style}
    />
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenBackground variant="challenges" applyTopInset={false}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        scrollEnabled={false}
      >
        {/* Avatar + name / bio block */}
        <View style={styles.heroRow}>
          <Bone style={styles.avatar} />

          <View style={styles.heroText}>
            <Bone style={styles.heroName} />
            <Bone style={styles.heroBio} />
            <View style={styles.heroMeta}>
              <Bone style={styles.heroMetaChip} />
              <Bone style={styles.heroMetaChipWide} />
            </View>
          </View>
        </View>

        {/* Stat chip rows */}
        <View style={styles.chipRow}>
          <Bone style={styles.statChipWide} />
          <Bone style={styles.statChip} />
        </View>

        <View style={[styles.chipRow, styles.chipRowGap]}>
          <Bone style={styles.statChipWide} />
          <Bone style={styles.statChip} />
        </View>

        {/* 2-column grid of content cards (2 full rows + partial third) */}
        <View style={styles.grid}>
          <Bone style={styles.card} />
          <Bone style={styles.card} />
        </View>

        <View style={[styles.grid, styles.gridGap]}>
          <Bone style={styles.card} />
          <Bone style={styles.card} />
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },

  // Hero section
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    flexShrink: 0,
  },
  heroText: {
    flex: 1,
    gap: 8,
  },
  heroName: {
    height: 16,
    borderRadius: 8,
    width: '55%',
  },
  heroBio: {
    height: 12,
    borderRadius: 6,
    width: '80%',
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  heroMetaChip: {
    height: 22,
    borderRadius: 11,
    width: 60,
  },
  heroMetaChipWide: {
    height: 22,
    borderRadius: 11,
    width: 90,
  },

  // Stat chip rows
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRowGap: {
    marginTop: 4,
  },
  statChipWide: {
    height: 44,
    borderRadius: 14,
    flex: 2,
  },
  statChip: {
    height: 44,
    borderRadius: 14,
    flex: 1,
  },

  // Content card grid
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  gridGap: {
    marginTop: 12,
  },
  card: {
    flex: 1,
    height: 180,
    borderRadius: 18,
  },
});
