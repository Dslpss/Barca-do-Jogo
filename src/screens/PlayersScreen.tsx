import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";

// Definindo o tipo para jogador com habilidade e posição
type Player = {
  name: string;
  skill: number; // 1-5 onde 5 é o mais habilidoso
  position: string; // Posição do jogador (ex: Goleiro, Zagueiro, etc.)
  yellowCards: number; // Número de cartões amarelos
  redCards: number; // Número de cartões vermelhos
};

// Lista de posições disponíveis
const POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Meio-Campo",
  "Atacante",
  "Qualquer"
];

export default function PlayersScreen() {
  const [player, setPlayer] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingSkill, setEditingSkill] = useState<number>(3); // Valor padrão médio
  const [editingPosition, setEditingPosition] = useState<string>("Qualquer"); // Posição padrão para edição
  const [playerSkill, setPlayerSkill] = useState<number>(3); // Habilidade para novos jogadores
  const [playerPosition, setPlayerPosition] = useState<string>("Qualquer"); // Posição para novos jogadores

  useEffect(() => {
    const fetchPlayers = async () => {
      const saved = await AsyncStorage.getItem("players");
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          // Verificar se os dados são do formato antigo (array de strings)
          if (parsedData.length > 0 && typeof parsedData[0] === 'string') {
            // Converter formato antigo para novo formato
            const convertedPlayers = parsedData.map((name: string) => ({
              name,
              skill: 3, // Valor médio padrão para jogadores existentes
              position: "Qualquer", // Posição padrão para jogadores existentes
              yellowCards: 0, // Inicializa cartões amarelos
              redCards: 0, // Inicializa cartões vermelhos
            }));
            setPlayers(convertedPlayers);
            // Salvar no novo formato
            await AsyncStorage.setItem("players", JSON.stringify(convertedPlayers));
          } 
          // Verificar se os dados são do formato sem posição
          else if (parsedData.length > 0 && !parsedData[0].hasOwnProperty('position')) {
            // Converter formato sem posição para novo formato
            const convertedPlayers = parsedData.map((player: {name: string, skill: number}) => ({
              ...player,
              position: "Qualquer", // Posição padrão para jogadores existentes
              yellowCards: 0, // Inicializa cartões amarelos
              redCards: 0, // Inicializa cartões vermelhos
            }));
            setPlayers(convertedPlayers);
            // Salvar no novo formato
            await AsyncStorage.setItem("players", JSON.stringify(convertedPlayers));
          } 
          // Verificar se os dados são do formato sem cartões
          else if (parsedData.length > 0 && (!parsedData[0].hasOwnProperty('yellowCards') || !parsedData[0].hasOwnProperty('redCards'))) {
            // Converter formato sem cartões para novo formato
            const convertedPlayers = parsedData.map((player: Player) => ({
              ...player,
              yellowCards: player.yellowCards || 0,
              redCards: player.redCards || 0,
            }));
            setPlayers(convertedPlayers);
            // Salvar no novo formato
            await AsyncStorage.setItem("players", JSON.stringify(convertedPlayers));
          } else {
            setPlayers(parsedData);
          }
        } catch (e) {
          console.error("Erro ao carregar jogadores:", e);
          setPlayers([]);
        }
      } else {
        setPlayers([]);
      }
    };
    fetchPlayers();
  }, []);

  const addPlayer = async () => {
    if (player.trim()) {
      const newPlayer = {
        name: player.trim(),
        skill: playerSkill,
        position: playerPosition,
        yellowCards: 0,
        redCards: 0
      };
      const newPlayers = [...players, newPlayer];
      setPlayers(newPlayers);
      setPlayer("");
      setPlayerSkill(3); // Resetar para o valor médio padrão
      setPlayerPosition("Qualquer"); // Resetar para a posição padrão
      await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
    }
  };

  const startEditPlayer = (idx: number) => {
    setEditingIdx(idx);
    setEditingName(players[idx].name);
    setEditingSkill(players[idx].skill);
    setEditingPosition(players[idx].position);
  };

  const saveEditPlayer = async () => {
    if (editingIdx !== null && editingName.trim()) {
      const newPlayers = [...players];
      newPlayers[editingIdx] = {
        ...players[editingIdx], // Mantém os valores existentes, incluindo cartões
        name: editingName.trim(),
        skill: editingSkill,
        position: editingPosition
      };
      setPlayers(newPlayers);
      setEditingIdx(null);
      setEditingName("");
      setEditingSkill(3); // Resetar para o valor médio padrão
      setEditingPosition("Qualquer"); // Resetar para a posição padrão
      await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
    }
  };

  const cancelEditPlayer = () => {
    setEditingIdx(null);
    setEditingName("");
    setEditingSkill(3); // Resetar para o valor médio padrão
    setEditingPosition("Qualquer"); // Resetar para a posição padrão
  };

  const deletePlayer = async (idx: number) => {
    const newPlayers = players.filter((_, i) => i !== idx);
    setPlayers(newPlayers);
    await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
    if (editingIdx === idx) cancelEditPlayer();
  };
  
  // Renderiza as estrelas para seleção de habilidade
  const renderStars = (currentValue: number, onChange: (value: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        <Text style={styles.skillLabel}>Nível de habilidade:</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              style={styles.starButton}
            >
              <Text style={[styles.starText, currentValue >= star ? styles.starActive : {}]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Renderiza o seletor de posição
  const renderPositionSelector = (currentPosition: string, onChange: (position: string) => void) => {
    return (
      <View style={styles.positionContainer}>
        <Text style={styles.positionLabel}>Posição:</Text>
        <View style={styles.positionButtonsRow}>
          {POSITIONS.map((position) => (
            <TouchableOpacity
              key={position}
              onPress={() => onChange(position)}
              style={[
                styles.positionButton,
                currentPosition === position ? styles.positionButtonActive : {}
              ]}
            >
              <Text 
                style={[
                  styles.positionButtonText, 
                  currentPosition === position ? styles.positionButtonTextActive : {}
                ]}
              >
                {position}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Cadastro de Jogadores" icon="people" theme="light" />
      <ScrollView keyboardShouldPersistTaps="handled">
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
              placeholderTextColor={theme.colors.primary}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addPlayer}>
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          {renderStars(playerSkill, setPlayerSkill)}
          {renderPositionSelector(playerPosition, setPlayerPosition)}
        </View>
      </ScrollView>
      <FlatList
        data={players}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item, index) => index.toString()}
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
                <View style={{flex: 1}}>
                  <TextInput
                    style={[
                      styles.input,
                      { marginRight: 8, backgroundColor: theme.colors.background },
                    ]}
                    value={editingName}
                    onChangeText={setEditingName}
                    placeholder="Novo nome"
                    placeholderTextColor={theme.colors.primary}
                  />
                  {renderStars(editingSkill, setEditingSkill)}
                  {renderPositionSelector(editingPosition, setEditingPosition)}
                </View>
                <View style={{flexDirection: 'column'}}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={saveEditPlayer}
                  >
                    <Text style={styles.saveBtnText}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cancelBtn, {marginTop: 4}]}
                    onPress={cancelEditPlayer}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <View style={{flexDirection: "row", alignItems: "center"}}>
                    <Text style={styles.positionText}>{item.position}</Text>
                    <View style={styles.skillStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text 
                          key={star} 
                          style={[styles.starTextSmall, item.skill >= star ? styles.starActive : {}]}
                        >
                          ★
                        </Text>
                      ))}
                    </View>
                  </View>
                  <View style={styles.cardsContainer}>
                    <View style={styles.cardItem}>
                      <Text style={styles.cardIcon}>🟨</Text>
                      <Text style={styles.cardCount}>{item.yellowCards}</Text>
                      <TouchableOpacity 
                        style={styles.cardButton}
                        onPress={() => {
                          const updatedPlayers = [...players];
                          updatedPlayers[index] = {
                            ...item,
                            yellowCards: item.yellowCards + 1
                          };
                          setPlayers(updatedPlayers);
                          AsyncStorage.setItem("players", JSON.stringify(updatedPlayers));
                        }}
                      >
                        <Text style={styles.cardButtonText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.cardButton}
                        onPress={() => {
                          const updatedPlayers = [...players];
                          updatedPlayers[index] = {
                            ...item,
                            yellowCards: Math.max(0, item.yellowCards - 1)
                          };
                          setPlayers(updatedPlayers);
                          AsyncStorage.setItem("players", JSON.stringify(updatedPlayers));
                        }}
                      >
                        <Text style={styles.cardButtonText}>-</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cardItem}>
                      <Text style={styles.cardIcon}>🟥</Text>
                      <Text style={styles.cardCount}>{item.redCards}</Text>
                      <TouchableOpacity 
                        style={styles.cardButton}
                        onPress={() => {
                          const updatedPlayers = [...players];
                          updatedPlayers[index] = {
                            ...item,
                            redCards: item.redCards + 1
                          };
                          setPlayers(updatedPlayers);
                          AsyncStorage.setItem("players", JSON.stringify(updatedPlayers));
                        }}
                      >
                        <Text style={styles.cardButtonText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.cardButton}
                        onPress={() => {
                          const updatedPlayers = [...players];
                          updatedPlayers[index] = {
                            ...item,
                            redCards: Math.max(0, item.redCards - 1)
                          };
                          setPlayers(updatedPlayers);
                          AsyncStorage.setItem("players", JSON.stringify(updatedPlayers));
                        }}
                      >
                        <Text style={styles.cardButtonText}>-</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
        ListEmptyComponent={() => (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>Jogadores cadastrados</Text>
            <Text style={styles.emptyText}>Nenhum jogador cadastrado.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...theme.components.card,
    margin: theme.spacing.md,
  },
  listCard: {
    ...theme.components.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  listTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  input: {
    ...theme.components.input,
    flex: 1,
    color: theme.colors.primary,
  },
  addBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
  },
  addBtnText: {
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: theme.typography.body.fontSize,
  },
  playerCard: {
    ...theme.components.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  iconBtn: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  iconText: {
    fontSize: 20,
  },
  saveBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  saveBtnText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  cancelBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs
  },
  cancelBtnText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  positionText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.md,
  },
  skillStars: {
    flexDirection: "row",
    gap: 2,
  },
  starActive: {
    color: theme.colors.primary,
  },
  starsContainer: {
    marginTop: theme.spacing.md,
  },
  skillLabel: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: "500",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  starButton: {
    padding: 6,
  },
  starText: {
    fontSize: 28,
    color: theme.colors.border,
  },
  starTextSmall: {
    fontSize: 18,
    color: theme.colors.border,
  },
  positionContainer: {
    marginTop: theme.spacing.md,
  },
  positionLabel: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontWeight: "500",
  },
  positionButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  positionButton: {
    ...theme.components.button,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  positionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
  },
  positionButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: theme.typography.body.fontSize,
  },
  positionButtonTextActive: {
    color: theme.colors.white,
  },
  emptyText: {
    ...theme.typography.body,
    textAlign: "center",
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardCount: {
    ...theme.typography.body,
    color: theme.colors.primary,
    minWidth: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  cardButton: {
    backgroundColor: theme.colors.background,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  cardButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
});
