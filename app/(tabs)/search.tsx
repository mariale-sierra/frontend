// SKELETON PLACEHOLDER — real Search content not yet implemented.
// This screen renders animated shimmer loaders that approximate the final layout:
//   - Search bar at the top
//   - A section label + horizontal row of category chips
//   - A second section label + two rows of filter chips

import { StyleSheet, View, ScrollView } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenBackground from '../../components/layout/screenBackground';
import { colors } from '../../constants/theme';

// Shimmer colors tuned to the dark theme palette
const SHIMMER_BASE = colors.surface;        // #1C1C1E
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

export default function Search() {
  const insets = useSafeAreaInsets();

  return (
    <ScreenBackground variant="challenges" applyTopInset={false}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
        scrollEnabled={false}
      >
        {/* Search bar */}
        <Bone style={styles.searchBar} />

        {/* Section label */}
        <Bone style={styles.sectionLabel} />

        {/* Horizontal row of 3 category chips */}
        <View style={styles.row}>
          <Bone style={styles.chipLarge} />
          <Bone style={styles.chipMedium} />
          <Bone style={styles.chipSmall} />
        </View>

        {/* Second section label */}
        <Bone style={[styles.sectionLabel, styles.sectionLabelGap]} />

        {/* Two rows of filter chips */}
        <View style={styles.row}>
          <Bone style={styles.chipSmall} />
          <Bone style={styles.chipLarge} />
        </View>

        <View style={[styles.row, styles.rowGap]}>
          <Bone style={styles.chipSmall} />
          <Bone style={styles.chipLarge} />
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

  // Search bar — full-width pill
  searchBar: {
    height: 44,
    borderRadius: 22,
    width: '100%',
  },

  // Short section label
  sectionLabel: {
    height: 14,
    borderRadius: 7,
    width: '47%',
    marginTop: 8,
  },
  sectionLabelGap: {
    marginTop: 24,
  },

  // Chip row
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowGap: {
    marginTop: 6,
  },

  // Three chip sizes used across both rows
  chipLarge: {
    height: 48,
    borderRadius: 14,
    flex: 2,
  },
  chipMedium: {
    height: 48,
    borderRadius: 14,
    flex: 1.5,
  },
  chipSmall: {
    height: 48,
    borderRadius: 14,
    flex: 1,
  },
});
