import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import { theme } from "../theme/theme";
import { Team, DrawOptions, ManualMatch } from "../types/championship";

interface ManualDrawModalProps {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  onGenerateMatches: (options: {
    type: "draw";
    drawOptions: DrawOptions;
    manualMatches: ManualMatch[];
  }) => void;
}

const ManualDrawModal: React.FC<ManualDrawModalProps> = ({
  visible,
  onClose,
  teams,
  onGenerateMatches,
}) => {
  const [totalRounds, setTotalRounds] = useState<string>("3");
  const [totalMatches, setTotalMatches] = useState<string>("");
  const [drawMode, setDrawMode] = useState<"random" | "balanced" | "seeded">(
    "random"
  );
  const [allowSameTeamTwice, setAllowSameTeamTwice] = useState(false);
  const [shuffleTeams, setShuffleTeams] = useState(true);
  const [groupBySkill, setGroupBySkill] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<ManualMatch[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawAnimation] = useState(new Animated.Value(0));

  const maxPossibleMatches =
    teams.length > 1 ? (teams.length * (teams.length - 1)) / 2 : 0;

  useEffect(() => {
    if (teams.length > 0) {
      // Sugestão inteligente baseada no número de times
      const suggestedMatches = Math.min(
        Math.ceil(teams.length * 1.5), // 1.5x o número de times
        maxPossibleMatches
      );
      setTotalMatches(suggestedMatches.toString());
    }
  }, [teams.length, maxPossibleMatches]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getTeamSkillLevel = (team: Team): number => {
    if (team.players.length === 0) return 3; // Nível médio se não há jogadores
    const totalSkill = team.players.reduce(
      (sum, player) => sum + player.skill,
      0
    );
    return Math.round(totalSkill / team.players.length);
  };

  const generateDrawMatches = (): ManualMatch[] => {
    const matches: ManualMatch[] = [];
    const rounds = parseInt(totalRounds);
    const totalMatchesNum = parseInt(totalMatches);

    if (totalMatchesNum <= 0 || rounds <= 0) return matches;

    let teamsToUse = [...teams];

    // Aplicar agrupamento por habilidade se selecionado
    if (groupBySkill) {
      teamsToUse.sort((a, b) => getTeamSkillLevel(b) - getTeamSkillLevel(a));
    }

    // Embaralhar times se selecionado
    if (shuffleTeams) {
      teamsToUse = shuffleArray(teamsToUse);
    }

    // Gerar todas as combinações possíveis
    const allPossibleMatches: ManualMatch[] = [];
    for (let i = 0; i < teamsToUse.length; i++) {
      for (let j = i + 1; j < teamsToUse.length; j++) {
        allPossibleMatches.push({
          homeTeamId: teamsToUse[i].id,
          awayTeamId: teamsToUse[j].id,
        });
      }
    }

    // Embaralhar combinações possíveis
    const shuffledMatches = shuffleArray(allPossibleMatches);

    // Selecionar o número desejado de partidas
    const selectedMatches = shuffledMatches.slice(
      0,
      Math.min(totalMatchesNum, allPossibleMatches.length)
    );

    // Distribuir pelas rodadas
    const matchesPerRound = Math.ceil(selectedMatches.length / rounds);
    const teamUsageCount: { [teamId: string]: number } = {};

    // Inicializar contador de uso por time
    teamsToUse.forEach((team) => {
      teamUsageCount[team.id] = 0;
    });

    selectedMatches.forEach((match, index) => {
      const round = Math.floor(index / matchesPerRound) + 1;

      // Verificar se o time já jogou duas vezes na mesma rodada (se não permitido)
      if (!allowSameTeamTwice) {
        const roundMatches = matches.filter((m) => m.round === round);
        const homeTeamInRound = roundMatches.some(
          (m) =>
            m.homeTeamId === match.homeTeamId ||
            m.awayTeamId === match.homeTeamId
        );
        const awayTeamInRound = roundMatches.some(
          (m) =>
            m.homeTeamId === match.awayTeamId ||
            m.awayTeamId === match.awayTeamId
        );

        if (homeTeamInRound || awayTeamInRound) {
          // Pular esta partida se algum time já jogou na rodada
          return;
        }
      }

      match.round = round;
      matches.push(match);
      teamUsageCount[match.homeTeamId]++;
      teamUsageCount[match.awayTeamId]++;
    });

    return matches;
  };

  const handleDrawMatches = async () => {
    const rounds = parseInt(totalRounds);
    const totalMatchesNum = parseInt(totalMatches);

    if (!rounds || rounds < 1) {
      Alert.alert("Erro", "Número de rodadas deve ser maior que 0");
      return;
    }

    if (!totalMatchesNum || totalMatchesNum < 1) {
      Alert.alert("Erro", "Número de jogos deve ser maior que 0");
      return;
    }

    if (totalMatchesNum > maxPossibleMatches) {
      Alert.alert(
        "Erro",
        `Impossível gerar ${totalMatchesNum} jogos únicos com ${teams.length} times.\nMáximo possível: ${maxPossibleMatches} jogos únicos.`
      );
      return;
    }

    setIsDrawing(true);

    // Animação de sorteio
    Animated.sequence([
      Animated.timing(drawAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(drawAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Simular tempo de sorteio
    setTimeout(() => {
      const matches = generateDrawMatches();
      setGeneratedMatches(matches);
      setShowPreview(true);
      setIsDrawing(false);
    }, 1500);
  };

  const handleConfirmGeneration = () => {
    const drawOptions: DrawOptions = {
      totalRounds: parseInt(totalRounds),
      totalMatches: parseInt(totalMatches),
      drawMode,
      allowSameTeamTwice,
      shuffleTeams,
      groupBySkill,
    };

    onGenerateMatches({
      type: "draw",
      drawOptions,
      manualMatches: generatedMatches,
    });

    onClose();
  };

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Time não encontrado";
  };

  const getTeamColor = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.color || "#cccccc";
  };

  if (showPreview) {
    const matchesByRound: { [round: number]: ManualMatch[] } = {};
    generatedMatches.forEach((match) => {
      const round = match.round || 1;
      if (!matchesByRound[round]) {
        matchesByRound[round] = [];
      }
      matchesByRound[round].push(match);
    });

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>🎲 Resultado do Sorteio</Text>
              <TouchableOpacity
                onPress={() => setShowPreview(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.previewContainer}
              contentContainerStyle={styles.previewContent}
            >
              <View style={styles.previewInfo}>
                <Text style={styles.previewSummary}>
                  🎯 {generatedMatches.length} partidas sorteadas
                </Text>
                <Text style={styles.previewSummary}>
                  📊 {totalRounds} rodadas • Modo:{" "}
                  {drawMode === "random"
                    ? "Aleatório"
                    : drawMode === "balanced"
                    ? "Equilibrado"
                    : "Chaveado"}
                </Text>
              </View>

              {generatedMatches.length === 0 ? (
                <View style={styles.emptyPreview}>
                  <Text style={styles.emptyPreviewText}>
                    Nenhuma partida foi sorteada. Tente ajustar as
                    configurações.
                  </Text>
                </View>
              ) : (
                <>
                  {Object.keys(matchesByRound)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((roundStr) => {
                      const round = parseInt(roundStr);
                      const roundMatches = matchesByRound[round];

                      return (
                        <View key={round} style={styles.roundContainer}>
                          <Text style={styles.roundTitle}>
                            🎮 Rodada {round}
                          </Text>
                          {roundMatches.map((match, index) => (
                            <View key={index} style={styles.matchItem}>
                              <View style={styles.matchTeams}>
                                <View
                                  style={[
                                    styles.teamBadge,
                                    {
                                      backgroundColor: getTeamColor(
                                        match.homeTeamId
                                      ),
                                    },
                                  ]}
                                >
                                  <Text style={styles.teamName}>
                                    {getTeamName(match.homeTeamId)}
                                  </Text>
                                </View>
                                <Text style={styles.vsText}>VS</Text>
                                <View
                                  style={[
                                    styles.teamBadge,
                                    {
                                      backgroundColor: getTeamColor(
                                        match.awayTeamId
                                      ),
                                    },
                                  ]}
                                >
                                  <Text style={styles.teamName}>
                                    {getTeamName(match.awayTeamId)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                </>
              )}

              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowPreview(false)}
                >
                  <Text style={styles.secondaryButtonText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleConfirmGeneration}
                  disabled={generatedMatches.length === 0}
                >
                  <Text style={styles.primaryButtonText}>
                    Confirmar Sorteio
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>🎲 Sorteio Manual de Jogos</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                🏆 Times disponíveis: {teams.length}
              </Text>
              <Text style={styles.infoText}>
                ⚽ Máximo de jogos únicos: {maxPossibleMatches}
              </Text>
              <Text style={styles.infoText}>
                🎯 Jogos simultâneos por rodada: {Math.floor(teams.length / 2)}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Rodadas:</Text>
              <TextInput
                style={styles.input}
                value={totalRounds}
                onChangeText={setTotalRounds}
                placeholder="Ex: 3"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Total de Jogos a Sortear:</Text>
              <TextInput
                style={styles.input}
                value={totalMatches}
                onChangeText={setTotalMatches}
                placeholder="Ex: 12"
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.hint}>
                Quantos jogos você quer sortear no total
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modo de Sorteio:</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    drawMode === "random" && styles.selectedModeOption,
                  ]}
                  onPress={() => setDrawMode("random")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      drawMode === "random" && styles.selectedModeOptionText,
                    ]}
                  >
                    🎲 Aleatório
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    drawMode === "balanced" && styles.selectedModeOption,
                  ]}
                  onPress={() => setDrawMode("balanced")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      drawMode === "balanced" && styles.selectedModeOptionText,
                    ]}
                  >
                    ⚖️ Equilibrado
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    drawMode === "seeded" && styles.selectedModeOption,
                  ]}
                  onPress={() => setDrawMode("seeded")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      drawMode === "seeded" && styles.selectedModeOptionText,
                    ]}
                  >
                    🏆 Chaveado
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.optionsContainer}>
              <Text style={styles.label}>Opções de Sorteio:</Text>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setAllowSameTeamTwice(!allowSameTeamTwice)}
              >
                <Text style={styles.optionText}>
                  {allowSameTeamTwice ? "✅" : "❌"} Permitir time jogar duas
                  vezes na mesma rodada
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setShuffleTeams(!shuffleTeams)}
              >
                <Text style={styles.optionText}>
                  {shuffleTeams ? "✅" : "❌"} Embaralhar ordem dos times
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => setGroupBySkill(!groupBySkill)}
              >
                <Text style={styles.optionText}>
                  {groupBySkill ? "✅" : "❌"} Agrupar por nível de habilidade
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  isDrawing && styles.disabledButton,
                ]}
                onPress={handleDrawMatches}
                disabled={isDrawing}
              >
                {isDrawing ? (
                  <Animated.View
                    style={[
                      styles.drawingContainer,
                      {
                        transform: [
                          {
                            rotate: drawAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      🎲 Sorteando...
                    </Text>
                  </Animated.View>
                ) : (
                  <Text style={styles.primaryButtonText}>🎲 Sortear Jogos</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    width: "90%",
    height: "80%",
    maxHeight: 600,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  infoContainer: {
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  modeOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  selectedModeOption: {
    backgroundColor: theme.colors.primary,
  },
  modeOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.text,
    textAlign: "center",
  },
  selectedModeOptionText: {
    color: "white",
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 20,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.border,
  },
  disabledButton: {
    backgroundColor: theme.colors.textSecondary,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  drawingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  previewInfo: {
    marginBottom: 15,
  },
  previewSummary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  roundContainer: {
    marginBottom: 15,
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 10,
  },
  matchItem: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  matchTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 4,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  vsText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
    marginHorizontal: 8,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: theme.spacing.lg,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  emptyPreview: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginVertical: 10,
  },
  emptyPreviewText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});

export default ManualDrawModal;

