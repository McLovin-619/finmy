import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AuthHeader() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#1A1308", "#2A1C0C", "#C8911A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 36 }]}
    >
      <View style={styles.logoMark}>
        <Text style={styles.logoF}>f</Text>
        <View style={styles.logoDot} />
      </View>
      <Text style={styles.wordmark}>finmy</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 52,
  },
  logoMark: {
    backgroundColor: "white",
    borderRadius: 20,
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    position: "relative",
  },
  logoF: {
    fontSize: 30,
    fontFamily: "PlusJakartaSans_700Bold",
    color: "#C8911A",
    lineHeight: 36,
  },
  logoDot: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D4A830",
  },
  wordmark: {
    color: "white",
    fontSize: 22,
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 0.5,
  },
});
