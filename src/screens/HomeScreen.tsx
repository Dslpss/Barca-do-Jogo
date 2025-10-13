import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "../theme/theme";
import AppHeader from "../components/AppHeader";
import SyncStatus from "../components/SyncStatus";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../hooks/useData";
import { useChampionship } from "../hooks/useChampionship";

function HomeScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user, signOut } = useAuth();
  const {
    players,
    teams,
    gameResults,
    isLoading,
    isOnline,
    loadAllData,
    syncData,
  } = useData();
  const {
    championships,
    currentChampionship,
    syncData: syncChampionships,
    loadChampionships,
    loadCurrentChampionship,
  } = useChampionship();
  const [lastSync, setLastSync] = useState<Date | undefined>();

  // Debug para verificar se os dados estão sendo carregados
  useEffect(() => {
    console.log(
      "🏠 HomeScreen: Championships carregados:",
      championships?.length || 0
    );
    if (championships) {
      const activeCount = championships.filter(
        (c) => c && c.status === "em_andamento"
      ).length;
      console.log("🏠 HomeScreen: Campeonatos ativos:", activeCount);
    }
  }, [championships]);

  // Calcular estatísticas dos campeonatos
  const championshipStats = {
    totalChampionships: championships?.length || 0,
    activeChampionships:
      championships?.filter((c) => c && c.status === "em_andamento").length ||
      0,
    totalPlayers:
      championships?.reduce((total, championship) => {
        if (!championship || !championship.teams) return total;
        return (
          total +
          championship.teams.reduce((teamTotal, team) => {
            if (!team || !team.players) return teamTotal;
            return teamTotal + team.players.length;
          }, 0)
        );
      }, 0) || 0,
    totalMatches:
      championships?.reduce((total, championship) => {
        if (!championship || !championship.matches) return total;
        return total + championship.matches.length;
      }, 0) || 0,
    playedMatches:
      championships?.reduce((total, championship) => {
        if (!championship || !championship.matches) return total;
        return (
          total + championship.matches.filter((match) => match.played).length
        );
      }, 0) || 0,
  };

  useEffect(() => {
    if (isFocused && user) {
      // Recarregar tanto os dados antigos quanto os novos campeonatos
      loadAllData();
      loadChampionships(); // Carregar campeonatos ativos diretamente
      loadCurrentChampionship(); // Garantir que o campeonato atual está atualizado
    }
  }, [isFocused, user]);

  const handleSync = async () => {
    try {
      await Promise.all([syncData(), syncChampionships()]);
      setLastSync(new Date());
    } catch (error) {
      console.error("Erro na sincronização manual:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <LinearGradient
      colors={["#1e3c72", "#2a5298", "#4a90e2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Logo e Título */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/icone_login.png")}
              style={styles.logo}
              accessibilityLabel="Logo Liga Esportiva"
            />
          </View>
          <Text style={styles.mainTitle}>Liga Esportiva</Text>
          <Text style={styles.subtitle}>Lagoaçuense</Text>

          {/* Status de Sincronização */}
          <SyncStatus
            isOnline={!!user && isOnline}
            isLoading={isLoading}
            lastSync={lastSync}
          />

          {/* Informações do Usuário */}
          {user && (
            <View style={styles.userInfoContainer}>
              <View style={styles.userInfo}>
                <Ionicons name="person-circle" size={20} color="#fff" />
                <Text style={styles.userText}>
                  {user.displayName || user.email || "Usuário"}
                </Text>
                <TouchableOpacity
                  style={styles.syncIconButton}
                  onPress={handleSync}
                  disabled={isLoading}
                  accessibilityLabel="Sincronizar dados"
                >
                  <Ionicons
                    name={isLoading ? "refresh" : "sync"}
                    size={18}
                    color="#fff"
                    style={isLoading ? styles.rotating : {}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  accessibilityLabel="Sair da conta"
                >
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Card Principal do Sistema de Campeonatos */}
        <View style={styles.mainActionContainer}>
          <TouchableOpacity
            style={styles.championshipButton}
            onPress={() => navigation.navigate("ChampionshipIntro")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.championshipGradient}
            >
              <View style={styles.championshipContent}>
                <View style={styles.championshipHeader}>
                  <View style={styles.championshipIconLarge}>
                    <Ionicons name="trophy" size={30} color="#FFD700" />
                  </View>
                  <View style={styles.championshipInfo}>
                    <Text style={styles.championshipTitle}>
                      Sistema de Campeonatos
                    </Text>
                    <Text style={styles.championshipDescription}>
                      Organize competições profissionais completas
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </View>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureTag}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={styles.featureTagText}>Times Fixos</Text>
                  </View>
                  <View style={styles.featureTag}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={styles.featureTagText}>
                      Classificação Automática
                    </Text>
                  </View>
                  <View style={styles.featureTag}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4CAF50"
                    />
                    <Text style={styles.featureTagText}>
                      Múltiplos Campeonatos
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Campeonato Atual com Logo - AGORA ABAIXO DO SISTEMA DE CAMPEONATOS */}
        {currentChampionship && (
          <View style={styles.currentChampCard}>
            <View style={styles.currentChampRow}>
              {currentChampionship.logo ? (
                <Image
                  source={{ uri: currentChampionship.logo }}
                  style={styles.currentChampLogo}
                  accessibilityLabel="Logo do campeonato"
                />
              ) : (
                <View style={styles.currentChampLogoPlaceholder}>
                  <Ionicons name="trophy" size={18} color="#fff" />
                </View>
              )}
              <View style={styles.currentChampInfo}>
                <Text style={styles.currentChampName} numberOfLines={1}>
                  {currentChampionship.name}
                </Text>
                <Text style={styles.currentChampMeta}>
                  {currentChampionship.type.replace("_", " ")}
                  <Text> • </Text>
                  {currentChampionship.status.replace("_", " ")}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Cards de Estatísticas */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>📊 Estatísticas Gerais</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
              <Text style={styles.statNumber}>
                {isLoading ? "..." : championshipStats.totalChampionships}
              </Text>
              <Text style={styles.statLabel}>Campeonatos</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="play-circle" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statNumber}>
                {isLoading ? "..." : championshipStats.activeChampionships}
              </Text>
              <Text style={styles.statLabel}>Em Andamento</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statNumber}>
                {isLoading ? "..." : championshipStats.totalPlayers}
              </Text>
              <Text style={styles.statLabel}>Jogadores</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="football" size={24} color="#FF9800" />
              </View>
              <Text style={styles.statNumber}>
                {isLoading ? "..." : championshipStats.playedMatches}
              </Text>
              <Text style={styles.statLabel}>Partidas Jogadas</Text>
            </View>
          </View>
        </View>

        {/* Menu de Funcionalidades Adicionais */}
        <View style={styles.additionalFeaturesContainer}>
          <Text style={styles.featuresTitle}>🚀 Funcionalidades</Text>
          <View style={styles.featuresGrid}>
            {/* Estatísticas */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("Stats")}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: "#E3F2FD" }]}
              >
                <Ionicons name="stats-chart" size={24} color="#1976D2" />
              </View>
              <Text style={styles.featureCardTitle}>Estatísticas</Text>
              <Text style={styles.featureCardDescription}>
                Rankings e performance
              </Text>
            </TouchableOpacity>

            {/* Histórico */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("History")}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: "#F3E5F5" }]}
              >
                <Ionicons name="time" size={24} color="#7B1FA2" />
              </View>
              <Text style={styles.featureCardTitle}>Histórico</Text>
              <Text style={styles.featureCardDescription}>
                Sorteios anteriores
              </Text>
            </TouchableOpacity>

            {/* Configurações */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("Settings")}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: "#E8F5E8" }]}
              >
                <Ionicons name="settings" size={24} color="#388E3C" />
              </View>
              <Text style={styles.featureCardTitle}>Configurações</Text>
              <Text style={styles.featureCardDescription}>
                Preferências e backup
              </Text>
            </TouchableOpacity>

            {/* Tutorial */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("Onboarding")}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: "#FFF3E0" }]}
              >
                <Ionicons name="help-circle" size={24} color="#F57C00" />
              </View>
              <Text style={styles.featureCardTitle}>Tutorial</Text>
              <Text style={styles.featureCardDescription}>Como usar o app</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão de Sorteio Rápido */}
        <View style={styles.quickDrawContainer}>
          <TouchableOpacity
            style={styles.quickDrawButton}
            onPress={() => navigation.navigate("QuickDraw")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#00b09b", "#96c93d"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickDrawGradient}
            >
              <View style={styles.quickDrawContent}>
                <Ionicons name="shuffle" size={24} color="#fff" />
                <Text style={styles.quickDrawText}>Sorteio Rápido</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  currentChampCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  currentChampRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currentChampLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginRight: 10,
  },
  currentChampLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  currentChampInfo: {
    flex: 1,
  },
  currentChampName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  currentChampMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
  // Header Styles
  headerContainer: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: "contain",
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    opacity: 0.9,
    textAlign: "center",
    fontWeight: "300",
    letterSpacing: 1,
    marginBottom: 20,
  },
  // Stats Container
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 15,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    width: "47%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    textAlign: "center",
  },
  // Main Action Container
  mainActionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  championshipButton: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  championshipGradient: {
    padding: 16,
  },
  championshipContent: {
    gap: 12,
  },
  championshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  championshipIconLarge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  championshipInfo: {
    flex: 1,
  },
  championshipTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  championshipDescription: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 18,
  },
  // Features Container
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  featureTagText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  rotating: {
    transform: [{ rotate: "360deg" }],
  },
  // Estilos para informações do usuário
  userInfoContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  userText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  syncIconButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  logoutButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  // Additional Features Styles
  additionalFeaturesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  featureCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    width: "47%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  featureCardDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  // Estilos para o botão de sorteio rápido
  quickDrawContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  quickDrawButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  quickDrawGradient: {
    padding: 16,
  },
  quickDrawContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  quickDrawText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeScreen;
