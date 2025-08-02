import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, error } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    try {
      await signIn(email.trim(), password);
    } catch (error) {
      // Erro já tratado no contexto
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../assets/icone_login.png")}
                style={styles.logoImage}
                accessibilityLabel="Logo Barca Da Bola"
              />
            </View>
            <Text style={styles.appTitle}>Liga Esportiva Lagoaçuense</Text>
            <Text style={styles.subtitle}>
              Sistema de Gerenciamento Esportivo
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Acesso Restrito</Text>
            <Text style={styles.formSubtitle}>
              Entre com suas credenciais para acessar o sistema
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.primary}
              />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.primary}
              />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#FF6B6B"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading
                    ? ["#ccc", "#999"]
                    : [theme.colors.primary, theme.colors.card]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.infoText}>
                Acesso restrito aos funcionários da Secretaria de Esporte
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    resizeMode: "contain",
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  eyeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE6E6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    color: "#FF6B6B",
    fontSize: 14,
    flex: 1,
  },
  loginButton: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    marginLeft: 8,
    color: theme.colors.primary,
    fontSize: 12,
    textAlign: "center",
    flex: 1,
    lineHeight: 16,
  },
});
