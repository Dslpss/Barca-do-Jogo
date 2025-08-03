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

export default function HomeScreen() {
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
  const [lastSync, setLastSync] = useState<Date | undefined>();

  useEffect(() => {
    if (isFocused && user) {
      loadAllData();
    }
  }, [isFocused, user]);

  const handleSync = async () => {
    try {
      await syncData();
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
        <AppHeader
          title={
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  width: 110,
                  height: 110,
                  marginBottom: 10,
                  borderRadius: 55,
                  borderWidth: 3,
                  borderColor: "#4a90e2",
                  backgroundColor: "#fff",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#1e3c72",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 16,
                }}
              >
                <Image
                  source={require("../../assets/icone_login.png")}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    resizeMode: "contain",
                  }}
                  accessibilityLabel="Logo Liga Esportiva"
                />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#fff",
                  letterSpacing: 2,
                  textAlign: "center",
                  textShadowColor: "#1e3c72",
                  textShadowOffset: { width: 2, height: 3 },
                  textShadowRadius: 6,
                  transform: [{ scale: 1.04 }],
                  paddingHorizontal: 0,
                  paddingVertical: 0,
                }}
              >
                Liga Esportiva Lagoaçuense
              </Text>
            </View>
          }
          theme="dark"
          showSync={true}
          onSync={handleSync}
          syncLoading={isLoading}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Ionicons name="people-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>
                {isLoading ? "..." : players.length}
              </Text>
              <Text style={styles.infoLabel}>Players</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="shirt-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>
                {isLoading ? "..." : teams.length}
              </Text>
              <Text style={styles.infoLabel}>Times</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="trophy-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>
                {isLoading ? "..." : gameResults.length}
              </Text>
              <Text style={styles.infoLabel}>Jogos</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="cloud-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>{user ? "On" : "Off"}</Text>
              <Text style={styles.infoLabel}>Status</Text>
            </View>
          </View>

          {/* Status de sincronização */}
          <SyncStatus
            isOnline={!!user && isOnline}
            isLoading={isLoading}
            lastSync={lastSync}
          />
        </AppHeader>
        <View style={styles.menuContainer}>
          {/* Sistema de Campeonatos - Card Principal */}
          <TouchableOpacity
            style={styles.championshipButton}
            onPress={() => navigation.navigate("ChampionshipIntro")}
            activeOpacity={0.8}
          >
            <View style={styles.championshipHeader}>
              <View style={styles.championshipIconContainer}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
              </View>
              <View style={styles.championshipTextContainer}>
                <Text style={styles.championshipButtonTitle}>
                  Sistema de Campeonatos
                </Text>
                <Text style={styles.championshipButtonSubtitle}>
                  Organize competições profissionais
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color="#fff"
                style={styles.chevronIcon}
              />
            </View>

            <View style={styles.championshipFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="people" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Times{"\n"}Fixos</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="settings" size={16} color="#2196F3" />
                <Text style={styles.featureText}>Sem{"\n"}Sorteios</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="layers" size={16} color="#FF9800" />
                <Text style={styles.featureText}>
                  Múltiplos{"\n"}Campeonatos
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Divisor visual */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Sistema Clássico</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Players")}
          >
            <Ionicons
              name="people-outline"
              size={24}
              color="#1e3c72"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.menuButtonText}>Cadastrar Jogadores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Teams")}
          >
            <Ionicons
              name="shirt-outline"
              size={24}
              color="#1e3c72"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.menuButtonText}>Cadastrar Times</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("AssignPlayers")}
          >
            <Ionicons
              name="shuffle-outline"
              size={24}
              color="#1e3c72"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.menuButtonText}>Distribuir Jogadores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("MatchSchedule")}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color="#1e3c72"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.menuButtonText}>Ver Jogos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("HistoryReports")}
          >
            <Ionicons
              name="stats-chart-outline"
              size={24}
              color="#1e3c72"
              style={{ marginRight: 12 }}
            />
            <Text style={styles.menuButtonText}>Histórico & Relatórios</Text>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    paddingTop: 40,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  infoBox: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minWidth: 70,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#1e3c72",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  infoText: {
    marginTop: 4,
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    textShadowColor: "#1e3c72",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  infoLabel: {
    marginTop: 2,
    color: "#fff",
    fontWeight: "500",
    fontSize: 9,
    textAlign: "center",
    textShadowColor: "#1e3c72",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },
  menuContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  menuButton: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#1e3c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(74, 144, 226, 0.3)",
  },
  menuButtonText: {
    color: "#1e3c72",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  championshipButton: {
    backgroundColor: "rgba(30, 60, 114, 0.95)", // Azul escuro elegante
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "90%",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  championshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  championshipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  championshipTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  championshipButtonTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  championshipButtonSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 18,
  },
  chevronIcon: {
    marginLeft: 8,
    opacity: 0.7,
  },
  championshipFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingTop: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    minHeight: 45,
  },
  featureItem: {
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
    maxWidth: "30%",
    paddingHorizontal: 4,
  },
  featureText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 12,
    textShadowColor: "#1e3c72",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
