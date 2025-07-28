import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  theme?: "light" | "dark";
}

export default function AppHeader({
  title,
  subtitle,
  icon = "football",
  children,
  theme = "dark",
}: AppHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <Ionicons
        name={icon as any}
        size={36}
        color={theme === "dark" ? "#fff" : "#185a9d"}
        style={{ marginBottom: 8 }}
      />
      <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#fff' : '#185a9d' }]}>{title}</Text>
      {subtitle && <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#43a2e3' }]}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "transparent",
    alignItems: "center",
    paddingTop: 25,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
});
