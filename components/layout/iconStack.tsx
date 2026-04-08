import { View, StyleSheet } from 'react-native';
import { spacing } from '../../constants/theme';

interface IconStackProps {
  children: React.ReactNode[];
  max?: number;
}

export function IconStack({ children, max = 3 }: IconStackProps) {
  const items = children.slice(0, max);

  return (
    <View style={styles.container}>
      {items.map((child, index) => (
        <View
          key={index}
          style={[
            styles.item,
            index !== 0 && styles.overlap,
            { zIndex: items.length - index }, //  layering
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },

  item: {
    position: 'relative',
  },

  overlap: {
    marginLeft: -spacing.sm, //  overlap amount
  },
});