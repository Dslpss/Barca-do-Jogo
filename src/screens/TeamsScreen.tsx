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
import { theme } from "../theme/theme";

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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Cadastro de Times" icon="shirt" theme="light" />
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
  container: { flex: 1, backgroundColor: theme.colors.background },
  card: {
    ...theme.components.card,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  input: {
    ...theme.components.input,
    marginBottom: theme.spacing.sm,
  },
  label: { ...theme.typography.label, color: theme.colors.primary, marginBottom: theme.spacing.sm },
  colorsContainerWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  colorBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedColorBtn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  colorText: { ...theme.typography.body, color: theme.colors.text },
  selectedColorText: { color: theme.colors.white },
  addBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  addBtnText: {
    color: theme.colors.white,
    ...theme.typography.button,
  },
  teamItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.components.card
  },
  teamItemEdit: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.components.card
  },
  teamColorBox: {
    width: 24,
    height: 24,
    borderRadius: theme.spacing.xs,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teamName: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
  },
  teamColor: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "500",
    marginLeft: theme.spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.text,
    ...theme.typography.body,
    marginTop: theme.spacing.lg,
  },
  iconBtn: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  iconText: {
    fontSize: 16,
  },
  saveBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  saveBtnText: {
    color: theme.colors.white,
    ...theme.typography.button,
  },
  cancelBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  cancelBtnText: {
    color: theme.colors.primary,
    ...theme.typography.button,
  },
  noColorBtn: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noColorBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  noColorText: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  noColorTextActive: {
    color: theme.colors.white,
  },
});
