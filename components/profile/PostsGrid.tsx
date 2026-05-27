import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import type { ChallengePhoto } from '../../types/challenge';

// REMOVE_MOCK_START
const MOCK_PHOTO: ChallengePhoto = {
  id: 'mock-profile-1',
  challengeId: 'mock-challenge',
  userName: 'camsandvl',
  imageUrl: null,
  day: 14,
  visibility: 'public',
  description: 'Day 14 done. Feeling stronger every week.',
  metrics: [
    { label: 'Bench Press', value: '3 sets · 135 lbs' },
    { label: 'Squat', value: '3 sets · 185 lbs' },
    { label: 'Pull Ups', value: '24 reps' },
  ],
};
// REMOVE_MOCK_END

interface PostsGridProps {
  view: 'posts' | 'photos';
  onPhotoPress?: (photo: ChallengePhoto) => void;
}

function PostSkeleton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.skeleton, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.skeletonInner} />
    </Pressable>
  );
}

const ROW_COUNT = 4;

export function PostsGrid({ view: _view, onPhotoPress }: PostsGridProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: ROW_COUNT * 2 }).map((_, i) => (
        <PostSkeleton
          key={i}
          // REMOVE_MOCK_START
          onPress={() => onPhotoPress?.(MOCK_PHOTO)}
          // REMOVE_MOCK_END
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  skeleton: {
    width: '48.5%',
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  skeletonInner: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
  },
  pressed: {
    opacity: 0.7,
  },
});
