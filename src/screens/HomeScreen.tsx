import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
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
      <View style={styles.container}>
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
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
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
});
