import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { ChampionshipService } from "../services/championshipService";
import {
  Match,
  Team,
  GoalScorer,
  MatchGenerationOptions,
  ManualMatch,
  Championship,
} from "../types/championship";

const ChampionshipMatchesScreen = () => {
  const isFocused = useIsFocused();
  const {
    currentChampionship,
    generateMatches,
    recordMatchResult,
    loadCurrentChampionship,
    forceReloadCurrentChampionship,
    getPossibleMatchups,
    getMatchesByRound,
  } = useChampionship();

  const [matchScores, setMatchScores] = useState<{
    [matchId: string]: {
      home: string;
      away: string;
      homeGoalScorers: GoalScorer[];
      awayGoalScorers: GoalScorer[];
    };
  }>({});

  const [playerDetailsModal, setPlayerDetailsModal] = useState<{
    visible: boolean;
    matchId: string;
    team: "home" | "away";
    playerId: string;
    playerName: string;
  } | null>(null);

  // Novos estados para as funcionalidades avançadas
  const [showMatchGenerationModal, setShowMatchGenerationModal] =
    useState(false);
  const [selectedManualMatches, setSelectedManualMatches] = useState<
    ManualMatch[]
  >([]);
  const [showManualMatchSelection, setShowManualMatchSelection] =
    useState(false);
  const [customMatchForm, setCustomMatchForm] = useState({
    homeTeam: "",
    awayTeam: "",
  });

  useEffect(() => {
    if (isFocused) {
      console.log("🔄 Tela ganhou foco, forçando recarregamento...");
      // Usar a função específica para forçar recarregamento
      forceReloadCurrentChampionship();
    }
  }, [isFocused]);

  const handleGenerateMatches = async () => {
    if (!currentChampionship) {
      Alert.alert("Erro", "Nenhum campeonato selecionado");
      return;
    }

    if ((currentChampionship.teams?.length || 0) < 2) {
      Alert.alert(
        "Erro",
        "É necessário pelo menos 2 times para gerar partidas"
      );
      return;
    }

    // Perguntar ao usuário se deseja gerar todas as partidas automaticamente
    const teamsCount = currentChampionship.teams?.length || 0;
    const totalMatches = teamsCount * (teamsCount - 1);

    Alert.alert(
      "Gerar Partidas",
      `Deseja gerar automaticamente todas as partidas do campeonato?\n\nSerão criadas ${totalMatches} partidas (ida e volta).`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Seleção Manual",
          onPress: () => setShowMatchGenerationModal(true),
        },
        {
          text: "Gerar Todas",
          onPress: async () => {
            try {
              // Criar automaticamente todos os confrontos possíveis (ida e volta)
              const teams = currentChampionship.teams;
              const manualMatches: ManualMatch[] = [];

              // Gerar confrontos de ida e volta
              for (let round = 1; round <= 2; round++) {
                for (let i = 0; i < teams.length; i++) {
                  for (let j = 0; j < teams.length; j++) {
                    if (i !== j) {
                      manualMatches.push({
                        homeTeamId: teams[i].id,
                        awayTeamId: teams[j].id,
                        round: round,
                      });
                    }
                  }
                }
              }

              const options: MatchGenerationOptions = {
                type: "manual",
                manualMatches: manualMatches,
              };

              await generateMatches(options);
              Alert.alert(
                "Sucesso",
                `${manualMatches.length} partidas geradas com sucesso!`
              );
            } catch (error) {
              console.error("Erro ao gerar partidas:", error);
              Alert.alert("Erro", "Erro ao gerar partidas. Tente novamente.");
            }
          },
        },
      ]
    );
  };

  const handleConfirmGeneration = async () => {
    if (!currentChampionship) return;

    if (selectedManualMatches.length === 0) {
      Alert.alert("Erro", "Selecione pelo menos uma partida para gerar");
      return;
    }

    try {
      const options: MatchGenerationOptions = {
        type: "manual",
        manualMatches: selectedManualMatches,
      };

      await generateMatches(options);
      setShowMatchGenerationModal(false);
      setSelectedManualMatches([]);
      Alert.alert("Sucesso", "Partidas geradas com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Erro ao gerar partidas");
    }
  };

  const handleAddManualMatch = (homeTeamId: string, awayTeamId: string) => {
    const newMatch: ManualMatch = {
      homeTeamId,
      awayTeamId,
      round: 1, // Pode ser configurável no futuro
    };

    setSelectedManualMatches((prev) => [...prev, newMatch]);
  };

  const handleRemoveManualMatch = (index: number) => {
    setSelectedManualMatches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomMatch = () => {
    if (!customMatchForm.homeTeam || !customMatchForm.awayTeam) {
      Alert.alert("Erro", "Selecione ambos os times");
      return;
    }

    if (customMatchForm.homeTeam === customMatchForm.awayTeam) {
      Alert.alert("Erro", "Um time não pode jogar contra ele mesmo");
      return;
    }

    // Verificar se o confronto já existe
    const matchExists = selectedManualMatches.some(
      (match) =>
        (match.homeTeamId === customMatchForm.homeTeam &&
          match.awayTeamId === customMatchForm.awayTeam) ||
        (match.homeTeamId === customMatchForm.awayTeam &&
          match.awayTeamId === customMatchForm.homeTeam)
    );

    if (matchExists) {
      Alert.alert("Erro", "Este confronto já foi adicionado");
      return;
    }

    const newMatch: ManualMatch = {
      homeTeamId: customMatchForm.homeTeam,
      awayTeamId: customMatchForm.awayTeam,
      round: 1,
    };

    setSelectedManualMatches((prev) => [...prev, newMatch]);
    setCustomMatchForm({ homeTeam: "", awayTeam: "" });
  };

  const getPossibleMatchupsForUI = () => {
    if (!currentChampionship?.teams) return [];
    return getPossibleMatchups();
  };

  const getMatchesByRoundForUI = () => {
    if (!currentChampionship) return {};
    return getMatchesByRound();
  };

  const handleRecordResult = async (match: Match) => {
    console.log("🎯 Iniciando registro de resultado:", match.id);

    const scoreData = matchScores[match.id];
    if (!scoreData || !scoreData.home || !scoreData.away) {
      Alert.alert("Erro", "Digite os placares da partida");
      return;
    }

    const homeScore = parseInt(scoreData.home);
    const awayScore = parseInt(scoreData.away);

    console.log("📊 Placares:", { homeScore, awayScore });

    if (
      isNaN(homeScore) ||
      isNaN(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      Alert.alert("Erro", "Digite placares válidos");
      return;
    }

    try {
      console.log("🚀 Chamando recordMatchResult...");
      await recordMatchResult(
        match.id,
        homeScore,
        awayScore,
        scoreData.homeGoalScorers,
        scoreData.awayGoalScorers
      );
      console.log("✅ recordMatchResult concluído, atualizando UI...");

      // Limpar os campos de placar após registrar o resultado
      setMatchScores((prev) => {
        const updated = { ...prev };
        delete updated[match.id];
        return updated;
      });

      Alert.alert("Sucesso", "Resultado registrado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao registrar resultado:", error);
      Alert.alert("Erro", "Erro ao registrar resultado");
    }
  };

  const getTeamById = (teamId: string): Team | undefined => {
    return currentChampionship?.teams.find((t) => t.id === teamId);
  };

  const updateMatchScore = (matchId: string, field: string, value: string) => {
    setMatchScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value,
      },
    }));
  };

  const addGoalScorer = (
    matchId: string,
    team: "home" | "away",
    playerId: string
  ) => {
    // Abrir modal para definir detalhes
    const playerName =
      currentChampionship?.teams
        .flatMap((t) => t.players)
        .find((p) => p.id === playerId)?.name || "";

    setPlayerDetailsModal({
      visible: true,
      matchId,
      team,
      playerId,
      playerName,
    });
  };

  const removeGoalScorer = (
    matchId: string,
    team: "home" | "away",
    playerId: string
  ) => {
    setMatchScores((prev) => {
      const current = prev[matchId] || {
        home: "",
        away: "",
        homeGoalScorers: [],
        awayGoalScorers: [],
      };
      const field = team === "home" ? "homeGoalScorers" : "awayGoalScorers";
      const currentScorers = current[field] || [];

      return {
        ...prev,
        [matchId]: {
          ...current,
          [field]: currentScorers.filter(
            (scorer) => scorer.playerId !== playerId
          ),
        },
      };
    });
  };

  const addPlayerDetails = (
    goals: number,
    yellowCard: boolean,
    redCard: boolean
  ) => {
    if (!playerDetailsModal) return;

    const { matchId, team, playerId } = playerDetailsModal;

    setMatchScores((prev) => {
      const current = prev[matchId] || {
        home: "",
        away: "",
        homeGoalScorers: [],
        awayGoalScorers: [],
      };
      const field = team === "home" ? "homeGoalScorers" : "awayGoalScorers";
      const currentScorers = current[field] || [];

      // Verificar se jogador já existe, se sim, atualizar
      const existingIndex = currentScorers.findIndex(
        (scorer) => scorer.playerId === playerId
      );
      let newScorers;

      if (existingIndex >= 0) {
        newScorers = [...currentScorers];
        newScorers[existingIndex] = {
          playerId,
          goals,
          yellowCard: yellowCard || newScorers[existingIndex].yellowCard,
          redCard: redCard || newScorers[existingIndex].redCard,
        };
      } else {
        newScorers = [
          ...currentScorers,
          { playerId, goals, yellowCard, redCard },
        ];
      }

      return {
        ...prev,
        [matchId]: {
          ...current,
          [field]: newScorers,
        },
      };
    });

    setPlayerDetailsModal(null);
  };

  const renderGoalScorerButtons = (match: Match, team: "home" | "away") => {
    const teamId = team === "home" ? match.homeTeam : match.awayTeam;
    const teamData = getTeamById(teamId);
    if (!teamData || teamData.players.length === 0) return <></>;

    const selectedScorers =
      matchScores[match.id]?.[
        team === "home" ? "homeGoalScorers" : "awayGoalScorers"
      ] || [];

    return (
      <View style={styles.goalScorersSection}>
        <Text style={modalStyles.goalScorersTitle}>{teamData.name}:</Text>
        <View style={styles.goalScorersGrid}>
          {teamData.players.map((player) => {
            const playerScorer = selectedScorers.find(
              (scorer) => scorer.playerId === player.id
            );
            const isSelected = !!playerScorer;

            return (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.goalScorerButton,
                  isSelected && styles.goalScorerButtonSelected,
                ]}
                onPress={() => {
                  if (isSelected) {
                    removeGoalScorer(match.id, team, player.id);
                  } else {
                    addGoalScorer(match.id, team, player.id);
                  }
                }}
              >
                <Text
                  style={[
                    styles.goalScorerButtonText,
                    isSelected && styles.goalScorerButtonTextSelected,
                  ]}
                >
                  {player.name}
                  {isSelected && playerScorer && (
                    <Text style={{ fontSize: 10 }}>
                      {"\n⚽"}
                      {playerScorer.goals}
                      {playerScorer.yellowCard ? " 🟨" : ""}
                      {playerScorer.redCard ? " 🟥" : ""}
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedScorers.length > 0 && (
          <Text style={styles.selectedScorersText}>
            Goleadores:{" "}
            {selectedScorers
              .map((scorer, index) => {
                const player = teamData.players.find(
                  (p) => p.id === scorer.playerId
                );
                if (!player) return "";
                const prefix = index > 0 ? ", " : "";
                const cards =
                  (scorer.yellowCard ? "🟨" : "") +
                  (scorer.redCard ? "🟥" : "");
                return (
                  prefix +
                  player.name +
                  " (" +
                  scorer.goals +
                  "⚽" +
                  cards +
                  ")"
                );
              })
              .filter(Boolean)
              .join("")}
          </Text>
        )}
      </View>
    );
  };

  const renderMatchItem = ({ item: match }: { item: Match }) => {
    const homeTeam = getTeamById(match.homeTeam);
    const awayTeam = getTeamById(match.awayTeam);

    if (!homeTeam || !awayTeam) return <></>;

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.teamsContainer}>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>{homeTeam.name || "Time"}</Text>
              {homeTeam.color && (
                <View
                  style={[
                    styles.teamColorIndicator,
                    { backgroundColor: homeTeam.color },
                  ]}
                />
              )}
            </View>
            <Text style={styles.vsText}>vs</Text>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>{awayTeam.name || "Time"}</Text>
              {awayTeam.color && (
                <View
                  style={[
                    styles.teamColorIndicator,
                    { backgroundColor: awayTeam.color },
                  ]}
                />
              )}
            </View>
          </View>

          {match.played && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultText}>
                {match.homeScore ?? 0} - {match.awayScore ?? 0}
              </Text>
            </View>
          )}
        </View>

        {match.played ? (
          <View style={styles.playedMatchInfo}>
            <Text style={styles.playedText}>
              Partida finalizada em{" "}
              {match.date
                ? new Date(match.date).toLocaleDateString("pt-BR")
                : "Data não informada"}
            </Text>
            {(match.homeGoalScorers?.length ||
              match.awayGoalScorers?.length) && (
              <View style={styles.goalScorersInfo}>
                {match.homeGoalScorers && match.homeGoalScorers.length > 0 && (
                  <Text style={styles.goalScorersInfoText}>
                    ⚽ {homeTeam.name || "Time"}:{" "}
                    {match.homeGoalScorers
                      .map((scorer) => {
                        const player = homeTeam.players.find(
                          (p) => p.id === scorer.playerId
                        );
                        return player
                          ? `${player.name} (${scorer.goals}⚽${
                              scorer.yellowCard ? " 🟨" : ""
                            }${scorer.redCard ? " 🟥" : ""})`
                          : "";
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                )}
                {match.awayGoalScorers && match.awayGoalScorers.length > 0 && (
                  <Text style={styles.goalScorersInfoText}>
                    ⚽ {awayTeam.name || "Time"}:{" "}
                    {match.awayGoalScorers
                      .map((scorer) => {
                        const player = awayTeam.players.find(
                          (p) => p.id === scorer.playerId
                        );
                        return player
                          ? `${player.name} (${scorer.goals}⚽${
                              scorer.yellowCard ? " 🟨" : ""
                            }${scorer.redCard ? " 🟥" : ""})`
                          : "";
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.matchForm}>
            <View style={styles.scoreInputs}>
              <TextInput
                style={styles.scoreInput}
                placeholder="0"
                keyboardType="numeric"
                value={matchScores[match.id]?.home || ""}
                onChangeText={(text) =>
                  updateMatchScore(match.id, "home", text)
                }
                placeholderTextColor={theme.colors.textSecondary}
              />
              <Text style={styles.scoreSeparator}>-</Text>
              <TextInput
                style={styles.scoreInput}
                placeholder="0"
                keyboardType="numeric"
                value={matchScores[match.id]?.away || ""}
                onChangeText={(text) =>
                  updateMatchScore(match.id, "away", text)
                }
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            {renderGoalScorerButtons(match, "home")}
            {renderGoalScorerButtons(match, "away")}

            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => handleRecordResult(match)}
            >
              <Text style={styles.recordButtonText}>Registrar Resultado</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMatchesByRounds = () => {
    const matchesByRound = getMatchesByRoundForUI();
    const rounds = Object.keys(matchesByRound).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    if (rounds.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma partida encontrada</Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        {rounds.map((round) => (
          <View key={round} style={styles.roundContainer}>
            <Text style={styles.roundTitle}>🏁 Rodada {round}</Text>
            {matchesByRound[parseInt(round)].map((match) => (
              <View key={match.id} style={styles.matchInRound}>
                {renderMatchItem({ item: match })}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (!currentChampionship) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Partidas do Campeonato"
          icon="calendar"
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

  const playedMatches =
    currentChampionship?.matches?.filter((m) => m.played).length || 0;
  const totalMatches = currentChampionship?.matches?.length || 0;

  return (
    <View style={styles.container}>
      <AppHeader title="Partidas do Campeonato" icon="calendar" theme="light" />

      <View style={styles.content}>
        <View style={styles.championshipInfo}>
          <View style={styles.championshipHeader}>
            <View style={styles.championshipTitleContainer}>
              <Text style={styles.championshipIcon}>🏆</Text>
              <Text style={styles.championshipName}>
                {currentChampionship.name}
              </Text>
            </View>
            <View style={styles.championshipBadge}>
              <Text style={styles.championshipBadgeText}>ATIVO</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Progresso do Campeonato</Text>
              <Text style={styles.matchesProgress}>
                {playedMatches} de {currentChampionship?.matches?.length || 0}{" "}
                partidas realizadas
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width:
                        totalMatches > 0
                          ? `${(playedMatches / totalMatches) * 100}%`
                          : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {totalMatches > 0
                  ? Math.round((playedMatches / totalMatches) * 100)
                  : 0}
                %
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {currentChampionship.teams?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Times</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalMatches}</Text>
              <Text style={styles.statLabel}>Partidas</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{playedMatches}</Text>
              <Text style={styles.statLabel}>Finalizadas</Text>
            </View>
          </View>
        </View>

        {(currentChampionship.teams?.length || 0) < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Adicione pelo menos 2 times</Text>
            <Text style={styles.emptySubtext}>
              É necessário ter pelo menos 2 times para gerar partidas
            </Text>
          </View>
        ) : (currentChampionship?.matches?.length || 0) === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma partida gerada</Text>
            <Text style={styles.emptySubtext}>
              Gere as partidas para começar o campeonato
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateMatches}
            >
              <Text style={styles.generateButtonText}>Gerar Partidas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.sectionTitle}>Partidas</Text>
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleGenerateMatches}
              >
                <Text style={styles.regenerateButtonText}>Regerar</Text>
              </TouchableOpacity>
            </View>

            {renderMatchesByRounds()}
          </>
        )}
      </View>

      {/* Modal de Detalhes do Jogador */}
      <PlayerDetailsModal
        visible={playerDetailsModal?.visible || false}
        playerName={playerDetailsModal?.playerName || ""}
        onClose={() => setPlayerDetailsModal(null)}
        onSave={addPlayerDetails}
      />

      {/* Modal de Configuração de Geração de Partidas */}
      <MatchGenerationModal
        visible={showMatchGenerationModal}
        selectedManualMatches={selectedManualMatches}
        possibleMatchups={getPossibleMatchupsForUI()}
        onAddManualMatch={handleAddManualMatch}
        onRemoveManualMatch={handleRemoveManualMatch}
        onAddCustomMatch={handleAddCustomMatch}
        customMatchForm={customMatchForm}
        onCustomMatchFormChange={setCustomMatchForm}
        teams={currentChampionship?.teams || []}
        onConfirm={handleConfirmGeneration}
        onClose={() => {
          setShowMatchGenerationModal(false);
          setSelectedManualMatches([]);
        }}
      />
    </View>
  );
};

// Componente Modal para detalhes do jogador
const PlayerDetailsModal = ({
  visible,
  playerName,
  onClose,
  onSave,
}: {
  visible: boolean;
  playerName: string;
  onClose: () => void;
  onSave: (goals: number, yellowCard: boolean, redCard: boolean) => void;
}) => {
  const [goals, setGoals] = useState("1");
  const [yellowCard, setYellowCard] = useState(false);
  const [redCard, setRedCard] = useState(false);

  const handleSave = () => {
    const goalsNum = parseInt(goals) || 1;
    onSave(goalsNum, yellowCard, redCard);
    // Reset values
    setGoals("1");
    setYellowCard(false);
    setRedCard(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modal}>
          <Text style={modalStyles.title}>Detalhes - {playerName}</Text>

          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>Quantidade de Gols:</Text>
            <TextInput
              style={modalStyles.input}
              value={goals}
              onChangeText={setGoals}
              keyboardType="numeric"
              placeholder="1"
            />
          </View>

          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>Cartões:</Text>
            <View style={modalStyles.cardRow}>
              <TouchableOpacity
                style={[
                  modalStyles.cardButton,
                  yellowCard && modalStyles.cardButtonSelected,
                ]}
                onPress={() => setYellowCard(!yellowCard)}
              >
                <Text style={modalStyles.cardText}>🟨 Amarelo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.cardButton,
                  redCard && modalStyles.cardButtonSelected,
                ]}
                onPress={() => setRedCard(!redCard)}
              >
                <Text style={modalStyles.cardText}>🟥 Vermelho</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={modalStyles.buttonRow}>
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.saveButton}
              onPress={handleSave}
            >
              <Text style={modalStyles.saveButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Componente Modal para configuração de geração de partidas
const MatchGenerationModal = ({
  visible,
  selectedManualMatches,
  possibleMatchups,
  onAddManualMatch,
  onRemoveManualMatch,
  onAddCustomMatch,
  customMatchForm,
  onCustomMatchFormChange,
  teams,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  selectedManualMatches: ManualMatch[];
  possibleMatchups: { homeTeam: Team; awayTeam: Team }[];
  onAddManualMatch: (homeTeamId: string, awayTeamId: string) => void;
  onRemoveManualMatch: (index: number) => void;
  onAddCustomMatch: () => void;
  customMatchForm: { homeTeam: string; awayTeam: string };
  onCustomMatchFormChange: (form: {
    homeTeam: string;
    awayTeam: string;
  }) => void;
  teams: Team[];
  onConfirm: () => void;
  onClose: () => void;
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { maxHeight: "80%" }]}>
          <Text style={modalStyles.title}>⚽ Seleção Manual de Partidas</Text>

          {/* Seção para criar confrontos personalizados */}
          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>
              🎯 Criar Confronto Personalizado:
            </Text>

            <View style={modalStyles.teamSelectionRow}>
              <View style={modalStyles.teamSelector}>
                <Text style={modalStyles.teamSelectorLabel}>Time da Casa:</Text>
                <TouchableOpacity
                  style={[
                    modalStyles.teamSelectorButton,
                    !customMatchForm.homeTeam &&
                      modalStyles.teamSelectorButtonEmpty,
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Selecionar Time da Casa",
                      "Escolha o time da casa:",
                      teams
                        .map((team) => ({
                          text: team.name,
                          onPress: () =>
                            onCustomMatchFormChange({
                              ...customMatchForm,
                              homeTeam: team.id,
                            }),
                        }))
                        .concat([{ text: "Cancelar", onPress: () => {} }])
                    );
                  }}
                >
                  <Text
                    style={[
                      modalStyles.teamSelectorText,
                      !customMatchForm.homeTeam &&
                        modalStyles.teamSelectorTextEmpty,
                    ]}
                  >
                    {customMatchForm.homeTeam
                      ? teams.find((t) => t.id === customMatchForm.homeTeam)
                          ?.name || "Time não encontrado"
                      : "Selecionar"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={modalStyles.vsText}>VS</Text>

              <View style={modalStyles.teamSelector}>
                <Text style={modalStyles.teamSelectorLabel}>
                  Time Visitante:
                </Text>
                <TouchableOpacity
                  style={[
                    modalStyles.teamSelectorButton,
                    !customMatchForm.awayTeam &&
                      modalStyles.teamSelectorButtonEmpty,
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Selecionar Time Visitante",
                      "Escolha o time visitante:",
                      teams
                        .map((team) => ({
                          text: team.name,
                          onPress: () =>
                            onCustomMatchFormChange({
                              ...customMatchForm,
                              awayTeam: team.id,
                            }),
                        }))
                        .concat([{ text: "Cancelar", onPress: () => {} }])
                    );
                  }}
                >
                  <Text
                    style={[
                      modalStyles.teamSelectorText,
                      !customMatchForm.awayTeam &&
                        modalStyles.teamSelectorTextEmpty,
                    ]}
                  >
                    {customMatchForm.awayTeam
                      ? teams.find((t) => t.id === customMatchForm.awayTeam)
                          ?.name || "Time não encontrado"
                      : "Selecionar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={modalStyles.addCustomMatchButton}
              onPress={onAddCustomMatch}
            >
              <Text style={modalStyles.addCustomMatchButtonText}>
                + Adicionar Confronto
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.label}>
            Confrontos Selecionados ({selectedManualMatches.length}):
          </Text>

          {selectedManualMatches.length > 0 && (
            <ScrollView style={modalStyles.selectedMatchesList}>
              {selectedManualMatches.map((match, index) => {
                const homeTeam = possibleMatchups.find(
                  (m) => m.homeTeam.id === match.homeTeamId
                )?.homeTeam;
                const awayTeam = possibleMatchups.find(
                  (m) => m.awayTeam.id === match.awayTeamId
                )?.awayTeam;

                return (
                  <View key={index} style={modalStyles.selectedMatchItem}>
                    <Text style={modalStyles.selectedMatchText}>
                      {homeTeam?.name || "Time não encontrado"} vs{" "}
                      {awayTeam?.name || "Time não encontrado"}
                    </Text>
                    <TouchableOpacity
                      style={modalStyles.removeMatchButton}
                      onPress={() => onRemoveManualMatch(index)}
                    >
                      <Text style={modalStyles.removeMatchButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Seção opcional para confrontos pré-definidos */}
          <Text style={modalStyles.label}>
            📋 Ou escolha confrontos pré-definidos:
          </Text>
          <ScrollView style={modalStyles.availableMatchesList}>
            {possibleMatchups.map((matchup, index) => {
              const isAlreadySelected = selectedManualMatches.some(
                (m) =>
                  (m.homeTeamId === matchup.homeTeam.id &&
                    m.awayTeamId === matchup.awayTeam.id) ||
                  (m.homeTeamId === matchup.awayTeam.id &&
                    m.awayTeamId === matchup.homeTeam.id)
              );

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    modalStyles.availableMatchItem,
                    isAlreadySelected && modalStyles.availableMatchItemDisabled,
                  ]}
                  onPress={() => {
                    if (!isAlreadySelected) {
                      onAddManualMatch(
                        matchup.homeTeam.id,
                        matchup.awayTeam.id
                      );
                    }
                  }}
                  disabled={isAlreadySelected}
                >
                  <Text
                    style={[
                      modalStyles.availableMatchText,
                      isAlreadySelected &&
                        modalStyles.availableMatchTextDisabled,
                    ]}
                  >
                    {matchup.homeTeam?.name || "Time"} vs{" "}
                    {matchup.awayTeam?.name || "Time"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Botões de Ação */}
          <View style={modalStyles.buttonRow}>
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={modalStyles.saveButton}
              onPress={onConfirm}
            >
              <Text style={modalStyles.saveButtonText}>
                Gerar ({selectedManualMatches.length} partidas)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  championshipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  championshipTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  championshipIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  championshipName: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  championshipBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  championshipBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: 10,
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressInfo: {
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: "600",
  },
  matchesProgress: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "500",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "bold",
    minWidth: 35,
    textAlign: "right",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
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
  generateButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.spacing.sm,
  },
  generateButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  regenerateButton: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  regenerateButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  listContainer: {
    paddingBottom: theme.spacing.lg,
  },
  matchCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  teamName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
    marginRight: theme.spacing.xs,
  },
  teamColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  vsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.md,
  },
  resultBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  resultText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
  },
  playedMatchInfo: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  playedText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  goalScorersInfo: {
    marginTop: theme.spacing.xs,
  },
  goalScorersInfoText: {
    ...theme.typography.caption,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  matchesInfo: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "500",
  },
  matchForm: {
    gap: theme.spacing.md,
  },
  scoreInputs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    textAlign: "center",
    width: 60,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  scoreSeparator: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
  },
  goalScorersSection: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  goalScorersTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  goalScorersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  goalScorerButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  goalScorerButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  goalScorerButtonText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  goalScorerButtonTextSelected: {
    color: theme.colors.white,
  },
  selectedScorersText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  recordButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
  },
  recordButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  // Estilos para visualização por rodadas
  roundContainer: {
    marginBottom: theme.spacing.lg,
  },
  roundTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontWeight: "bold",
  },
  matchInRound: {
    marginBottom: theme.spacing.sm,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    width: "80%",
    maxWidth: 400,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: "600",
  },
  goalScorersTitle: {
    ...theme.typography.label,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  cardRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  cardButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: "center",
    backgroundColor: theme.colors.card,
  },
  cardButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cardText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    alignItems: "center",
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  // Novos estilos para o modal de geração de partidas
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    maxWidth: "90%",
    width: "100%",
  },
  typeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  typeButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "600",
  },
  typeButtonTextSelected: {
    color: theme.colors.white,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  sliderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderButtonText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  sliderValue: {
    minWidth: 60,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
  },
  sliderValueText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 18,
  },
  sublabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  selectedMatchesList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    marginVertical: theme.spacing.sm,
  },
  selectedMatchItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedMatchText: {
    ...theme.typography.body,
    color: theme.colors.text,
    flex: 1,
  },
  removeMatchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  removeMatchButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  availableMatchesList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  availableMatchItem: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  availableMatchItemDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  availableMatchText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  availableMatchTextDisabled: {
    color: theme.colors.textSecondary,
  },
  // Novos estilos para criação de confrontos personalizados
  teamSelectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  teamSelector: {
    flex: 1,
  },
  teamSelectorLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  teamSelectorButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    alignItems: "center",
  },
  teamSelectorButtonEmpty: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  teamSelectorText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  teamSelectorTextEmpty: {
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  vsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: theme.spacing.md,
  },
  addCustomMatchButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  addCustomMatchButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
    fontWeight: "600",
  },
});

export default ChampionshipMatchesScreen;
