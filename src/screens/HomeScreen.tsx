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
  const { user } = useAuth();
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
    syncData: syncChampionships,
    loadChampionships,
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
        </View>

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
                    <Ionicons name="trophy" size={40} color="#FFD700" />
                  </View>
                  <View style={styles.championshipInfo}>
                    <Text style={styles.championshipTitle}>
                      Sistema de Campeonatos
                    </Text>
                    <Text style={styles.championshipDescription}>
                      Organize competições profissionais completas
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
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

        {/* Botão de Sincronização Manual */}
        <View style={styles.syncContainer}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            disabled={isLoading}
          >
            <Ionicons
              name={isLoading ? "refresh" : "sync"}
              size={20}
              color="#fff"
              style={isLoading ? styles.rotating : {}}
            />
            <Text style={styles.syncButtonText}>
              {isLoading ? "Sincronizando..." : "Sincronizar Dados"}
            </Text>
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
    padding: 25,
  },
  championshipContent: {
    gap: 20,
  },
  championshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  championshipIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  championshipInfo: {
    flex: 1,
  },
  championshipTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  championshipDescription: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 20,
  },
  // Features Container
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  featureTagText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  // Sync Container
  syncContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  rotating: {
    transform: [{ rotate: "360deg" }],
  },
});

export default HomeScreen;
