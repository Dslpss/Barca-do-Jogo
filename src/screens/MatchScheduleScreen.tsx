import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, StyleSheet, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function shuffle(array: any[]) {
  return array.sort(() => Math.random() - 0.5);
}

export default function MatchScheduleScreen() {
  const [autoSortear, setAutoSortear] = useState(true);
  const [times, setTimes] = useState<{ name: string; color: string }[]>([]);
  const [jogos, setJogos] = useState<{ timeA: string; timeB: string }[]>([]);
  const [manualJogos, setManualJogos] = useState<
    { timeA: string; timeB: string }[]
  >([]);
  const [timeSelecionadoA, setTimeSelecionadoA] = useState<string>("");
  const [timeSelecionadoB, setTimeSelecionadoB] = useState<string>("");

  useEffect(() => {
    const fetchTimes = async () => {
      const timesSalvos = await AsyncStorage.getItem("teams");
      setTimes(timesSalvos ? JSON.parse(timesSalvos) : []);
    };
    fetchTimes();
  }, []);

  const sortearJogos = () => {
    const jogosGerados: { timeA: string; timeB: string }[] = [];
    const embaralhados = shuffle([...times]);
    for (let i = 0; i < embaralhados.length; i++) {
      for (let j = i + 1; j < embaralhados.length; j++) {
        jogosGerados.push({
          timeA: embaralhados[i].name,
          timeB: embaralhados[j].name,
        });
      }
    }
    setJogos(jogosGerados);
  };

  const adicionarJogoManual = () => {
    if (
      timeSelecionadoA &&
      timeSelecionadoB &&
      timeSelecionadoA !== timeSelecionadoB
    ) {
      setManualJogos([
        ...manualJogos,
        { timeA: timeSelecionadoA, timeB: timeSelecionadoB },
      ]);
      setTimeSelecionadoA("");
      setTimeSelecionadoB("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Definir Jogos</Text>
      <View style={styles.switchRow}>
        <Text>Sortear jogos automaticamente</Text>
        <Switch value={autoSortear} onValueChange={setAutoSortear} />
      </View>
      {autoSortear ? (
        <Button title="Sortear jogos" onPress={sortearJogos} />
      ) : (
        <View>
          <Text style={{ marginVertical: 8 }}>
            Defina manualmente os confrontos:
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text>Time A:</Text>
            <FlatList
              horizontal
              data={times}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <Button
                  title={item.name}
                  onPress={() => setTimeSelecionadoA(item.name)}
                  color={timeSelecionadoA === item.name ? "#4caf50" : undefined}
                />
              )}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text>Time B:</Text>
            <FlatList
              horizontal
              data={times}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <Button
                  title={item.name}
                  onPress={() => setTimeSelecionadoB(item.name)}
                  color={timeSelecionadoB === item.name ? "#4caf50" : undefined}
                />
              )}
            />
          </View>
          <Button title="Adicionar Jogo" onPress={adicionarJogoManual} />
        </View>
      )}
      <Text style={{ marginTop: 16, fontWeight: "bold" }}>Jogos:</Text>
      <FlatList
        data={autoSortear ? jogos : manualJogos}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Text style={styles.match}>
            {item.timeA} x {item.timeB}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  match: { fontSize: 18, marginVertical: 4 },
});
