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
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { Match, Team } from "../types/championship";

const ChampionshipMatchesScreen = () => {
  const isFocused = useIsFocused();
  const {
    currentChampionship,
    generateMatches,
    recordMatchResult,
    loadCurrentChampionship,
  } = useChampionship();

  const [matchScores, setMatchScores] = useState<{
    [matchId: string]: {
      home: string;
      away: string;
      homeGoalScorers: string[];
      awayGoalScorers: string[];
    };
  }>({});

  useEffect(() => {
    if (isFocused) {
      loadCurrentChampionship();
    }
  }, [isFocused]);

  const handleGenerateMatches = async () => {
    if (!currentChampionship) return;

    if (currentChampionship.teams.length < 2) {
      Alert.alert(
        "Erro",
        "É necessário pelo menos 2 times para gerar partidas"
      );
      return;
    }

    Alert.alert(
      "Gerar Partidas",
      "Isso irá substituir as partidas existentes. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Gerar",
          onPress: async () => {
            try {
              await generateMatches();
              Alert.alert("Sucesso", "Partidas geradas com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Erro ao gerar partidas");
            }
          },
        },
      ]
    );
  };

  const handleRecordResult = async (match: Match) => {
    const scoreData = matchScores[match.id];
    if (!scoreData || !scoreData.home || !scoreData.away) {
      Alert.alert("Erro", "Digite os placares da partida");
      return;
    }

    const homeScore = parseInt(scoreData.home);
    const awayScore = parseInt(scoreData.away);

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
      await recordMatchResult(
        match.id,
        homeScore,
        awayScore,
        scoreData.homeGoalScorers,
        scoreData.awayGoalScorers
      );
      Alert.alert("Sucesso", "Resultado registrado com sucesso!");
    } catch (error) {
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
    setMatchScores((prev) => {
      const current = prev[matchId] || {
        home: "",
        away: "",
        homeGoalScorers: [],
        awayGoalScorers: [],
      };
      const field = team === "home" ? "homeGoalScorers" : "awayGoalScorers";
      const currentScorers = current[field] || [];

      if (!currentScorers.includes(playerId)) {
        return {
          ...prev,
          [matchId]: {
            ...current,
            [field]: [...currentScorers, playerId],
          },
        };
      }
      return prev;
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
          [field]: currentScorers.filter((id) => id !== playerId),
        },
      };
    });
  };

  const renderGoalScorerButtons = (match: Match, team: "home" | "away") => {
    const teamId = team === "home" ? match.homeTeam : match.awayTeam;
    const teamData = getTeamById(teamId);
    if (!teamData || teamData.players.length === 0) return null;

    const selectedScorers =
      matchScores[match.id]?.[
        team === "home" ? "homeGoalScorers" : "awayGoalScorers"
      ] || [];

    return (
      <View style={styles.goalScorersSection}>
        <Text style={styles.goalScorersTitle}>{teamData.name}:</Text>
        <View style={styles.goalScorersGrid}>
          {teamData.players.map((player) => {
            const isSelected = selectedScorers.includes(player.id);
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
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedScorers.length > 0 && (
          <Text style={styles.selectedScorersText}>
            Goleadores:{" "}
            {selectedScorers
              .map((id) => teamData.players.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(", ")}
          </Text>
        )}
      </View>
    );
  };

  const renderMatchItem = ({ item: match }: { item: Match }) => {
    const homeTeam = getTeamById(match.homeTeam);
    const awayTeam = getTeamById(match.awayTeam);

    if (!homeTeam || !awayTeam) return null;

    return (
      <View style={styles.matchCard}>
        <View style={styles.matchHeader}>
          <View style={styles.teamsContainer}>
            <View style={styles.teamContainer}>
              <Text style={styles.teamName}>{homeTeam.name}</Text>
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
              <Text style={styles.teamName}>{awayTeam.name}</Text>
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
                {match.homeScore} - {match.awayScore}
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
                    ⚽ {homeTeam.name}:{" "}
                    {match.homeGoalScorers
                      .map(
                        (id) => homeTeam.players.find((p) => p.id === id)?.name
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                )}
                {match.awayGoalScorers && match.awayGoalScorers.length > 0 && (
                  <Text style={styles.goalScorersInfoText}>
                    ⚽ {awayTeam.name}:{" "}
                    {match.awayGoalScorers
                      .map(
                        (id) => awayTeam.players.find((p) => p.id === id)?.name
                      )
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

  const playedMatches = currentChampionship.matches.filter(
    (m) => m.played
  ).length;
  const totalMatches = currentChampionship.matches.length;

  return (
    <View style={styles.container}>
      <AppHeader title="Partidas do Campeonato" icon="calendar" theme="light" />

      <View style={styles.content}>
        <View style={styles.championshipInfo}>
          <Text style={styles.championshipName}>
            {currentChampionship.name}
          </Text>
          <Text style={styles.matchesProgress}>
            {playedMatches} de {totalMatches} partidas realizadas
          </Text>
        </View>

        {currentChampionship.teams.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Adicione pelo menos 2 times</Text>
            <Text style={styles.emptySubtext}>
              É necessário ter pelo menos 2 times para gerar partidas
            </Text>
          </View>
        ) : currentChampionship.matches.length === 0 ? (
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

            <FlatList
              data={currentChampionship.matches}
              renderItem={renderMatchItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        )}
      </View>
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
  matchesProgress: {
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
});

export default ChampionshipMatchesScreen;
