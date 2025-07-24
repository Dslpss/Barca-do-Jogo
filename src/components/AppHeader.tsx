import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
}

export default function AppHeader({
  title,
  subtitle,
  icon = "football",
  children,
}: AppHeaderProps) {
  return (
    <View style={styles.headerCard}>
      <Ionicons
        name={icon as any}
        size={48}
        color="#43cea2"
        style={{ marginBottom: 4 }}
      />
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#43cea2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#185a9d",
    marginBottom: 4,
    letterSpacing: 1,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#43cea2",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});
