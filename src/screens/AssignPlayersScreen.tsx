import React, { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../theme/theme";
import AppHeader from "../components/AppHeader";

// Tipo para jogador com habilidade e posição
type Player = {
  name: string;
  skill: number; // 1-5 onde 5 é o mais habilidoso
  position: string; // Posição do jogador (ex: Goleiro, Zagueiro, etc.)
};

// Tipo para distribuição salva
type SavedDistribution = {
  id: string;
  name: string;
  date: string;
  distribution: { [key: string]: Player[] };
  teams: { name: string; color: string }[];
};

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function AssignPlayersScreen() {
  const isFocused = useIsFocused();
  const [autoSortear, setAutoSortear] = useState(true);
  const [balancearTimes, setBalancearTimes] = useState(true);
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [times, setTimes] = useState<{ name: string; color: string }[]>([]);
  const [timesJogadores, setTimesJogadores] = useState<{
    [key: string]: Player[];
  }>({});
  const [savedDistributions, setSavedDistributions] = useState<SavedDistribution[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [distributionName, setDistributionName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const jogadoresSalvos = await AsyncStorage.getItem("players");
      const timesSalvos = await AsyncStorage.getItem("teams");
      const distribuicoesSalvas = await AsyncStorage.getItem("savedDistributions");
      setJogadores(jogadoresSalvos ? JSON.parse(jogadoresSalvos) : []);
      setTimes(timesSalvos ? JSON.parse(timesSalvos) : []);
      setSavedDistributions(distribuicoesSalvas ? JSON.parse(distribuicoesSalvas) : []);
    };
    if (isFocused) fetchData();
  }, [isFocused]);

  // Função para calcular a média de habilidade de um time
  const calcularMediaHabilidade = (jogadoresTime: Player[]): number => {
    if (jogadoresTime.length === 0) return 0;
    const somaHabilidades = jogadoresTime.reduce((soma, jogador) => soma + jogador.skill, 0);
    return somaHabilidades / jogadoresTime.length;
  };

  // Função para sortear jogadores aleatoriamente
  const sortearJogadoresAleatorio = () => {
    const embaralhados = shuffle([...jogadores]);
    const resultado: { [key: string]: Player[] } = {};
    times.forEach((time) => {
      resultado[time.name] = [];
    });
    embaralhados.forEach((jogador, idx) => {
      const timeIdx = idx % times.length;
      resultado[times[timeIdx].name].push(jogador);
    });
    return resultado;
  };

  // Função para balancear times por habilidade e posição
  const balancearTimesPorHabilidade = () => {
    if (times.length < 2) {
      Alert.alert("Erro", "É necessário ter pelo menos 2 times cadastrados para balancear.");
      return sortearJogadoresAleatorio();
    }

    // Inicializar times vazios
    const resultado: { [key: string]: Player[] } = {};
    times.forEach((time) => {
      resultado[time.name] = [];
    });
    
    // Agrupar jogadores por posição
    const jogadoresPorPosicao: { [key: string]: Player[] } = {};
    jogadores.forEach(jogador => {
      if (!jogadoresPorPosicao[jogador.position]) {
        jogadoresPorPosicao[jogador.position] = [];
      }
      jogadoresPorPosicao[jogador.position].push(jogador);
    });
    
    // Ordenar cada grupo de posição por habilidade (do mais habilidoso para o menos)
    Object.keys(jogadoresPorPosicao).forEach(posicao => {
      jogadoresPorPosicao[posicao].sort((a, b) => b.skill - a.skill);
    });
    
    // Distribuir goleiros primeiro (se houver)
    if (jogadoresPorPosicao["Goleiro"]) {
      const goleiros = jogadoresPorPosicao["Goleiro"];
      delete jogadoresPorPosicao["Goleiro"];
      
      // Distribuir um goleiro para cada time, começando pelos mais habilidosos
      goleiros.forEach((goleiro, index) => {
        if (index < times.length) {
          resultado[times[index].name].push(goleiro);
        } else {
          // Se houver mais goleiros que times, distribuir usando zigzag
          const timeIndex = index % times.length;
          resultado[times[timeIndex].name].push(goleiro);
        }
      });
    }
    
    // Distribuir as demais posições usando o método "serpentina" (zigzag)
    Object.keys(jogadoresPorPosicao).forEach(posicao => {
      let direcao = 1; // 1 para frente, -1 para trás
      let timeAtual = 0;
      
      // Calcular o time inicial com base na média de habilidade atual
      // Começar pelo time com menor média de habilidade
      const mediasPorTime = times.map(time => ({
        nome: time.name,
        media: calcularMediaHabilidade(resultado[time.name])
      }));
      
      mediasPorTime.sort((a, b) => a.media - b.media);
      const timeInicial = times.findIndex(t => t.name === mediasPorTime[0].nome);
      timeAtual = timeInicial >= 0 ? timeInicial : 0;
      
      jogadoresPorPosicao[posicao].forEach((jogador) => {
        // Adicionar jogador ao time atual
        resultado[times[timeAtual].name].push(jogador);
        
        // Mover para o próximo time
        timeAtual += direcao;
        
        // Mudar direção se chegou ao final ou início da lista de times
        if (timeAtual >= times.length - 1 || timeAtual <= 0) {
          direcao *= -1;
        }
      });
    });
    
    return resultado;
  };

  // Função principal de sorteio que decide qual método usar
  const sortearJogadores = () => {
    let resultado;
    
    if (balancearTimes) {
      resultado = balancearTimesPorHabilidade();
    } else {
      resultado = sortearJogadoresAleatorio();
    }
    
    setTimesJogadores(resultado);
  };

  // Função para salvar distribuição atual
  const salvarDistribuicao = async () => {
    if (!distributionName.trim()) {
      Alert.alert("Erro", "Por favor, digite um nome para a distribuição.");
      return;
    }

    if (Object.keys(timesJogadores).length === 0) {
      Alert.alert("Erro", "Não há distribuição para salvar. Faça o sorteio primeiro.");
      return;
    }

    const newDistribution: SavedDistribution = {
      id: Date.now().toString(),
      name: distributionName.trim(),
      date: new Date().toLocaleDateString('pt-BR'),
      distribution: timesJogadores,
      teams: times,
    };

    const updatedDistributions = [...savedDistributions, newDistribution];
    setSavedDistributions(updatedDistributions);
    await AsyncStorage.setItem("savedDistributions", JSON.stringify(updatedDistributions));
    
    setDistributionName("");
    setShowSaveModal(false);
    Alert.alert("Sucesso", "Distribuição salva com sucesso!");
  };

  // Função para carregar distribuição salva
  const carregarDistribuicao = (distribution: SavedDistribution) => {
    setTimesJogadores(distribution.distribution);
    setTimes(distribution.teams);
    setShowLoadModal(false);
    Alert.alert("Sucesso", `Distribuição "${distribution.name}" carregada com sucesso!`);
  };

  // Função para excluir distribuição salva
  const excluirDistribuicao = async (id: string) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir esta distribuição?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            const updatedDistributions = savedDistributions.filter(d => d.id !== id);
            setSavedDistributions(updatedDistributions);
            await AsyncStorage.setItem("savedDistributions", JSON.stringify(updatedDistributions));
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Distribuir Jogadores" icon="shuffle" theme="light" />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.switchRow}>
            <Text
              style={{ color: theme.colors.primary, fontWeight: "bold", fontSize: 16 }}
            >
              Sortear jogadores automaticamente
            </Text>
            <Switch value={autoSortear} onValueChange={setAutoSortear} />
          </View>
          
          {autoSortear && (
            <View style={styles.switchRow}>
              <Text
                style={{ color: theme.colors.primary, fontWeight: "bold", fontSize: 16 }}
              >
                Balancear times por habilidade e posição
              </Text>
              <Switch value={balancearTimes} onValueChange={setBalancearTimes} />
            </View>
          )}
          
          {autoSortear ? (
            <>
              <TouchableOpacity style={styles.sortBtn} onPress={sortearJogadores}>
                <Text style={styles.sortBtnText}>
                  {balancearTimes ? "Sortear times balanceados por habilidade e posição" : "Sortear jogadores aleatoriamente"}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.distributionButtons}>
                <TouchableOpacity 
                  style={[styles.distributionBtn, styles.saveBtn]} 
                  onPress={() => setShowSaveModal(true)}
                  disabled={Object.keys(timesJogadores).length === 0}
                >
                  <Text style={styles.distributionBtnText}>💾 Salvar Distribuição</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.distributionBtn, styles.loadBtn]} 
                  onPress={() => setShowLoadModal(true)}
                  disabled={savedDistributions.length === 0}
                >
                  <Text style={styles.distributionBtnText}>📂 Carregar Distribuição</Text>
                </TouchableOpacity>
              </View>
              
              {Object.keys(timesJogadores).length > 0 && (
                <View style={styles.infoContainer}>
                  <Text style={styles.infoTitle}>Informações dos times:</Text>
                  {Object.keys(timesJogadores).map((timeNome) => {
                    const media = calcularMediaHabilidade(timesJogadores[timeNome]);
                    return (
                      <Text key={timeNome} style={styles.infoText}>
                        {timeNome}: {timesJogadores[timeNome].length} jogadores - Média de habilidade: {media.toFixed(1)}
                      </Text>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View>
              <Text style={styles.manualTitle}>
                Selecione manualmente o time de cada jogador:
              </Text>
              {jogadores.map((jogador) => (
                <View key={jogador.name} style={styles.jogadorRow}>
                  <View style={styles.jogadorInfo}>
                    <Text style={styles.jogadorNome}>{jogador.name}</Text>
                    <View style={{flexDirection: "row", alignItems: "center"}}>
                      <Text style={styles.positionBadge}>{jogador.position}</Text>
                      <View style={styles.skillStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text 
                            key={star} 
                            style={[styles.starText, jogador.skill >= star ? styles.starActive : {}]}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    {times.map((item) => {
                      // Verificar se o jogador está neste time
                      const jogadorNoTime = timesJogadores[item.name]?.some(
                        (j) => j.name === jogador.name
                      );
                      
                      return (
                        <TouchableOpacity
                          key={item.name}
                          style={[
                            styles.timeBtn,
                            jogadorNoTime && styles.timeBtnActive,
                          ]}
                          onPress={() => {
                            setTimesJogadores((prev) => {
                              const novo = { ...prev };
                              // Remover o jogador de todos os times
                              Object.keys(novo).forEach((t) => {
                                novo[t] = novo[t].filter((j) => j.name !== jogador.name);
                              });
                              // Adicionar o jogador ao time selecionado
                              if (!novo[item.name]) novo[item.name] = [];
                              novo[item.name].push(jogador);
                              return novo;
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.timeBtnText,
                              jogadorNoTime && styles.timeBtnTextActive,
                            ]}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
          {times.map((item) => (
              <View key={item.name} style={styles.teamBox}>
                <View style={styles.teamHeader}>
                  <Text style={styles.teamTitle}>
                    {item.name} {item.color ? `(${item.color})` : ""}
                  </Text>
                  {timesJogadores[item.name] && timesJogadores[item.name].length > 0 && (
                    <Text style={styles.teamSkillAvg}>
                      Média: {calcularMediaHabilidade(timesJogadores[item.name]).toFixed(1)}
                    </Text>
                  )}
                </View>
                {(timesJogadores[item.name] || []).map((jogador) => (
                  <View key={jogador.name} style={styles.playerRow}>
                    <View style={styles.playerInfo}>
                      <Text style={styles.player}>{jogador.name}</Text>
                      <View style={{flexDirection: "row", alignItems: "center"}}>
                        <Text style={styles.positionBadgeSmall}>{jogador.position}</Text>
                        <View style={styles.skillStarsSmall}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Text 
                              key={star} 
                              style={[styles.starTextTiny, jogador.skill >= star ? styles.starActive : {}]}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))}
        </View>
      </ScrollView>
      
      {/* Modal para salvar distribuição */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Salvar Distribuição</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome da distribuição"
              value={distributionName}
              onChangeText={setDistributionName}
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => {
                  setShowSaveModal(false);
                  setDistributionName("");
                }}
              >
                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmModalBtn]}
                onPress={salvarDistribuicao}
              >
                <Text style={styles.confirmModalBtnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Modal para carregar distribuição */}
      <Modal
        visible={showLoadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLoadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Carregar Distribuição</Text>
            <ScrollView style={styles.distributionsList}>
              {savedDistributions.length === 0 ? (
                <Text style={styles.emptyDistributionsText}>
                  Nenhuma distribuição salva encontrada.
                </Text>
              ) : (
                savedDistributions.map((distribution) => (
                  <View key={distribution.id} style={styles.distributionItem}>
                    <View style={styles.distributionInfo}>
                      <Text style={styles.distributionItemName}>{distribution.name}</Text>
                      <Text style={styles.distributionItemDate}>{distribution.date}</Text>
                    </View>
                    <View style={styles.distributionActions}>
                      <TouchableOpacity
                        style={styles.loadDistributionBtn}
                        onPress={() => carregarDistribuicao(distribution)}
                      >
                        <Text style={styles.loadDistributionBtnText}>Carregar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteDistributionBtn}
                        onPress={() => excluirDistribuicao(distribution.id)}
                      >
                        <Text style={styles.deleteDistributionBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelModalBtn, { marginTop: theme.spacing.md }]}
              onPress={() => setShowLoadModal(false)}
            >
              <Text style={styles.cancelModalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    justifyContent: "space-between",
    ...theme.components.card
  },
  sortBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
    marginVertical: theme.spacing.sm,
  },
  sortBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.body.fontSize,
    fontWeight: "bold",
  },
  manualTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  jogadorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    ...theme.components.card
  },
  jogadorInfo: {
    flexDirection: "column",
    marginRight: theme.spacing.sm,
    flex: 1,
  },
  jogadorNome: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
    marginRight: theme.spacing.sm,
  },
  skillStars: {
    flexDirection: "row",
    marginTop: theme.spacing.xs,
  },
  skillStarsSmall: {
    flexDirection: "row",
    marginLeft: theme.spacing.sm,
  },
  starText: {
    fontSize: 16,
    color: theme.colors.border,
    marginRight: 2,
  },
  starTextTiny: {
    fontSize: 12,
    color: theme.colors.border,
    marginRight: 1,
  },
  starActive: {
    color: theme.colors.primary,
  },
  infoContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  infoTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  teamSkillAvg: {
    ...theme.typography.caption,
    color: theme.colors.secondary,
    fontWeight: "bold",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  timeBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  timeBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  timeBtnText: {
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: theme.typography.caption.fontSize,
  },
  timeBtnTextActive: {
    color: theme.colors.white,
  },
  teamBox: {
    marginBottom: theme.spacing.md,
    ...theme.components.card
  },
  teamTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  player: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  playerInfo: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  positionBadge: {
    ...theme.typography.caption,
    color: theme.colors.white,
    backgroundColor: theme.colors.secondary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    overflow: "hidden",
  },
  positionBadgeSmall: {
    ...theme.typography.caption,
    fontSize: 10,
    color: theme.colors.white,
    backgroundColor: theme.colors.secondary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 4,
    overflow: "hidden",
  },
  distributionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  distributionBtn: {
    ...theme.components.button,
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  saveBtn: {
    backgroundColor: theme.colors.success,
  },
  loadBtn: {
    backgroundColor: theme.colors.secondary,
  },
  distributionBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "bold",
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
    maxHeight: "80%",
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  modalInput: {
    ...theme.components.input,
    marginBottom: theme.spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  modalBtn: {
    ...theme.components.button,
    flex: 1,
    paddingVertical: theme.spacing.sm,
  },
  cancelModalBtn: {
    backgroundColor: theme.colors.border,
  },
  confirmModalBtn: {
    backgroundColor: theme.colors.primary,
  },
  cancelModalBtnText: {
    color: theme.colors.text,
    fontWeight: "bold",
  },
  confirmModalBtnText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
  distributionsList: {
    maxHeight: 300,
    marginBottom: theme.spacing.md,
  },
  distributionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  distributionInfo: {
    flex: 1,
  },
  distributionItemName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  distributionItemDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  distributionActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  loadDistributionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  loadDistributionBtnText: {
    color: theme.colors.white,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: "bold",
  },
  deleteDistributionBtn: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  deleteDistributionBtnText: {
    fontSize: 16,
  },
  emptyDistributionsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginVertical: theme.spacing.lg,
  },
});
