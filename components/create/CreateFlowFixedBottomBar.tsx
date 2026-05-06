import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { spacing } from '../../constants/theme';

interface CreateFlowFixedBottomBarProps {
  children: ReactNode;
  bottomInset?: number;
  topPadding?: number;
  style?: StyleProp<ViewStyle>;
}

export function CreateFlowFixedBottomBar({
  children,
  bottomInset = spacing.lg,
  topPadding = spacing.sm,
  style,
}: CreateFlowFixedBottomBarProps) {
  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: bottomInset, paddingTop: topPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(7,10,16,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
});