import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "../theme/theme";
import AppHeader from "../components/AppHeader";

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [qtdJogadores, setQtdJogadores] = useState(0);
  const [qtdTimes, setQtdTimes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const jogadores = await AsyncStorage.getItem("players");
      const times = await AsyncStorage.getItem("teams");
      try {
        const arrJogadores = jogadores ? JSON.parse(jogadores) : [];
        const arrTimes = times ? JSON.parse(times) : [];
        setQtdJogadores(Array.isArray(arrJogadores) ? arrJogadores.length : 0);
        setQtdTimes(Array.isArray(arrTimes) ? arrTimes.length : 0);
      } catch {
        setQtdJogadores(0);
        setQtdTimes(0);
      }
    };
    fetchData();
  }, [isFocused]);

  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <AppHeader title="Barca do Jogo" icon="football" theme="dark">
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Ionicons name="people-outline" size={20} color={theme.colors.white} />
              <Text style={styles.infoText}>{qtdJogadores} jogadores</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="shirt-outline" size={20} color={theme.colors.white} />
              <Text style={styles.infoText}>{qtdTimes} times</Text>
            </View>
          </View>
        </AppHeader>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Players")}
          >
            <Ionicons
              name="people-outline"
              size={24}
              color={theme.colors.primary}
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
              color={theme.colors.primary}
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
              color={theme.colors.primary}
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
              color={theme.colors.primary}
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
              color={theme.colors.primary}
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
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoText: {
    marginLeft: 8,
    color: theme.colors.white,
    fontWeight: "600",
    fontSize: 15,
  },
  menuContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 40,
  },
  menuButton: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuButtonText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
