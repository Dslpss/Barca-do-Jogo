import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PlayersScreen() {
  const [player, setPlayer] = useState("");
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const saved = await AsyncStorage.getItem("players");
      setPlayers(saved ? JSON.parse(saved) : []);
    };
    fetchPlayers();
  }, []);

  const addPlayer = async () => {
    if (player.trim()) {
      const newPlayers = [...players, player.trim()];
      setPlayers(newPlayers);
      setPlayer("");
      await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Jogadores</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do jogador"
        value={player}
        onChangeText={setPlayer}
      />
      <Button title="Adicionar" onPress={addPlayer} />
      <FlatList
        data={players}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => <Text style={styles.player}>{item}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  player: { fontSize: 18, marginVertical: 4 },
});
