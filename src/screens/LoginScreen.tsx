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
      colors={["#1e3c72", "#2a5298", "#4a90e2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.content}>
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
              <Ionicons name="mail-outline" size={20} color="#4a90e2" />
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
              <Ionicons name="lock-closed-outline" size={20} color="#4a90e2" />
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
                  color="#4a90e2"
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
                  loading ? ["#ccc", "#999"] : ["#1e3c72", "#2a5298", "#4a90e2"]
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
                color="#4a90e2"
              />
              <Text style={styles.infoText}>
                Acesso restrito aos funcionários da Secretaria de Esporte
              </Text>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 12,
    shadowColor: "#1e3c72",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 3,
    borderColor: "#4a90e2",
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: "contain",
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
    textAlign: "center",
    textShadowColor: "#1e3c72",
    textShadowOffset: { width: 2, height: 3 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
  formContainer: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 16,
    padding: 20,
    elevation: 12,
    shadowColor: "#1e3c72",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.3)",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3c72",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(74, 144, 226, 0.2)",
    shadowColor: "#4a90e2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    elevation: 6,
    shadowColor: "#1e3c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
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
    backgroundColor: "rgba(74, 144, 226, 0.15)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.3)",
  },
  infoText: {
    marginLeft: 8,
    color: "#1e3c72",
    fontSize: 12,
    textAlign: "center",
    flex: 1,
    lineHeight: 16,
    fontWeight: "600",
  },
});
