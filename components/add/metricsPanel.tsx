import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors, gradients, radius } from '../../constants/theme';

interface MetricsPanelProps {
  children: ReactNode;
}

export function MetricsPanel({ children }: MetricsPanelProps) {
  return (
    <View style={styles.container}>
      <View style={styles.panelContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panelContent: {
    flex: 1,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
});
