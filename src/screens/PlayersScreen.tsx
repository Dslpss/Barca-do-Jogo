import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";

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

export default function PlayersScreen() {
  const [player, setPlayer] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

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

  const startEditPlayer = (idx: number) => {
    setEditingIdx(idx);
    setEditingName(players[idx]);
  };

  const saveEditPlayer = async () => {
    if (editingIdx !== null && editingName.trim()) {
      const newPlayers = [...players];
      newPlayers[editingIdx] = editingName.trim();
      setPlayers(newPlayers);
      setEditingIdx(null);
      setEditingName("");
      await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
    }
  };

  const cancelEditPlayer = () => {
    setEditingIdx(null);
    setEditingName("");
  };

  const deletePlayer = async (idx: number) => {
    const newPlayers = players.filter((_, i) => i !== idx);
    setPlayers(newPlayers);
    await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
    if (editingIdx === idx) cancelEditPlayer();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Cadastro de Jogadores" icon="people" />
      <View style={styles.card}>
        <View style={{ alignItems: "center", width: "100%" }}>
          <Text style={styles.title}>Cadastrar novo jogador</Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Nome do jogador"
            value={player}
            onChangeText={setPlayer}
            placeholderTextColor={COLORS.primary}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>Jogadores cadastrados</Text>
        </View>
        <FlatList
          data={players}
          keyExtractor={(item, idx) => idx.toString()}
          contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
          style={{ flex: 1 }}
          renderItem={({ item, index }) => (
            <View style={styles.playerCard}>
              {editingIdx === index ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <TextInput
                    style={[
                      styles.input,
                      { marginRight: 8, backgroundColor: COLORS.background },
                    ]}
                    value={editingName}
                    onChangeText={setEditingName}
                    placeholder="Novo nome"
                    placeholderTextColor={COLORS.primary}
                  />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={saveEditPlayer}
                  >
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelEditPlayer}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Text style={styles.playerName}>{item}</Text>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => startEditPlayer(index)}
                  >
                    <Text style={styles.iconText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => deletePlayer(index)}
                  >
                    <Text style={styles.iconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum jogador cadastrado.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    margin: 16,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  listCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 14,
    padding: 18,
    margin: 16,
    elevation: 1,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 10,
    textAlign: "center",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 10,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 8,
    borderRadius: 4,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    flex: 1,
  },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  playerCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    elevation: 1,
  },
  iconText: {
    fontSize: 18,
    color: COLORS.accent,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  saveBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  cancelBtnText: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  playerColor: {
    fontSize: 15,
    color: COLORS.accent,
    fontWeight: "bold",
    marginLeft: 8,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.text,
    fontSize: 16,
    marginTop: 24,
  },
});
