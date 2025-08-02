import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from "react-native";
import ColorPickerModal from "../components/ColorPicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useData } from "../hooks/useData";
import { Team } from "../services/dataService";
import { generateUniqueId } from "../utils/keyGenerator";

const COLETE_CORES: { [key: string]: string } = {
  "#FF0000": "Vermelho",
  "#0000FF": "Azul",
  "#00FF00": "Verde",
  "#FFFF00": "Amarelo",
  "#000000": "Preto",
  "#FFFFFF": "Branco",
};

export default function TeamsScreen() {
  const [team, setTeam] = useState("");
  const [color, setColor] = useState(Object.keys(COLETE_CORES)[0]);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [semCor, setSemCor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState("");
  const [editColor, setEditColor] = useState(Object.keys(COLETE_CORES)[0]);
  const [isEditColorPickerVisible, setIsEditColorPickerVisible] =
    useState(false);
  const [editSemCor, setEditSemCor] = useState(false);

  // Usando o hook useData para sincronização com Firebase
  const { teams, saveTeams, deleteTeam, isLoading } = useData();

  const addTeam = async () => {
    if (team.trim()) {
      const corFinal = semCor ? "" : color;

      // Verificar se já existe um time com o mesmo nome
      const timeExistente = teams.find(
        (t) => t.name.toLowerCase() === team.trim().toLowerCase()
      );
      if (timeExistente) {
        alert(`Já existe um time chamado "${team.trim()}"`);
        return;
      }

      const newTeam: Team = {
        id: generateUniqueId(),
        name: team.trim(),
        color: corFinal,
      };
      const newTeams = [...teams, newTeam];
      await saveTeams(newTeams);
      setTeam("");
      setColor(Object.keys(COLETE_CORES)[0]);
      setSemCor(false);
    }
  };

  const excluirTeam = async (id: string) => {
    // Usar deleteTeam do useData para garantir que o time seja deletado do Firebase também
    await deleteTeam(id);
  };

  const iniciarEdicao = (id: string) => {
    const team = teams.find((t) => t.id === id);
    if (team) {
      setEditId(id);
      setEditTeam(team.name);
      setEditColor((team.color || Object.keys(COLETE_CORES)[0]).toUpperCase());
      setEditSemCor(!team.color);
    }
  };

  const salvarEdicao = async () => {
    if (editTeam.trim() && editId !== null) {
      const corFinal = editSemCor ? "" : editColor;
      const newTeams = teams.map((t) =>
        t.id === editId ? { ...t, name: editTeam.trim(), color: corFinal } : t
      );
      await saveTeams(newTeams);
      setEditId(null);
      setEditTeam("");
      setEditColor(Object.keys(COLETE_CORES)[0]);
      setEditSemCor(false);
    }
  };

  const cancelarEdicao = () => {
    setEditId(null);
    setEditTeam("");
    setEditColor(Object.keys(COLETE_CORES)[0]);
    setEditSemCor(false);
  };

  const organizarTimesPorCor = useMemo(() => {
    const timesPorCor = teams.reduce((acc, team) => {
      const nomeCor = team.color
        ? COLETE_CORES[team.color.toUpperCase()] || "Cor personalizada"
        : "Sem cor";
      if (!acc[nomeCor]) {
        acc[nomeCor] = [];
      }
      acc[nomeCor].push(team);
      return acc;
    }, {} as { [key: string]: Team[] });

    const sections = Object.entries(timesPorCor).map(([title, data]) => ({
      title,
      data,
    }));

    sections.sort((a, b) => {
      if (a.title === "Sem cor") return 1;
      if (b.title === "Sem cor") return -1;
      if (a.title === "Cor personalizada") return 1;
      if (b.title === "Cor personalizada") return -1;
      return a.title.localeCompare(b.title);
    });

    return sections;
  }, [teams]);

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
              numberOfLines={1}
            >
              Sem cor
            </Text>
          </TouchableOpacity>
          {!semCor && (
            <>
              {Object.entries(COLETE_CORES).map(([hexColor, colorName]) => (
                <TouchableOpacity
                  key={hexColor}
                  style={[
                    styles.colorBtn,
                    color === hexColor && styles.selectedColorBtn,
                  ]}
                  onPress={() => setColor(hexColor)}
                >
                  <View
                    style={[styles.colorPreview, { backgroundColor: hexColor }]}
                  />
                  <Text
                    style={[
                      styles.colorText,
                      color === hexColor && styles.selectedColorText,
                    ]}
                    numberOfLines={1}
                  >
                    {colorName}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.colorPickerBtn]}
                onPress={() => setIsColorPickerVisible(true)}
              >
                <MaterialCommunityIcons
                  name="palette"
                  size={16}
                  color="white"
                />
                <Text style={styles.colorPickerText} numberOfLines={1}>
                  Personalizada
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <ColorPickerModal
          visible={isColorPickerVisible}
          onClose={() => setIsColorPickerVisible(false)}
          onColorSelected={(c) => setColor(c.toUpperCase())}
          initialColor={color}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTeam}>
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }}>
        <SectionList
          sections={organizarTimesPorCor}
          keyExtractor={(item, index) => {
            // Garantir que o item.id seja uma string válida e única
            if (!item.id) {
              console.log(`Time sem ID encontrado: ${item.name}`);
              return `team-name-${item.name}-${index}`;
            }
            // Adicionar prefixo "team-" para evitar colisões com outros componentes
            return `team-${String(item.id)}`;
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) =>
            editId === item.id ? (
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
                      numberOfLines={1}
                    >
                      Sem cor
                    </Text>
                  </TouchableOpacity>
                  {!editSemCor && (
                    <>
                      {Object.entries(COLETE_CORES).map(
                        ([hexColor, colorName]) => (
                          <TouchableOpacity
                            key={hexColor}
                            style={[
                              styles.colorBtn,
                              editColor === hexColor && styles.selectedColorBtn,
                            ]}
                            onPress={() => setEditColor(hexColor)}
                          >
                            <View
                              style={[
                                styles.colorPreview,
                                { backgroundColor: hexColor },
                              ]}
                            />
                            <Text
                              style={[
                                styles.colorText,
                                editColor === hexColor &&
                                  styles.selectedColorText,
                              ]}
                              numberOfLines={1}
                            >
                              {colorName}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                      <TouchableOpacity
                        style={[styles.colorPickerBtn]}
                        onPress={() => setIsEditColorPickerVisible(true)}
                      >
                        <MaterialCommunityIcons
                          name="palette"
                          size={16}
                          color="white"
                        />
                        <Text style={styles.colorPickerText} numberOfLines={1}>
                          Personalizada
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                <ColorPickerModal
                  visible={isEditColorPickerVisible}
                  onClose={() => setIsEditColorPickerVisible(false)}
                  onColorSelected={(c) => setEditColor(c.toUpperCase())}
                  initialColor={editColor}
                />
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
                    { backgroundColor: item.color || theme.colors.border },
                  ]}
                />
                <Text style={styles.teamName}>{item.name}</Text>
                <Text style={styles.teamColor}>
                  {item.color
                    ? COLETE_CORES[item.color.toUpperCase()] ||
                      "Cor personalizada"
                    : "Sem cor"}
                </Text>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => item.id && iniciarEdicao(item.id)}
                >
                  <Text style={styles.iconText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => item.id && excluirTeam(item.id)}
                >
                  <Text style={styles.iconText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )
          }
          ListEmptyComponent={() =>
            teams.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum time cadastrado.</Text>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  colorPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea",
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: "#667eea",
    gap: theme.spacing.xs,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    width: "30%",
    minWidth: 90,
    maxWidth: 110,
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
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
  label: {
    ...theme.typography.label,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  colorsContainerWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xs,
  },
  colorBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "rgba(24, 90, 157, 0.2)",
    gap: theme.spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: "30%",
    minWidth: 90,
    maxWidth: 110,
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  selectedColorBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  colorText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 11,
    textAlign: "center",
    flexShrink: 1,
  },
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
    ...theme.components.card,
  },
  teamItemEdit: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.components.card,
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
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: "rgba(24, 90, 157, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: "30%",
    minWidth: 90,
    maxWidth: 110,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  noColorBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  noColorText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 11,
    textAlign: "center",
  },
  colorPickerText: {
    ...theme.typography.body,
    color: "white",
    fontWeight: "600",
    fontSize: 11,
    textAlign: "center",
    flexShrink: 1,
  },
  noColorTextActive: {
    color: theme.colors.white,
  },
});
