import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { theme } from "../theme/theme";
import { Team, ConfiguredMatchOptions, ManualMatch } from "../types/championship";

interface MatchGenerationConfigProps {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  onGenerateMatches: (options: {
    type: "configured";
    configuredOptions: ConfiguredMatchOptions;
    manualMatches: ManualMatch[];
  }) => void;
}

const MatchGenerationConfig: React.FC<MatchGenerationConfigProps> = ({
  visible,
  onClose,
  teams,
  onGenerateMatches,
}) => {
  const [totalRounds, setTotalRounds] = useState<string>("2");
  const [matchesPerTeam, setMatchesPerTeam] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<ManualMatch[]>([]);

  const maxPossibleMatches = teams.length > 1 ? teams.length - 1 : 0;

  const handlePreviewMatches = () => {
    const rounds = parseInt(totalRounds);
    const matchesPerTeamNum = parseInt(matchesPerTeam);

    if (!rounds || rounds < 1) {
      Alert.alert("Erro", "Número de rodadas deve ser maior que 0");
      return;
    }

    if (!matchesPerTeamNum || matchesPerTeamNum < 1) {
      Alert.alert("Erro", "Número de partidas por time deve ser maior que 0");
      return;
    }

    if (matchesPerTeamNum > maxPossibleMatches * rounds) {
      Alert.alert(
        "Erro",
        `Cada time pode jogar no máximo ${maxPossibleMatches * rounds} partidas (${maxPossibleMatches} por rodada × ${rounds} rodadas)`
      );
      return;
    }

    // Gerar partidas distribuídas pelas rodadas
    const matches: ManualMatch[] = [];
    const teamIds = teams.map(team => team.id);
    
    // Calcular quantas partidas cada time deve jogar por rodada
    const matchesPerRound = Math.ceil(matchesPerTeamNum / rounds);
    
    for (let round = 1; round <= rounds; round++) {
      const roundMatches: ManualMatch[] = [];
      
      // Para cada time, tentar adicionar partidas até atingir o limite por rodada
      for (const homeTeamId of teamIds) {
        let teamMatchesInRound = 0;
        
        for (const awayTeamId of teamIds) {
          if (homeTeamId !== awayTeamId && teamMatchesInRound < matchesPerRound) {
            // Verificar se este confronto já existe nesta rodada
            const matchExists = roundMatches.some(
              m => (m.homeTeamId === homeTeamId && m.awayTeamId === awayTeamId) ||
                   (m.homeTeamId === awayTeamId && m.awayTeamId === homeTeamId)
            );
            
            if (!matchExists) {
              roundMatches.push({
                homeTeamId,
                awayTeamId,
                round,
              });
              teamMatchesInRound++;
            }
          }
        }
      }
      
      matches.push(...roundMatches);
    }

    // Limitar o número total de partidas por time
    const finalMatches: ManualMatch[] = [];
    const teamMatchCounts: { [teamId: string]: number } = {};
    
    // Inicializar contadores
    teamIds.forEach(id => {
      teamMatchCounts[id] = 0;
    });
    
    // Adicionar partidas respeitando o limite por time
    for (const match of matches) {
      if (
        teamMatchCounts[match.homeTeamId] < matchesPerTeamNum &&
        teamMatchCounts[match.awayTeamId] < matchesPerTeamNum
      ) {
        finalMatches.push(match);
        teamMatchCounts[match.homeTeamId]++;
        teamMatchCounts[match.awayTeamId]++;
      }
    }

    setGeneratedMatches(finalMatches);
    setShowPreview(true);
  };

  const handleConfirmGeneration = () => {
    const configuredOptions: ConfiguredMatchOptions = {
      totalRounds: parseInt(totalRounds),
      matchesPerTeam: parseInt(matchesPerTeam),
      matchDistribution: "equal",
    };

    onGenerateMatches({
      type: "configured",
      configuredOptions,
      manualMatches: generatedMatches,
    });

    onClose();
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || "Time não encontrado";
  };

  const renderMatchPreview = () => {
    if (!showPreview) return null;

    const matchesByRound: { [round: number]: ManualMatch[] } = {};
    generatedMatches.forEach(match => {
      const round = match.round || 1;
      if (!matchesByRound[round]) {
        matchesByRound[round] = [];
      }
      matchesByRound[round].push(match);
    });

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Preview das Partidas</Text>
        <Text style={styles.previewSummary}>
          Total: {generatedMatches.length} partidas
        </Text>
        
        <ScrollView style={styles.previewScroll}>
          {Object.keys(matchesByRound)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(roundStr => {
              const round = parseInt(roundStr);
              const roundMatches = matchesByRound[round];
              
              return (
                <View key={round} style={styles.roundContainer}>
                  <Text style={styles.roundTitle}>Rodada {round}</Text>
                  {roundMatches.map((match, index) => (
                    <View key={index} style={styles.matchItem}>
                      <Text style={styles.matchText}>
                        {getTeamName(match.homeTeamId)} vs {getTeamName(match.awayTeamId)}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
        </ScrollView>

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
          >
            <Text style={styles.primaryButtonText}>Confirmar Geração</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (showPreview) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {renderMatchPreview()}
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
            <Text style={styles.title}>Configurar Geração de Partidas</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Times cadastrados: {teams.length}
              </Text>
              <Text style={styles.infoText}>
                Máximo de partidas por time por rodada: {maxPossibleMatches}
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Rodadas:</Text>
              <TextInput
                style={styles.input}
                value={totalRounds}
                onChangeText={setTotalRounds}
                placeholder="Ex: 2"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.hint}>
                Quantas rodadas o campeonato terá
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Partidas por Time:</Text>
              <TextInput
                style={styles.input}
                value={matchesPerTeam}
                onChangeText={setMatchesPerTeam}
                placeholder={`Ex: ${maxPossibleMatches * parseInt(totalRounds || "1")}`}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.hint}>
                Quantas partidas cada time jogará no total
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handlePreviewMatches}
              >
                <Text style={styles.primaryButtonText}>Preview</Text>
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
    maxHeight: "80%",
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
    padding: 20,
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
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
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
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 10,
  },
  previewSummary: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 15,
  },
  previewScroll: {
    flex: 1,
    marginBottom: 20,
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
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  matchText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default MatchGenerationConfig;
