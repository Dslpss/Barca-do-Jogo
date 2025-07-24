import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const COLETE_CORES = [
  "Vermelho",
  "Azul",
  "Verde",
  "Amarelo",
  "Preto",
  "Branco",
];

type Team = {
  name: string;
  color: string;
};

export default function TeamsScreen() {
  const [team, setTeam] = useState("");
  const [color, setColor] = useState(COLETE_CORES[0]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const fetchTeams = async () => {
      const saved = await AsyncStorage.getItem("teams");
      setTeams(saved ? JSON.parse(saved) : []);
    };
    fetchTeams();
  }, []);

  const addTeam = async () => {
    if (team.trim()) {
      const newTeams = [...teams, { name: team.trim(), color }];
      setTeams(newTeams);
      setTeam("");
      setColor(COLETE_CORES[0]);
      await AsyncStorage.setItem("teams", JSON.stringify(newTeams));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Times</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome do time"
        value={team}
        onChangeText={setTeam}
      />
      <Text style={styles.label}>Escolha a cor do colete:</Text>
      <View style={styles.colorsContainer}>
        {COLETE_CORES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorBtn, color === c && styles.selectedColorBtn]}
            onPress={() => setColor(c)}
          >
            <Text style={styles.colorText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Adicionar" onPress={addTeam} />
      <FlatList
        data={teams}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <Text style={styles.team}>
            {item.name} - {item.color}
          </Text>
        )}
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
  label: { fontSize: 16, marginBottom: 8 },
  colorsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  colorBtn: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#eee",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedColorBtn: { backgroundColor: "#cce" },
  colorText: { fontSize: 16 },
  team: { fontSize: 18, marginVertical: 4 },
});
