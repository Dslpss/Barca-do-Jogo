import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";

interface AppHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  icon?: string;
  children?: React.ReactNode;
  theme?: "light" | "dark";
  showLogout?: boolean;
}

export default function AppHeader({
  title,
  subtitle,
  icon,
  children,
  theme = "dark",
  showLogout = true,
}: AppHeaderProps) {
  const { signOut, user } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair do aplicativo?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Botão de logout */}
      {showLogout && user && (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityLabel="Sair do aplicativo"
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={theme === "dark" ? "#fff" : "#185a9d"}
          />
        </TouchableOpacity>
      )}

      {/* Só renderiza o ícone se for passado explicitamente */}
      {icon && (
        <Ionicons
          name={icon as any}
          size={36}
          color={theme === "dark" ? "#fff" : "#185a9d"}
          style={{ marginBottom: 8 }}
        />
      )}
      {/* Se for string, renderiza como Text, se for elemento, renderiza direto */}
      {typeof title === "string" ? (
        <Text
          style={[
            styles.headerTitle,
            { color: theme === "dark" ? "#fff" : "#185a9d" },
          ]}
        >
          {title}
        </Text>
      ) : (
        title
      )}
      {subtitle && (
        <Text
          style={[
            styles.headerSubtitle,
            {
              color: theme === "dark" ? "rgba(255, 255, 255, 0.8)" : "#43a2e3",
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
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
    position: "relative",
  },
  logoutButton: {
    position: "absolute",
    top: 30,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    zIndex: 10,
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
