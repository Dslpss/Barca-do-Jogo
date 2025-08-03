import React from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import { theme } from "../theme/theme";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  try {
    const { user, loading, error } = useAuth();

    if (loading) {
      return (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro de autenticação</Text>
          <Text style={styles.errorDetail}>{error}</Text>
        </View>
      );
    }

    if (!user) {
      return <LoginScreen />;
    }

    return <>{children}</>;
  } catch (err) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro na inicialização</Text>
        <Text style={styles.errorDetail}>
          {err instanceof Error ? err.message : "Erro desconhecido"}
        </Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
  },
});
