import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, StyleSheet, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function shuffle(array: string[]) {
  return array.sort(() => Math.random() - 0.5);
}

export default function AssignPlayersScreen() {
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
    fetchData();
  }, []);

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
    <View style={styles.container}>
      <Text style={styles.title}>Distribuir Jogadores</Text>
      <View style={styles.switchRow}>
        <Text>Sortear jogadores automaticamente</Text>
        <Switch value={autoSortear} onValueChange={setAutoSortear} />
      </View>
      {autoSortear ? (
        <Button title="Sortear jogadores" onPress={sortearJogadores} />
      ) : (
        <View>
          <Text style={{ marginVertical: 8 }}>
            Selecione manualmente o time de cada jogador:
          </Text>
          {jogadores.map((jogador) => (
            <View
              key={jogador}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 8 }}>{jogador}</Text>
              <FlatList
                horizontal
                data={times}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <Button
                    title={item.name}
                    onPress={() => {
                      setTimesJogadores((prev) => {
                        const novo = { ...prev };
                        // Remove jogador de todos os times
                        Object.keys(novo).forEach((t) => {
                          novo[t] = novo[t].filter((j) => j !== jogador);
                        });
                        // Adiciona ao time selecionado
                        if (!novo[item.name]) novo[item.name] = [];
                        novo[item.name].push(jogador);
                        return novo;
                      });
                    }}
                    color={
                      timesJogadores[item.name]?.includes(jogador)
                        ? "#4caf50"
                        : undefined
                    }
                  />
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
              {item.name} ({item.color})
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
  teamBox: {
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
  },
  teamTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  player: { fontSize: 16, marginLeft: 8 },
});
