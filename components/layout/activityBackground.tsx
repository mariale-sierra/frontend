import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { GradientBox } from "./gradient-box";

type Props = {
  children: ReactNode;
};

export default function ActivityBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      {/* Top glow */}
      <GradientBox
        colors={["#7b2cff22", "#7b2cff00"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topGlow}
      />

      {/* Bottom glow */}
      <GradientBox
        colors={["#00cfff22", "#00cfff00"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGlow}
      />

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
    opacity: 0.8,
  },

  bottomGlow: {
    position: "absolute",
    bottom: -120,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.8,
  },
});