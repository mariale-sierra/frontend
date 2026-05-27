import { Pressable, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { Icon } from '../ui/icon';

export type PostsView = 'posts' | 'photos';

interface PostsViewToggleProps {
  view: PostsView;
  onViewChange: (view: PostsView) => void;
}

export function PostsViewToggle({ view, onViewChange }: PostsViewToggleProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => onViewChange('posts')}>
          <Icon
            name="eye"
            size={22}
            color={view === 'posts' ? colors.textPrimary : colors.textMuted}
          />
          {view === 'posts' && <View style={styles.indicator} />}
        </Pressable>
        <Pressable style={styles.tab} onPress={() => onViewChange('photos')}>
          <Icon
            name="camera"
            size={22}
            color={view === 'photos' ? colors.textPrimary : colors.textMuted}
          />
          {view === 'photos' && <View style={styles.indicator} />}
        </Pressable>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xl,
    justifyContent: 'center',
    paddingBottom: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  indicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
