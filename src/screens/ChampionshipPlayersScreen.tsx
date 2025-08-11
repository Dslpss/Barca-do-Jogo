import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { Player, Team } from "../types/championship";
import { validateCPF } from "../utils/cpfValidator";

// Posições disponíveis
const POSITIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Meio-campo",
  "Atacante",
  "Qualquer",
];

const ChampionshipPlayersScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const {
    currentChampionship,
    addPlayerToTeam,
    removePlayerFromTeam,
    loadCurrentChampionship,
  } = useChampionship();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [playerName, setPlayerName] = useState("");
  const [playerSkill, setPlayerSkill] = useState(3);
  const [playerPosition, setPlayerPosition] = useState("Qualquer");
  const [playerCpf, setPlayerCpf] = useState("");

  // Função para formatar CPF automaticamente
  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const cleanValue = value.replace(/\D/g, "");

    // Aplica máscara
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return cleanValue
      .substring(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setPlayerCpf(formatted);
  };

  useEffect(() => {
    if (isFocused) {
      loadCurrentChampionship();
    }
  }, [isFocused]);

  const handleAddPlayer = async () => {
    if (!playerName.trim()) {
      Alert.alert("Erro", "Digite um nome para o jogador");
      return;
    }

    if (!selectedTeamId) {
      Alert.alert("Erro", "Selecione um time");
      return;
    }

    // Validar CPF se fornecido (e não vazio)
    const cpfValue = playerCpf.trim();
    if (cpfValue && !validateCPF(cpfValue.replace(/\D/g, ""))) {
      Alert.alert("Erro", "CPF inválido. Verifique os números digitados.");
      return;
    }

    try {
      const newPlayer: Omit<Player, "id"> = {
        name: playerName.trim(),
        skill: playerSkill,
        position: playerPosition,
        yellowCards: 0,
        redCards: 0,
        ...(cpfValue && { cpf: cpfValue }), // Só incluir CPF se fornecido e não vazio
      };

      await addPlayerToTeam(selectedTeamId, newPlayer);
      setPlayerName("");
      setPlayerSkill(3);
      setPlayerPosition("Qualquer");
      setPlayerCpf("");
      setSelectedTeamId("");
      setShowAddModal(false);
      Alert.alert("Sucesso", "Jogador adicionado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao adicionar jogador");
    }
  };

  const handleRemovePlayer = (team: Team, player: Player) => {
    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja remover "${player.name}" do time "${team.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removePlayerFromTeam(team.id, player.id);
              Alert.alert("Sucesso", "Jogador removido com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao remover jogador");
            }
          },
        },
      ]
    );
  };

  const renderStars = (
    currentValue: number,
    onChange: (value: number) => void
  ) => {
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
              <Text
                style={[
                  styles.starText,
                  currentValue >= star && styles.starActive,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderPlayerCard = (player: Player, team: Team) => (
    <View key={player.id} style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          {player.cpf && (
            <Text style={styles.playerCpf}>CPF: {player.cpf}</Text>
          )}
          <View style={styles.playerDetails}>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{player.position}</Text>
            </View>
            <View style={styles.skillStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  style={[
                    styles.starTextSmall,
                    player.skill >= star && styles.starActiveSmall,
                  ]}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removePlayerButton}
          onPress={() => handleRemovePlayer(team, player)}
        >
          <Text style={styles.removePlayerButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTeamSection = ({ item: team }: { item: Team }) => (
    <View style={styles.teamSection}>
      <View style={styles.teamSectionHeader}>
        <View style={styles.teamTitleContainer}>
          <Text style={styles.teamSectionTitle}>{team.name}</Text>
          {team.color && (
            <View
              style={[
                styles.teamColorIndicator,
                { backgroundColor: team.color },
              ]}
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.addPlayerButton}
          onPress={() => {
            setSelectedTeamId(team.id);
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addPlayerButtonText}>+ Jogador</Text>
        </TouchableOpacity>
      </View>

      {team.players.length === 0 ? (
        <View style={styles.noPlayersContainer}>
          <Text style={styles.noPlayersText}>Nenhum jogador cadastrado</Text>
        </View>
      ) : (
        <View style={styles.playersContainer}>
          {team.players.map((player) => renderPlayerCard(player, team))}
        </View>
      )}
    </View>
  );

  if (!currentChampionship) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Jogadores do Campeonato"
          icon="person"
          theme="light"
        />
        <View style={styles.noChampionshipContainer}>
          <Text style={styles.noChampionshipText}>
            Nenhum campeonato selecionado
          </Text>
          <Text style={styles.noChampionshipSubtext}>
            Vá para a tela de campeonatos e selecione ou crie um campeonato
            primeiro.
          </Text>
        </View>
      </View>
    );
  }

  const totalPlayers = currentChampionship.teams.reduce(
    (total, team) => total + team.players.length,
    0
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Jogadores do Campeonato" icon="person" theme="light" />

      <View style={styles.content}>
        <View style={styles.championshipInfo}>
          <Text style={styles.championshipName}>
            {currentChampionship.name}
          </Text>
          <Text style={styles.playersCount}>
            {totalPlayers} jogador{totalPlayers !== 1 ? "es" : ""} •{" "}
            {currentChampionship.teams.length} time
            {currentChampionship.teams.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {currentChampionship.teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum time cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Para adicionar jogadores, você precisa criar times primeiro.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate("ChampionshipTeams")}
            >
              <Text style={styles.emptyActionText}>Adicionar Times</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={currentChampionship.teams}
            renderItem={renderTeamSection}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modal para adicionar jogador */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Jogador</Text>

            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Nome do jogador"
              value={playerName}
              onChangeText={setPlayerName}
              placeholderTextColor={theme.colors.textSecondary}
              selectionColor={theme.colors.primary}
            />

            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="CPF (opcional)"
              value={playerCpf}
              onChangeText={handleCPFChange}
              placeholderTextColor={theme.colors.textSecondary}
              selectionColor={theme.colors.primary}
              keyboardType="numeric"
              maxLength={14} // Permite formatação XXX.XXX.XXX-XX
            />

            <Text style={styles.positionLabel}>Posição:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.positionOptions}
            >
              {POSITIONS.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={[
                    styles.positionOption,
                    playerPosition === position &&
                      styles.selectedPositionOption,
                  ]}
                  onPress={() => setPlayerPosition(position)}
                >
                  <Text
                    style={[
                      styles.positionOptionText,
                      playerPosition === position &&
                        styles.selectedPositionOptionText,
                    ]}
                  >
                    {position}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {renderStars(playerSkill, setPlayerSkill)}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setPlayerName("");
                  setPlayerSkill(3);
                  setPlayerPosition("Qualquer");
                  setPlayerCpf("");
                  setSelectedTeamId("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddPlayer}
              >
                <Text style={styles.confirmButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  noChampionshipContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  noChampionshipText: {
    ...theme.typography.h2,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  noChampionshipSubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  championshipInfo: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  championshipName: {
    ...theme.typography.h2,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  playersCount: {
    ...theme.typography.body,
    color: theme.colors.white,
    opacity: 0.9,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  emptyActionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
  },
  emptyActionText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  listContainer: {
    paddingBottom: theme.spacing.lg,
  },
  teamSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  teamSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  teamTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamSectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  teamColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addPlayerButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  addPlayerButtonText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
  },
  noPlayersContainer: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  noPlayersText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  playersContainer: {
    gap: theme.spacing.sm,
  },
  playerCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  playerCpf: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontSize: 11,
  },
  playerDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  positionBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  positionText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontSize: 10,
  },
  skillStars: {
    flexDirection: "row",
  },
  starTextSmall: {
    fontSize: 12,
    color: theme.colors.border,
    marginRight: 1,
  },
  starActiveSmall: {
    color: theme.colors.primary,
  },
  removePlayerButton: {
    padding: theme.spacing.xs,
  },
  removePlayerButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  input: {
    ...theme.components.input,
    marginBottom: theme.spacing.md,
  },
  positionLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  positionOptions: {
    marginBottom: theme.spacing.md,
  },
  positionOption: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  selectedPositionOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  positionOptionText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  selectedPositionOptionText: {
    color: theme.colors.white,
  },
  starsContainer: {
    marginBottom: theme.spacing.lg,
  },
  skillLabel: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  starButton: {
    padding: theme.spacing.sm,
  },
  starText: {
    fontSize: 24,
    color: theme.colors.border,
  },
  starActive: {
    color: theme.colors.primary,
  },
  modalButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  confirmButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
});

export default ChampionshipPlayersScreen;
