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
import ManualDrawModal from "./ManualDrawModal";
import { theme } from "../theme/theme";
import {
  Team,
  ConfiguredMatchOptions,
  ManualMatch,
  DrawOptions,
} from "../types/championship";

interface MatchGenerationConfigProps {
  visible: boolean;
  onClose: () => void;
  teams: Team[];
  onGenerateMatches: (options: {
    type: "configured" | "draw";
    configuredOptions?: ConfiguredMatchOptions;
    drawOptions?: DrawOptions;
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
  const [totalGames, setTotalGames] = useState<string>("");
  const [gameDistributionMode, setGameDistributionMode] = useState<
    "auto" | "manual"
  >("manual");
  const [generationMode, setGenerationMode] = useState<"complete" | "dynamic">(
    "dynamic"
  );
  const [showPreview, setShowPreview] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<ManualMatch[]>([]);
  const [showDrawModal, setShowDrawModal] = useState(false);

  const maxPossibleMatches = teams.length > 1 ? teams.length - 1 : 0;

  const handlePreviewMatches = () => {
    console.log("🎯 handlePreviewMatches iniciado");
    console.log("📊 Estado atual:", {
      totalRounds,
      matchesPerTeam,
      totalGames,
      gameDistributionMode,
      teamsCount: teams.length,
    });

    const rounds = parseInt(totalRounds);

    if (!rounds || rounds < 1) {
      Alert.alert("Erro", "Número de rodadas deve ser maior que 0");
      return;
    }

    let matchesPerTeamNum: number;
    let totalGamesNum: number;

    if (gameDistributionMode === "manual") {
      totalGamesNum = parseInt(totalGames);
      console.log("🔢 Modo manual - totalGamesNum:", totalGamesNum);

      if (!totalGamesNum || totalGamesNum < 1) {
        Alert.alert("Erro", "Número total de jogos deve ser maior que 0");
        return;
      }

      // Calcular partidas por time baseado no total de jogos
      // Cada jogo envolve 2 times, então: totalGames * 2 = soma de todas as partidas dos times
      matchesPerTeamNum = Math.floor((totalGamesNum * 2) / teams.length);
      console.log("🔢 Calculado matchesPerTeamNum:", matchesPerTeamNum);

      if (matchesPerTeamNum < 1) {
        Alert.alert(
          "Erro",
          `Com ${totalGamesNum} jogos e ${teams.length} times, cada time jogaria menos de 1 partida. Aumente o número de jogos.`
        );
        return;
      }
    } else {
      matchesPerTeamNum = parseInt(matchesPerTeam);
      console.log("🔢 Modo auto - matchesPerTeamNum:", matchesPerTeamNum);

      if (!matchesPerTeamNum || matchesPerTeamNum < 1) {
        Alert.alert("Erro", "Número de partidas por time deve ser maior que 0");
        return;
      }

      if (matchesPerTeamNum > maxPossibleMatches * rounds) {
        Alert.alert(
          "Erro",
          `Cada time pode jogar no máximo ${
            maxPossibleMatches * rounds
          } partidas (${maxPossibleMatches} por rodada × ${rounds} rodadas)`
        );
        return;
      }

      // Calcular total de jogos baseado nas partidas por time
      totalGamesNum = Math.floor((matchesPerTeamNum * teams.length) / 2);
      console.log("🔢 Calculado totalGamesNum:", totalGamesNum);
    }

    // Validações matemáticas
    const teamIds = teams.map((team) => team.id);
    const maxPossibleGames = (teams.length * (teams.length - 1)) / 2;
    const maxSimultaneousGames = Math.floor(teams.length / 2);

    console.log("🏗️ Validações:", {
      teamsCount: teams.length,
      maxPossibleGames,
      maxSimultaneousGames,
      requestedGames:
        gameDistributionMode === "manual" ? totalGamesNum : "auto",
      rounds,
    });

    // Validar se é possível gerar o número solicitado de jogos
    if (gameDistributionMode === "manual" && totalGamesNum > maxPossibleGames) {
      Alert.alert(
        "Erro",
        `Impossível gerar ${totalGamesNum} jogos únicos com ${teams.length} times.\nMáximo possível: ${maxPossibleGames} jogos únicos.\n\nSugestão: Use jogos de ida e volta ou reduza o número de jogos.`
      );
      return;
    }

    // Validar se é possível distribuir pelos rodadas
    const targetGamesNum =
      gameDistributionMode === "manual"
        ? totalGamesNum
        : Math.min((matchesPerTeamNum * teams.length) / 2, maxPossibleGames);
    const gamesPerRound = Math.ceil(targetGamesNum / rounds);

    // Validar se há jogos suficientes para o número de rodadas
    if (targetGamesNum < rounds) {
      Alert.alert(
        "Erro",
        `Impossível distribuir ${targetGamesNum} jogo(s) em ${rounds} rodadas.\nCada rodada ficaria com menos de 1 jogo.\n\nSugestão: Reduza o número de rodadas para ${targetGamesNum} ou menos, ou aumente o número de jogos.`
      );
      return;
    }

    if (gamesPerRound > maxSimultaneousGames) {
      Alert.alert(
        "Erro",
        `Com ${
          teams.length
        } times, máximo ${maxSimultaneousGames} jogos simultâneos por rodada.\nVocê precisa de ${gamesPerRound} jogos por rodada.\n\nSugestão: Aumente o número de rodadas para ${Math.ceil(
          targetGamesNum / maxSimultaneousGames
        )} ou mais.`
      );
      return;
    }

    // Gerar todas as combinações possíveis de times
    const allPossibleMatches: ManualMatch[] = [];
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        allPossibleMatches.push({
          homeTeamId: teamIds[i],
          awayTeamId: teamIds[j],
          round: 1,
        });
      }
    }

    console.log("🎲 Combinações possíveis:", allPossibleMatches.length);

    let matches: ManualMatch[] = [];

    if (gameDistributionMode === "manual") {
      // Modo Manual: Selecionar jogos
      if (generationMode === "dynamic") {
        // Modo Dinâmico: Gerar apenas jogos da primeira rodada
        const gamesFirstRound = Math.min(totalGamesNum, maxSimultaneousGames);
        const selectedMatches = allPossibleMatches.slice(0, gamesFirstRound);
        selectedMatches.forEach((match) => {
          match.round = 1;
        });
        matches = selectedMatches;
      } else {
        // Modo Completo: Gerar todos os jogos distribuídos pelas rodadas
        const selectedMatches = allPossibleMatches.slice(0, totalGamesNum);

        // Distribuição equilibrada pelas rodadas
        const baseGamesPerRound = Math.floor(totalGamesNum / rounds);
        const extraGames = totalGamesNum % rounds;

        selectedMatches.forEach((match, index) => {
          // Calcular em qual rodada este jogo deve ficar
          let round = 1;
          let gameIndex = index;

          for (let r = 1; r <= rounds; r++) {
            const gamesInThisRound =
              baseGamesPerRound + (r <= extraGames ? 1 : 0);
            if (gameIndex < gamesInThisRound) {
              round = r;
              break;
            }
            gameIndex -= gamesInThisRound;
          }

          match.round = round;
        });

        matches = selectedMatches;
      }
    } else {
      // Modo Automático: Gerar baseado em partidas por time
      const teamMatchCounts: { [teamId: string]: number } = {};
      teamIds.forEach((id) => (teamMatchCounts[id] = 0));

      // Adicionar partidas até atingir o limite por time
      for (const match of allPossibleMatches) {
        if (
          teamMatchCounts[match.homeTeamId] < matchesPerTeamNum &&
          teamMatchCounts[match.awayTeamId] < matchesPerTeamNum
        ) {
          matches.push(match);
          teamMatchCounts[match.homeTeamId]++;
          teamMatchCounts[match.awayTeamId]++;
        }
      }

      // Distribuir pelas rodadas de forma equilibrada
      const totalMatches = matches.length;
      const baseGamesPerRound = Math.floor(totalMatches / rounds);
      const extraGames = totalMatches % rounds;

      matches.forEach((match, index) => {
        let round = 1;
        let gameIndex = index;

        for (let r = 1; r <= rounds; r++) {
          const gamesInThisRound =
            baseGamesPerRound + (r <= extraGames ? 1 : 0);
          if (gameIndex < gamesInThisRound) {
            round = r;
            break;
          }
          gameIndex -= gamesInThisRound;
        }

        match.round = round;
      });
    }

    const finalMatches = matches;

    // Logs detalhados para debug
    console.log("✅ Partidas geradas:", finalMatches.length);

    // Verificar distribuição por rodadas
    const matchesByRound: { [round: number]: number } = {};
    finalMatches.forEach((match) => {
      const round = match.round || 1;
      matchesByRound[round] = (matchesByRound[round] || 0) + 1;
    });

    console.log("📊 Distribuição por rodadas:", matchesByRound);

    // Verificar partidas por time
    const teamMatchCounts: { [teamId: string]: number } = {};
    teamIds.forEach((id) => (teamMatchCounts[id] = 0));
    finalMatches.forEach((match) => {
      teamMatchCounts[match.homeTeamId]++;
      teamMatchCounts[match.awayTeamId]++;
    });

    console.log("⚽ Partidas por time:", teamMatchCounts);
    console.log("🎮 Definindo showPreview como true");

    setGeneratedMatches(finalMatches);
    setShowPreview(true);
  };

  const handleConfirmGeneration = () => {
    const configuredOptions: ConfiguredMatchOptions = {
      totalRounds: parseInt(totalRounds),
      matchesPerTeam:
        gameDistributionMode === "manual"
          ? Math.floor((parseInt(totalGames) * 2) / teams.length)
          : parseInt(matchesPerTeam),
      matchDistribution: "equal",
      totalGames:
        gameDistributionMode === "manual" ? parseInt(totalGames) : undefined,
      gameDistributionMode,
      generationMode,
    };

    onGenerateMatches({
      type: "configured",
      configuredOptions,
      manualMatches: generatedMatches,
    });

    onClose();
  };

  const handleDrawMatches = (options: {
    type: "draw";
    drawOptions: DrawOptions;
    manualMatches: ManualMatch[];
  }) => {
    onGenerateMatches(options);
    setShowDrawModal(false);
    onClose();
  };

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Time não encontrado";
  };

  if (showPreview) {
    console.log("🖥️ Renderizando modal de preview");

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
              <Text style={styles.title}>Preview das Partidas</Text>
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
                  Total: {generatedMatches.length} partidas
                </Text>
                {gameDistributionMode === "manual" && totalGames && (
                  <Text style={styles.previewSummary}>
                    🎯 Configuração: {parseInt(totalGames)} jogos totais
                    distribuídos entre {teams.length} times
                  </Text>
                )}
                <Text style={styles.debugText}>
                  🔍 Debug: Modal funcionando - {teams.length} times cadastrados
                </Text>
              </View>

              {generatedMatches.length === 0 ? (
                <View style={styles.emptyPreview}>
                  <Text style={styles.emptyPreviewText}>
                    Nenhuma partida foi gerada. Verifique as configurações.
                  </Text>
                  <Text style={styles.emptyPreviewText}>
                    Times: {teams.length} | Modo: {gameDistributionMode}
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
                          <Text style={styles.roundTitle}>Rodada {round}</Text>
                          {roundMatches.map((match, index) => (
                            <View key={index} style={styles.matchItem}>
                              <Text style={styles.matchText}>
                                {getTeamName(match.homeTeamId)} vs{" "}
                                {getTeamName(match.awayTeamId)}
                              </Text>
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
                  onPress={() => {
                    console.log("🔙 Voltando do preview");
                    setShowPreview(false);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleConfirmGeneration}
                  disabled={generatedMatches.length === 0}
                >
                  <Text style={styles.primaryButtonText}>
                    Confirmar Geração
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
            <Text style={styles.title}>Configurar Geração de Partidas</Text>
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
                🏆 Times cadastrados: {teams.length}
              </Text>
              <Text style={styles.infoText}>
                ⚽ Máximo de partidas por time: {maxPossibleMatches}
              </Text>
              <Text style={styles.infoText}>
                🎯 Máximo de jogos simultâneos: {Math.floor(teams.length / 2)}
              </Text>
            </View>

            {/* Seção de Sugestões Inteligentes */}
            {teams.length >= 2 && (
              <View style={styles.smartSuggestionsContainer}>
                <Text style={styles.smartSuggestionsTitle}>
                  🧠 Sugestões Inteligentes
                </Text>
                
                {(() => {
                  const maxSimultaneousGames = Math.floor(teams.length / 2);
                  const totalPossibleGames =
                    (teams.length * (teams.length - 1)) / 2;
                  
                  // Sugestões baseadas no número de times
                  const suggestions = {
                    conservative: {
                      games: Math.ceil(teams.length * 0.6), // 60% dos times como adversários
                      rounds: Math.ceil(
                        (teams.length * 0.6) / maxSimultaneousGames
                      ),
                    },
                    balanced: {
                      games: Math.ceil(teams.length * 0.8), // 80% dos times como adversários
                      rounds: Math.ceil(
                        (teams.length * 0.8) / maxSimultaneousGames
                      ),
                    },
                    complete: {
                      games: totalPossibleGames, // Todos contra todos
                      rounds: Math.ceil(
                        totalPossibleGames / maxSimultaneousGames
                      ),
                    },
                  };
                  
                  return (
                    <View style={styles.suggestionsGrid}>
                      <TouchableOpacity 
                        style={styles.suggestionCard}
                        onPress={() => {
                          setTotalGames(
                            suggestions.conservative.games.toString()
                          );
                          setTotalRounds(
                            suggestions.conservative.rounds.toString()
                          );
                        }}
                      >
                        <Text style={styles.suggestionCardTitle}>
                          🎯 Conservador
                        </Text>
                        <Text style={styles.suggestionCardText}>
                          {suggestions.conservative.games} jogos
                        </Text>
                        <Text style={styles.suggestionCardText}>
                          {suggestions.conservative.rounds} rodadas
                        </Text>
                        <Text style={styles.suggestionCardHint}>
                          Campeonato rápido
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.suggestionCard}
                        onPress={() => {
                          setTotalGames(suggestions.balanced.games.toString());
                          setTotalRounds(
                            suggestions.balanced.rounds.toString()
                          );
                        }}
                      >
                        <Text style={styles.suggestionCardTitle}>
                          ⚖️ Equilibrado
                        </Text>
                        <Text style={styles.suggestionCardText}>
                          {suggestions.balanced.games} jogos
                        </Text>
                        <Text style={styles.suggestionCardText}>
                          {suggestions.balanced.rounds} rodadas
                        </Text>
                        <Text style={styles.suggestionCardHint}>
                          Recomendado
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.suggestionCard}
                        onPress={() => {
                          setTotalGames(suggestions.complete.games.toString());
                          setTotalRounds(
                            suggestions.complete.rounds.toString()
                          );
                        }}
                      >
                        <Text style={styles.suggestionCardTitle}>
                          🏆 Completo
                        </Text>
                        <Text style={styles.suggestionCardText}>
                          {suggestions.complete.games} jogos
                        </Text>
                        <Text style={styles.suggestionCardText}>
                          {suggestions.complete.rounds} rodadas
                        </Text>
                        <Text style={styles.suggestionCardHint}>
                          Todos vs todos
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modo de Configuração:</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    gameDistributionMode === "auto" &&
                      styles.selectedModeOption,
                  ]}
                  onPress={() => setGameDistributionMode("auto")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      gameDistributionMode === "auto" &&
                        styles.selectedModeOptionText,
                    ]}
                  >
                    Automático
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    gameDistributionMode === "manual" &&
                      styles.selectedModeOption,
                  ]}
                  onPress={() => setGameDistributionMode("manual")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      gameDistributionMode === "manual" &&
                        styles.selectedModeOptionText,
                    ]}
                  >
                    Manual
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Explicações detalhadas sobre cada modo */}
              <View style={styles.explanationContainer}>
                {gameDistributionMode === "auto" ? (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationTitle}>
                      🤖 Modo Automático
                    </Text>
                    <Text style={styles.explanationText}>
                      • Você define quantas partidas cada time deve jogar{"\n"}•
                      O sistema distribui automaticamente os jogos entre as
                      rodadas{"\n"}• Ideal quando você quer controlar a carga de
                      jogos por time{"\n"}• Exemplo: Se cada time jogar 6
                      partidas, o sistema criará os confrontos necessários
                    </Text>
                  </View>
                ) : (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationTitle}>
                      ⚙️ Modo Manual (Recomendado)
                    </Text>
                    <Text style={styles.explanationText}>
                      • Você define o número total de jogos do campeonato{"\n"}•
                      O sistema distribui equilibradamente entre todos os times
                      {"\n"}• Garante que todos os times joguem aproximadamente
                      a mesma quantidade{"\n"}• Exemplo: 15 jogos com 6 times =
                      cada time joga cerca de 5 partidas
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modo de Geração:</Text>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    generationMode === "dynamic" && styles.selectedModeOption,
                  ]}
                  onPress={() => setGenerationMode("dynamic")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      generationMode === "dynamic" &&
                        styles.selectedModeOptionText,
                    ]}
                  >
                    Dinâmico
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeOption,
                    generationMode === "complete" && styles.selectedModeOption,
                  ]}
                  onPress={() => setGenerationMode("complete")}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      generationMode === "complete" &&
                        styles.selectedModeOptionText,
                    ]}
                  >
                    Completo
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Explicações detalhadas sobre cada modo de geração */}
              <View style={styles.explanationContainer}>
                {generationMode === "dynamic" ? (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationTitle}>
                      ⚡ Geração Dinâmica
                    </Text>
                    <Text style={styles.explanationText}>
                      • Cria apenas a primeira rodada inicialmente{"\n"}• As
                      próximas rodadas são geradas automaticamente conforme
                      necessário{"\n"}• Permite ajustes e modificações durante o
                      campeonato{"\n"}• Ideal para campeonatos longos ou com
                      mudanças frequentes{"\n"}• Economiza espaço e permite
                      maior flexibilidade
                    </Text>
                  </View>
                ) : (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationTitle}>
                      📋 Geração Completa
                    </Text>
                    <Text style={styles.explanationText}>
                      • Gera todas as rodadas de uma só vez{"\n"}• Você pode
                      visualizar todo o calendário antecipadamente{"\n"}• Ideal
                      para campeonatos com cronograma fixo{"\n"}• Permite
                      planejamento completo desde o início{"\n"}• Todas as
                      partidas ficam visíveis imediatamente
                    </Text>
                  </View>
                )}
              </View>
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
              <Text style={styles.hint}>
                {generationMode === "dynamic"
                  ? "Total de rodadas que o campeonato terá (geradas conforme necessário)"
                  : "Quantas rodadas serão geradas agora"}
              </Text>
              {(() => {
                const targetGamesNum =
                  gameDistributionMode === "auto"
                    ? Math.floor(
                        (parseInt(matchesPerTeam || "0") * teams.length) / 2
                      )
                  : parseInt(totalGames || "0");
                
                if (targetGamesNum > 0) {
                  const maxSimultaneousGames = Math.floor(teams.length / 2);
                  const suggestedRounds = Math.ceil(
                    targetGamesNum / maxSimultaneousGames
                  );
                  
                  return (
                    <Text style={styles.suggestionHint}>
                      💡 Sugestão: {suggestedRounds} rodada
                      {suggestedRounds > 1 ? "s" : ""}
                      (baseado em {targetGamesNum} jogos e{" "}
                      {maxSimultaneousGames} jogos simultâneos por rodada)
                    </Text>
                  );
                }
                return null;
              })()}
            </View>

            {gameDistributionMode === "auto" ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Partidas por Time:</Text>
                <TextInput
                  style={styles.input}
                  value={matchesPerTeam}
                  onChangeText={setMatchesPerTeam}
                  placeholder={`Ex: ${
                    maxPossibleMatches * parseInt(totalRounds || "1")
                  }`}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.hint}>
                  Quantas partidas cada time jogará no total
                </Text>
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Total de Jogos do Campeonato:</Text>
                <TextInput
                  style={styles.input}
                  value={totalGames}
                  onChangeText={setTotalGames}
                  placeholder="Ex: 15"
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.hint}>
                  Número total de jogos que serão realizados no campeonato (sem
                  turno e returno)
                </Text>
                {totalGames && parseInt(totalGames) > 0 && (
                  <Text style={styles.calculationHint}>
                    📊 Com {totalGames} jogos, cada time jogará aproximadamente{" "}
                    {Math.floor((parseInt(totalGames) * 2) / teams.length)}{" "}
                    partidas
                  </Text>
                )}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.drawButton]}
                onPress={() => setShowDrawModal(true)}
              >
                <Text style={styles.drawButtonText}>🎲 Sortear</Text>
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

      <ManualDrawModal
        visible={showDrawModal}
        onClose={() => setShowDrawModal(false)}
        teams={teams}
        onGenerateMatches={handleDrawMatches}
      />
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
  drawButton: {
    backgroundColor: "#FF6B35",
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
  drawButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
    paddingTop: 20,
    paddingBottom: theme.spacing.lg,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  selectedModeOption: {
    backgroundColor: theme.colors.primary,
  },
  modeOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.text,
  },
  selectedModeOptionText: {
    color: "white",
  },
  calculationHint: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 8,
    fontStyle: "italic",
  },
  suggestionHint: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 8,
    fontWeight: "500",
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  explanationContainer: {
    marginTop: 12,
  },
  explanationBox: {
    backgroundColor: theme.colors.background,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
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
  debugText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: "italic",
    marginTop: 5,
  },
  smartSuggestionsContainer: {
    backgroundColor: "rgba(0, 123, 255, 0.05)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 123, 255, 0.2)",
  },
  smartSuggestionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  suggestionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  suggestionCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionCardTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  suggestionCardText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 2,
  },
  suggestionCardHint: {
    fontSize: 10,
    color: theme.colors.primary,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
});

export default MatchGenerationConfig;
