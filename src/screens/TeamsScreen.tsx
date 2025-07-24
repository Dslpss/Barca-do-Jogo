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
import AppHeader from "../components/AppHeader";

const COLETE_CORES = [
  "Vermelho",
  "Azul",
  "Verde",
  "Amarelo",
  "Preto",
  "Branco",
];

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

type Team = {
  name: string;
  color: string;
};

export default function TeamsScreen() {
  const [team, setTeam] = useState("");
  const [color, setColor] = useState(COLETE_CORES[0]);
  const [semCor, setSemCor] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editTeam, setEditTeam] = useState("");
  const [editColor, setEditColor] = useState(COLETE_CORES[0]);
  const [editSemCor, setEditSemCor] = useState(false);

  useEffect(() => {
    const fetchTeams = async () => {
      const saved = await AsyncStorage.getItem("teams");
      setTeams(saved ? JSON.parse(saved) : []);
    };
    fetchTeams();
  }, []);

  const addTeam = async () => {
    if (team.trim()) {
      const corFinal = semCor ? "" : color;
      const newTeams = [...teams, { name: team.trim(), color: corFinal }];
      setTeams(newTeams);
      setTeam("");
      setColor(COLETE_CORES[0]);
      setSemCor(false);
      await AsyncStorage.setItem("teams", JSON.stringify(newTeams));
    }
  };

  const excluirTeam = async (idx: number) => {
    const newTeams = teams.filter((_, i) => i !== idx);
    setTeams(newTeams);
    await AsyncStorage.setItem("teams", JSON.stringify(newTeams));
  };

  const iniciarEdicao = (idx: number) => {
    setEditIndex(idx);
    setEditTeam(teams[idx].name);
    setEditColor(teams[idx].color || COLETE_CORES[0]);
    setEditSemCor(!teams[idx].color);
  };

  const salvarEdicao = async () => {
    if (editTeam.trim() && editIndex !== null) {
      const corFinal = editSemCor ? "" : editColor;
      const newTeams = teams.map((t, i) =>
        i === editIndex ? { name: editTeam.trim(), color: corFinal } : t
      );
      setTeams(newTeams);
      setEditIndex(null);
      setEditTeam("");
      setEditColor(COLETE_CORES[0]);
      setEditSemCor(false);
      await AsyncStorage.setItem("teams", JSON.stringify(newTeams));
    }
  };

  const cancelarEdicao = () => {
    setEditIndex(null);
    setEditTeam("");
    setEditColor(COLETE_CORES[0]);
    setEditSemCor(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Cadastro de Times" icon="shirt" />
      <View style={styles.card}>
        <Text style={styles.title}>Cadastrar novo time</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do time"
          value={team}
          onChangeText={setTeam}
          placeholderTextColor="#185a9d"
        />
        <Text style={styles.label}>Escolha a cor do colete:</Text>
        <View style={styles.colorsContainerWrap}>
          <TouchableOpacity
            style={[styles.noColorBtn, semCor && styles.noColorBtnActive]}
            onPress={() => setSemCor(!semCor)}
          >
            <Text
              style={[styles.noColorText, semCor && styles.noColorTextActive]}
            >
              Sem cor
            </Text>
          </TouchableOpacity>
          {!semCor &&
            COLETE_CORES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorBtn,
                  color === c && styles.selectedColorBtn,
                ]}
                onPress={() => setColor(c)}
              >
                <Text
                  style={[
                    styles.colorText,
                    color === c && styles.selectedColorText,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addTeam}>
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          data={teams}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponentStyle={{ marginBottom: 12 }}
          renderItem={({ item, index }) =>
            editIndex === index ? (
              <View style={styles.teamItemEdit}>
                <TextInput
                  style={styles.input}
                  value={editTeam}
                  onChangeText={setEditTeam}
                  placeholder="Nome do time"
                  placeholderTextColor="#185a9d"
                />
                <View style={styles.colorsContainerWrap}>
                  <TouchableOpacity
                    style={[
                      styles.noColorBtn,
                      editSemCor && styles.noColorBtnActive,
                    ]}
                    onPress={() => setEditSemCor(!editSemCor)}
                  >
                    <Text
                      style={[
                        styles.noColorText,
                        editSemCor && styles.noColorTextActive,
                      ]}
                    >
                      Sem cor
                    </Text>
                  </TouchableOpacity>
                  {!editSemCor &&
                    COLETE_CORES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.colorBtn,
                          editColor === c && styles.selectedColorBtn,
                        ]}
                        onPress={() => setEditColor(c)}
                      >
                        <Text
                          style={[
                            styles.colorText,
                            editColor === c && styles.selectedColorText,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={salvarEdicao}
                  >
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cancelarEdicao}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.teamItem}>
                <View
                  style={[
                    styles.teamColorBox,
                    { backgroundColor: item.color.toLowerCase() },
                  ]}
                />
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamColor}>{item.color}</Text>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => iniciarEdicao(index)}
                >
                  <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => excluirTeam(index)}
                >
                  <Text style={styles.iconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum time cadastrado.</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 22,
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
  input: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: 8,
    marginBottom: 8,
    borderRadius: 4,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
  },
  label: { fontSize: 16, marginBottom: 8, color: COLORS.accent },
  colorsContainerWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
    width: "100%",
  },
  colorsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  colorBtn: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  selectedColorBtn: { backgroundColor: COLORS.accent },
  colorText: { fontSize: 16, color: COLORS.primary },
  selectedColorText: { color: COLORS.text },
  addBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
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
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
  },
  teamItemEdit: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  teamColorBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  teamColor: {
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
  editBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  editBtnText: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: COLORS.error,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  deleteBtnText: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  saveBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  cancelBtnText: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 15,
  },
  noColorBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  noColorBtnActive: {
    backgroundColor: COLORS.accent,
  },
  noColorText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  noColorTextActive: {
    color: COLORS.text,
  },
  colorsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
});
