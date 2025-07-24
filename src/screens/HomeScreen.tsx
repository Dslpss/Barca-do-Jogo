import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  primary: "#0A2A45", // azul escuro
  accent: "#D6B36A", // dourado
  background: "#fff",
  card: "#11385A",
  cardLight: "#1C4663",
  text: "#fff",
  textDark: "#0A2A45",
  error: "#e57373",
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
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
      colors={[COLORS.primary, COLORS.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <AppHeader
          title="Barca do Jogo"
          subtitle="Resenha é nosso JOGO"
          icon="football"
        >
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Ionicons name="people" size={22} color={COLORS.accent} />
              <Text style={styles.infoText}>{qtdJogadores} jogadores</Text>
            </View>
            <View style={styles.infoBox}>
              <Ionicons name="shirt" size={22} color={COLORS.accent} />
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
              name="people"
              size={28}
              color={COLORS.text}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.menuButtonText}>Cadastrar Jogadores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("Teams")}
          >
            <Ionicons
              name="shirt"
              size={28}
              color={COLORS.text}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.menuButtonText}>Cadastrar Times</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

import AppHeader from "../components/AppHeader";
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: COLORS.primary, // azul escuro
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: 'transparent', // sem branco
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 32,
    alignItems: "center",
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 4,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.accent,
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    marginBottom: 4,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardLight,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  infoText: {
    marginLeft: 6,
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 15,
  },
  menuContainer: {
    width: "100%",
    alignItems: "center",
  },
  menuButton: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginBottom: 22,
    width: "85%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
});
