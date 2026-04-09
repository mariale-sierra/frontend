import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

type Props = {
  children: ReactNode;
};

export default function ActivityBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      {/* Top glow */}
      <View style={styles.topGlow} />

      {/* Bottom glow */}
      <View style={styles.bottomGlow} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a", // softer than pure black
  },

  content: {
    flex: 1,
    padding: 16,
  },

  topGlow: {
    position: "absolute",
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#7b2cff", // purple
    opacity: 0.2,
  },

  bottomGlow: {
    position: "absolute",
    bottom: -120,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#00cfff", // blue
    opacity: 0.2,
  },
});