import { StyleSheet, View } from 'react-native';
import { PhotoFrame } from '../ui/photoFrame';
import { radius } from '../../constants/theme';
import type { FeedPostViewModel } from '../../services/adapters/feedAdapter';

interface FeedPostCardProps {
  post: FeedPostViewModel;
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  return (
    <View style={styles.card}>
      <PhotoFrame imageUrl={post.imageUrl} username={post.userName} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
});
