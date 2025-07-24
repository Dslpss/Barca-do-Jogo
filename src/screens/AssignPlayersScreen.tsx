import React, { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

function shuffle(array: string[]) {
  return array.sort(() => Math.random() - 0.5);
}

const COLORS = {
  primary: "#0A2A45",
  accent: "#D6B36A",
  background: "#fff",
  card: "#11385A",
  cardLight: "#1C4663",
  text: "#fff",
  textDark: "#0A2A45",
  error: "#e57373",
};

export default function AssignPlayersScreen() {
  const isFocused = useIsFocused();
  const [autoSortear, setAutoSortear] = useState(true);
  const [jogadores, setJogadores] = useState<string[]>([]);
  const [times, setTimes] = useState<{ name: string; color: string }[]>([]);
  const [timesJogadores, setTimesJogadores] = useState<{
    [key: string]: string[];
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      const jogadoresSalvos = await AsyncStorage.getItem("players");
      const timesSalvos = await AsyncStorage.getItem("teams");
      setJogadores(jogadoresSalvos ? JSON.parse(jogadoresSalvos) : []);
      setTimes(timesSalvos ? JSON.parse(timesSalvos) : []);
    };
    if (isFocused) fetchData();
  }, [isFocused]);

  const sortearJogadores = () => {
    const embaralhados = shuffle([...jogadores]);
    const resultado: { [key: string]: string[] } = {};
    times.forEach((time) => {
      resultado[time.name] = [];
    });
    embaralhados.forEach((jogador, idx) => {
      const timeIdx = idx % times.length;
      resultado[times[timeIdx].name].push(jogador);
    });
    setTimesJogadores(resultado);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.container}>
        <AppHeader title="Distribuir Jogadores" icon="shuffle" />
        <View style={styles.switchRow}>
          <Text
            style={{ color: COLORS.text, fontWeight: "bold", fontSize: 16 }}
          >
            Sortear jogadores automaticamente
          </Text>
          <Switch value={autoSortear} onValueChange={setAutoSortear} />
        </View>
        {autoSortear ? (
          <TouchableOpacity style={styles.sortBtn} onPress={sortearJogadores}>
            <Text style={styles.sortBtnText}>Sortear jogadores</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.manualTitle}>
              Selecione manualmente o time de cada jogador:
            </Text>
            {jogadores.map((jogador) => (
              <View key={jogador} style={styles.jogadorRow}>
                <Text style={styles.jogadorNome}>{jogador}</Text>
                <FlatList
                  horizontal
                  data={times}
                  keyExtractor={(item) => item.name}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.timeBtn,
                        timesJogadores[item.name]?.includes(jogador) &&
                          styles.timeBtnActive,
                      ]}
                      onPress={() => {
                        setTimesJogadores((prev) => {
                          const novo = { ...prev };
                          Object.keys(novo).forEach((t) => {
                            novo[t] = novo[t].filter((j) => j !== jogador);
                          });
                          if (!novo[item.name]) novo[item.name] = [];
                          novo[item.name].push(jogador);
                          return novo;
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.timeBtnText,
                          timesJogadores[item.name]?.includes(jogador) &&
                            styles.timeBtnTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ))}
          </View>
        )}
        <FlatList
          data={times}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <View style={styles.teamBox}>
              <Text style={styles.teamTitle}>
                {item.name} {item.color ? `(${item.color})` : ""}
              </Text>
              <FlatList
                data={timesJogadores[item.name] || []}
                keyExtractor={(jogador) => jogador}
                renderItem={({ item: jogador }) => (
                  <Text style={styles.player}>{jogador}</Text>
                )}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}

import AppHeader from "../components/AppHeader";
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  sortBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginVertical: 10,
    elevation: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sortBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  manualTitle: {
    fontSize: 18,
    color: COLORS.accent,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  jogadorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 8,
    elevation: 1,
  },
  jogadorNome: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
    fontWeight: "bold",
    flex: 1,
  },
  timeBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    elevation: 2,
  },
  timeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  timeBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  timeBtnTextActive: {
    color: COLORS.text,
  },
  teamBox: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 8,
    textAlign: "center",
  },
  player: {
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    marginLeft: 8,
    elevation: 1,
  },
});
