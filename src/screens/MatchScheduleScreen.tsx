import React, { useState, useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";

function shuffle(array: any[]) {
  return array.sort(() => Math.random() - 0.5);
}

export default function MatchScheduleScreen() {
  const isFocused = useIsFocused();
  const [quantidadeJogos, setQuantidadeJogos] = useState<string>("");
  const [autoSortear, setAutoSortear] = useState(true);
  const [times, setTimes] = useState<{ name: string; color: string }[]>([]);
  const [jogos, setJogos] = useState<{ timeA: string; timeB: string }[]>([]);
  const [manualJogos, setManualJogos] = useState<
    { timeA: string; timeB: string }[]
  >([]);
  const [timeSelecionadoA, setTimeSelecionadoA] = useState<string>("");
  const [timeSelecionadoB, setTimeSelecionadoB] = useState<string>("");
  const [tipoCampeonato, setTipoCampeonato] = useState<
    "pontos" | "mata" | "grupos"
  >("pontos");
  const [placaresJogos, setPlacaresJogos] = useState<Array<{ placarA: string; placarB: string; goleadoresA: string[]; goleadoresB: string[] }>>([]);
  const [resultadosSalvos, setResultadosSalvos] = useState<Array<{ timeA: string; timeB: string; placarA: number; placarB: number; data: string; goleadoresA?: string[]; goleadoresB?: string[] }>>([]);
  const [tabelaClassificacao, setTabelaClassificacao] = useState<
    { time: string; pontos: number; jogos: number; vitorias: number; empates: number; derrotas: number; golsPro: number; golsContra: number; saldoGols: number }[]
  >([]);
  const [jogadores, setJogadores] = useState<{ name: string; skill: number; position: string; yellowCards: number; redCards: number }[]>([]);
  const [jogadoresPorTime, setJogadoresPorTime] = useState<{[key: string]: { name: string; skill: number; position: string; yellowCards: number; redCards: number }[]}>({});

  useEffect(() => {
    const fetchData = async () => {
      const timesSalvos = await AsyncStorage.getItem("teams");
      setTimes(timesSalvos ? JSON.parse(timesSalvos) : []);
      const jogosSalvos = await AsyncStorage.getItem("jogos_sorteados");
      setJogos(jogosSalvos ? JSON.parse(jogosSalvos) : []);
      const resultadosSalvosStorage = await AsyncStorage.getItem("resultados_jogos");
      const resultados = resultadosSalvosStorage ? JSON.parse(resultadosSalvosStorage) : [];
      setResultadosSalvos(resultados);
      const placaresStorage = await AsyncStorage.getItem("placares_jogos");
      const placares = placaresStorage ? JSON.parse(placaresStorage) : [];
      // Garantir compatibilidade com formato antigo
      const placaresComGoleadores = placares.map((placar: any) => ({
        placarA: placar.placarA || "",
        placarB: placar.placarB || "",
        goleadoresA: placar.goleadoresA || [],
        goleadoresB: placar.goleadoresB || []
      }));
      setPlacaresJogos(placaresComGoleadores);
      
      // Carregar jogadores
      const jogadoresSalvos = await AsyncStorage.getItem("players");
      setJogadores(jogadoresSalvos ? JSON.parse(jogadoresSalvos) : []);
      
      // Calcular tabela de classificação se houver resultados
      if (resultados.length > 0) {
        calcularTabelaClassificacao(resultados);
      }
    };
    if (isFocused) fetchData();
  }, [isFocused]);

  // Recalcular tabela quando times ou tipo de campeonato mudarem
  useEffect(() => {
    if (resultadosSalvos.length > 0 && times.length > 0) {
      calcularTabelaClassificacao(resultadosSalvos);
    }
  }, [times, tipoCampeonato, resultadosSalvos]);

  const sortearJogos = () => {
    let jogosGerados: { timeA: string; timeB: string }[] = [];
    const embaralhados = shuffle([...times]);
    const qtd = parseInt(quantidadeJogos);
    if (!isNaN(qtd) && qtd > 0) {
      // Sorteio baseado na quantidade definida
      let possiveisConfrontos: { timeA: string; timeB: string }[] = [];
      for (let i = 0; i < embaralhados.length; i++) {
        for (let j = i + 1; j < embaralhados.length; j++) {
          possiveisConfrontos.push({
            timeA: embaralhados[i].name,
            timeB: embaralhados[j].name,
          });
        }
      }
      possiveisConfrontos = shuffle(possiveisConfrontos);
      jogosGerados = possiveisConfrontos.slice(0, qtd);
    } else {
      // Sorteio padrão por tipo de campeonato
      if (tipoCampeonato === "pontos") {
        for (let i = 0; i < embaralhados.length; i++) {
          for (let j = i + 1; j < embaralhados.length; j++) {
            jogosGerados.push({
              timeA: embaralhados[i].name,
              timeB: embaralhados[j].name,
            });
          }
        }
      } else if (tipoCampeonato === "mata") {
        for (let i = 0; i < embaralhados.length; i += 2) {
          if (embaralhados[i + 1]) {
            jogosGerados.push({
              timeA: embaralhados[i].name,
              timeB: embaralhados[i + 1].name,
            });
          }
        }
      } else if (tipoCampeonato === "grupos") {
        const grupoA = embaralhados.filter((_, idx) => idx % 2 === 0);
        const grupoB = embaralhados.filter((_, idx) => idx % 2 !== 0);
        if (grupoA && Array.isArray(grupoA) && grupoB && Array.isArray(grupoB)) {
          grupoA.forEach((a) =>
            grupoB.forEach((b) =>
              jogosGerados.push({ timeA: a.name, timeB: b.name })
            )
          );
        }
      }
    }
    setJogos(jogosGerados);
  };

  // Salvar jogos sorteados manualmente
  const salvarJogosSorteados = async () => {
    try {
      await AsyncStorage.setItem("jogos_sorteados", JSON.stringify(jogos));
      setJogos([...jogos]); // Atualiza a lista imediatamente
      alert("Jogos sorteados salvos com sucesso!");
    } catch (e) {
      alert("Erro ao salvar jogos sorteados");
    }
  };

  // Remover jogos salvos
  const removerJogosSalvos = async () => {
    try {
      await AsyncStorage.removeItem("jogos_sorteados");
      setJogos([]);
      alert("Jogos salvos removidos!");
    } catch (e) {
      alert("Erro ao remover jogos salvos");
    }
  };
  // Função para adicionar jogo manualmente
  const adicionarJogoManual = () => {
    if (
      timeSelecionadoA &&
      timeSelecionadoB &&
      timeSelecionadoA !== timeSelecionadoB
    ) {
      setManualJogos([
        ...manualJogos,
        { timeA: timeSelecionadoA, timeB: timeSelecionadoB },
      ]);
      setPlacaresJogos([...placaresJogos, { placarA: "", placarB: "", goleadoresA: [], goleadoresB: [] }]);
      setTimeSelecionadoA("");
      setTimeSelecionadoB("");
    }
  };

  // Função para salvar placares no AsyncStorage
  const salvarPlacares = async () => {
    try {
      await AsyncStorage.setItem("placares_jogos", JSON.stringify(placaresJogos));
      alert("Placares salvos com sucesso!");
    } catch (e) {
      alert("Erro ao salvar placares");
    }
  };

  // Função para finalizar jogos e salvar resultados
  const finalizarJogos = async () => {
    const jogosAtivos = autoSortear ? jogos : manualJogos;
    const novosResultados: { timeA: string; timeB: string; placarA: number; placarB: number; data: string; goleadoresA?: string[]; goleadoresB?: string[] }[] = [];
    
    if (jogosAtivos && Array.isArray(jogosAtivos)) {
      jogosAtivos.forEach((jogo, index) => {
        const placar = placaresJogos[index];
        if (placar && placar.placarA !== "" && placar.placarB !== "") {
          novosResultados.push({
            timeA: jogo.timeA,
            timeB: jogo.timeB,
            placarA: parseInt(placar.placarA) || 0,
            placarB: parseInt(placar.placarB) || 0,
            data: new Date().toLocaleDateString('pt-BR'),
            goleadoresA: placar.goleadoresA || [],
            goleadoresB: placar.goleadoresB || []
          });
        }
      });
    }

    const todosResultados = [...resultadosSalvos, ...novosResultados];
    
    try {
      await AsyncStorage.setItem("resultados_jogos", JSON.stringify(todosResultados));
      setResultadosSalvos(todosResultados);
      calcularTabelaClassificacao(todosResultados);
      alert("Resultados finalizados e salvos!");
    } catch (e) {
      alert("Erro ao salvar resultados");
    }
  };

  // Função para calcular pontuação por tipo de campeonato
  const calcularTabelaClassificacao = (resultados: { timeA: string; timeB: string; placarA: number; placarB: number; data: string; goleadoresA?: string[]; goleadoresB?: string[] }[]) => {
    const tabela: { [key: string]: { time: string; pontos: number; jogos: number; vitorias: number; empates: number; derrotas: number; golsPro: number; golsContra: number; saldoGols: number } } = {};

    // Inicializar todos os times na tabela
    if (times && Array.isArray(times)) {
      times.forEach(time => {
      tabela[time.name] = {
        time: time.name,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldoGols: 0
      };
    });
    }

    // Processar resultados
    if (resultados && Array.isArray(resultados)) {
      resultados.forEach(resultado => {
      if (tabela[resultado.timeA] && tabela[resultado.timeB]) {
        // Time A
        tabela[resultado.timeA].jogos++;
        tabela[resultado.timeA].golsPro += resultado.placarA;
        tabela[resultado.timeA].golsContra += resultado.placarB;
        tabela[resultado.timeA].saldoGols = tabela[resultado.timeA].golsPro - tabela[resultado.timeA].golsContra;

        // Time B
        tabela[resultado.timeB].jogos++;
        tabela[resultado.timeB].golsPro += resultado.placarB;
        tabela[resultado.timeB].golsContra += resultado.placarA;
        tabela[resultado.timeB].saldoGols = tabela[resultado.timeB].golsPro - tabela[resultado.timeB].golsContra;

        // Determinar resultado e pontos
        if (resultado.placarA > resultado.placarB) {
          // Time A venceu
          tabela[resultado.timeA].vitorias++;
          tabela[resultado.timeB].derrotas++;
          if (tipoCampeonato === "pontos") {
            tabela[resultado.timeA].pontos += 3;
          } else {
            tabela[resultado.timeA].pontos += 1;
          }
        } else if (resultado.placarB > resultado.placarA) {
          // Time B venceu
          tabela[resultado.timeB].vitorias++;
          tabela[resultado.timeA].derrotas++;
          if (tipoCampeonato === "pontos") {
            tabela[resultado.timeB].pontos += 3;
          } else {
            tabela[resultado.timeB].pontos += 1;
          }
        } else {
          // Empate
          tabela[resultado.timeA].empates++;
          tabela[resultado.timeB].empates++;
          if (tipoCampeonato === "pontos") {
            tabela[resultado.timeA].pontos += 1;
            tabela[resultado.timeB].pontos += 1;
          }
        }
      }
    });
    }

    // Converter para array e ordenar
    const tabelaArray = Object.values(tabela).sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
      return b.golsPro - a.golsPro;
    });

    setTabelaClassificacao(tabelaArray);
  };

  // Função para limpar histórico
  const limparHistorico = async () => {
    try {
      await AsyncStorage.removeItem("resultados_jogos");
      setResultadosSalvos([]);
      setTabelaClassificacao([]);
      alert("Histórico limpo com sucesso!");
    } catch (e) {
      alert("Erro ao limpar histórico");
    }
  };

  // Função para adicionar goleador
  const adicionarGoleador = (jogoIndex: number, time: 'A' | 'B', jogador: string) => {
    if (jogoIndex < 0 || jogoIndex >= placaresJogos.length) return;
    
    const novos = [...placaresJogos];
    const campo = time === 'A' ? 'goleadoresA' : 'goleadoresB';
    const goleadoresAtuais = novos[jogoIndex][campo] || [];
    
    if (!goleadoresAtuais.includes(jogador)) {
      novos[jogoIndex] = {
        ...novos[jogoIndex],
        [campo]: [...goleadoresAtuais, jogador]
      };
      setPlacaresJogos(novos);
    }
  };

  // Função para remover goleador
  const removerGoleador = (jogoIndex: number, time: 'A' | 'B', jogador: string) => {
    if (jogoIndex < 0 || jogoIndex >= placaresJogos.length) return;
    
    const novos = [...placaresJogos];
    const campo = time === 'A' ? 'goleadoresA' : 'goleadoresB';
    const goleadoresAtuais = novos[jogoIndex][campo] || [];
    
    novos[jogoIndex] = {
      ...novos[jogoIndex],
      [campo]: goleadoresAtuais.filter(g => g !== jogador)
    };
    setPlacaresJogos(novos);
  };

  // Função para carregar jogadores de todos os times
  const carregarJogadoresPorTime = async () => {
    try {
      const distribuicoesSalvas = await AsyncStorage.getItem("savedDistributions");
      if (!distribuicoesSalvas) {
        setJogadoresPorTime({});
        return;
      }
      
      const distribuicoes = JSON.parse(distribuicoesSalvas);
      if (!Array.isArray(distribuicoes) || distribuicoes.length === 0) {
        setJogadoresPorTime({});
        return;
      }
      
      // Pegar a distribuição mais recente (última do array)
      const ultimaDistribuicao = distribuicoes[distribuicoes.length - 1];
      if (ultimaDistribuicao?.distribution) {
        setJogadoresPorTime(ultimaDistribuicao.distribution);
      } else {
        setJogadoresPorTime({});
      }
    } catch (error) {
      console.error('Erro ao buscar jogadores dos times:', error);
      setJogadoresPorTime({});
    }
  };

  // Carregar jogadores por time quando a tela for focada
  useEffect(() => {
    if (isFocused) {
      carregarJogadoresPorTime();
    }
  }, [isFocused]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Definir Jogos" icon="calendar" theme="light" />
      <FlatList
        data={[1]}
        renderItem={() => (
          <View style={styles.container}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tipo de campeonato:</Text>
              <View style={{ maxWidth: "100%" }}>
                <FlatList
                  horizontal
                  data={["pontos", "mata", "grupos"]}
                  keyExtractor={(tipo) => tipo}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10 }}
                  renderItem={({ item: tipo }) => (
                    <TouchableOpacity
                      style={[
                        styles.champTypeBtn,
                        tipoCampeonato === tipo && styles.champTypeBtnActive,
                      ]}
                      onPress={() => setTipoCampeonato(tipo as any)}
                    >
                      <Text
                        style={[
                          styles.champTypeText,
                          tipoCampeonato === tipo && styles.champTypeTextActive,
                        ]}
                      >
                        {tipo === "pontos"
                          ? "Pontos Corridos"
                          : tipo === "mata"
                          ? "Mata-Mata"
                          : "Grupos"}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Quantidade de jogos:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={quantidadeJogos}
                onChangeText={setQuantidadeJogos}
                placeholder="Ex: 5"
                placeholderTextColor="#185a9d"
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Sortear jogos automaticamente
              </Text>
              <Switch
                value={autoSortear}
                onValueChange={setAutoSortear}
                thumbColor={autoSortear ? "#43cea2" : "#ccc"}
                trackColor={{ true: "#b2f7ef", false: "#eee" }}
              />
            </View>
            {autoSortear ? (
              <>
                <TouchableOpacity style={styles.sortBtn} onPress={sortearJogos}>
                  <Text style={styles.sortBtnText}>Sortear jogos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    { backgroundColor: theme.colors.primary, marginTop: 8 },
                  ]}
                  onPress={salvarJogosSorteados}
                >
                  <Text style={[styles.sortBtnText, { color: theme.colors.secondary }]}>
                    Salvar jogos sorteados
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    { backgroundColor: theme.colors.error, marginTop: 8 },
                  ]}
                  onPress={removerJogosSalvos}
                >
                  <Text style={[styles.sortBtnText, { color: theme.colors.text }]}>
                    Remover jogos salvos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    { backgroundColor: theme.colors.secondary, marginTop: 8 },
                  ]}
                  onPress={salvarPlacares}
                >
                  <Text style={[styles.sortBtnText, { color: theme.colors.primary }]}>
                    💾 Salvar Placares
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortBtn,
                    { backgroundColor: theme.colors.success || "#28a745", marginTop: 8 },
                  ]}
                  onPress={finalizarJogos}
                >
                  <Text style={[styles.sortBtnText, { color: theme.colors.white }]}>
                    🏆 Finalizar Jogos
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                  Defina manualmente os confrontos:
                </Text>
                <View style={styles.manualRow}>
                  <Text style={styles.manualLabel}>Time A:</Text>
                  <FlatList
                    horizontal
                    data={times}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.teamBtn,
                          timeSelecionadoA === item.name &&
                            styles.teamBtnActive,
                        ]}
                        onPress={() => setTimeSelecionadoA(item.name)}
                      >
                        <Text
                          style={[
                            styles.teamBtnText,
                            timeSelecionadoA === item.name &&
                              styles.teamBtnTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
                <View style={styles.manualRow}>
                  <Text style={styles.manualLabel}>Time B:</Text>
                  <FlatList
                    horizontal
                    data={times}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.teamBtn,
                          timeSelecionadoB === item.name &&
                            styles.teamBtnActive,
                        ]}
                        onPress={() => setTimeSelecionadoB(item.name)}
                      >
                        <Text
                          style={[
                            styles.teamBtnText,
                            timeSelecionadoB === item.name &&
                              styles.teamBtnTextActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
                <TouchableOpacity
                  style={styles.addGameBtn}
                  onPress={adicionarJogoManual}
                >
                  <Text style={styles.addGameBtnText}>Adicionar Jogo</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Jogos:</Text>
              <FlatList
                data={autoSortear ? jogos : manualJogos}
                keyExtractor={(_, idx) => idx.toString()}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item, index }) => (
                  <View style={styles.matchCard}>
                    <View style={styles.matchRow}>
                      <View style={styles.teamBox}>
                        <Text style={styles.teamName}>{item.timeA}</Text>
                      </View>
                      <Text style={styles.vsText}>vs</Text>
                      <View style={styles.teamBox}>
                        <Text style={styles.teamName}>{item.timeB}</Text>
                      </View>
                    </View>
                    {/* Inputs de placar */}
                    <View style={styles.scoreRow}>
                      <TextInput
                        style={styles.scoreInput}
                        keyboardType="numeric"
                        value={placaresJogos[index]?.placarA ?? ""}
                        onChangeText={(txt) => {
                          const novos = [...placaresJogos];
                          if (!novos[index]) {
                            novos[index] = { placarA: "", placarB: "", goleadoresA: [], goleadoresB: [] };
                          }
                          novos[index] = { ...novos[index], placarA: txt };
                          setPlacaresJogos(novos);
                        }}
                        placeholder="Placar A"
                        placeholderTextColor="#185a9d"
                      />
                      <Text
                        style={{
                          color: "#185a9d",
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        -
                      </Text>
                      <TextInput
                        style={styles.scoreInput}
                        keyboardType="numeric"
                        value={placaresJogos[index]?.placarB ?? ""}
                        onChangeText={(txt) => {
                          const novos = [...placaresJogos];
                          if (!novos[index]) {
                            novos[index] = { placarA: "", placarB: "", goleadoresA: [], goleadoresB: [] };
                          }
                          novos[index] = { ...novos[index], placarB: txt };
                          setPlacaresJogos(novos);
                        }}
                        placeholder="Placar B"
                        placeholderTextColor="#185a9d"
                      />
                    </View>
                    
                    {/* Seleção de Goleadores */}
                    <View style={styles.goalScorersSection}>
                      <Text style={styles.goalScorersTitle}>⚽ Goleadores:</Text>
                      
                      {/* Goleadores Time A */}
                      <View style={styles.teamGoalScorers}>
                        <Text style={styles.teamGoalScorersTitle}>{item.timeA}:</Text>
                        <View style={styles.goalScorersRow}>
                          {(jogadoresPorTime[item.timeA] ?? []).map((jogador) => {
                            const isSelected = placaresJogos[index]?.goleadoresA?.includes(jogador.name) || false;
                            return (
                              <TouchableOpacity
                                key={jogador.name}
                                style={[
                                  styles.goalScorerBtn,
                                  isSelected && styles.goalScorerBtnActive
                                ]}
                                onPress={() => {
                                  if (isSelected) {
                                    removerGoleador(index, 'A', jogador.name);
                                  } else {
                                    adicionarGoleador(index, 'A', jogador.name);
                                  }
                                }}
                              >
                                <Text style={[
                                  styles.goalScorerBtnText,
                                  isSelected && styles.goalScorerBtnTextActive
                                ]}>
                                  {jogador.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        {(placaresJogos[index]?.goleadoresA?.length ?? 0) > 0 && (
                          <Text style={styles.selectedGoalScorers}>
                            Selecionados: {placaresJogos[index].goleadoresA.join(", ")}
                          </Text>
                        )}
                      </View>
                      
                      {/* Goleadores Time B */}
                      <View style={styles.teamGoalScorers}>
                        <Text style={styles.teamGoalScorersTitle}>{item.timeB}:</Text>
                        <View style={styles.goalScorersRow}>
                          {(jogadoresPorTime[item.timeB] ?? []).map((jogador) => {
                            const isSelected = placaresJogos[index]?.goleadoresB?.includes(jogador.name) || false;
                            return (
                              <TouchableOpacity
                                key={jogador.name}
                                style={[
                                  styles.goalScorerBtn,
                                  isSelected && styles.goalScorerBtnActive
                                ]}
                                onPress={() => {
                                  if (isSelected) {
                                    removerGoleador(index, 'B', jogador.name);
                                  } else {
                                    adicionarGoleador(index, 'B', jogador.name);
                                  }
                                }}
                              >
                                <Text style={[
                                  styles.goalScorerBtnText,
                                  isSelected && styles.goalScorerBtnTextActive
                                ]}>
                                  {jogador.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        {(placaresJogos[index]?.goleadoresB?.length ?? 0) > 0 && (
                          <Text style={styles.selectedGoalScorers}>
                            Selecionados: {placaresJogos[index].goleadoresB.join(", ")}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhum jogo definido.</Text>
                }
              />
            </View>
            
            {/* Tabela de Classificação */}
            {tabelaClassificacao.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🏆 Tabela de Classificação:</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Time</Text>
                  <Text style={styles.tableHeaderText}>Pts</Text>
                  <Text style={styles.tableHeaderText}>J</Text>
                  <Text style={styles.tableHeaderText}>V</Text>
                  <Text style={styles.tableHeaderText}>E</Text>
                  <Text style={styles.tableHeaderText}>D</Text>
                  <Text style={styles.tableHeaderText}>SG</Text>
                </View>
                {tabelaClassificacao.map((item, index) => (
                  <View key={item.time} style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}>
                    <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>{item.time}</Text>
                    <Text style={[styles.tableCell, { fontWeight: 'bold', color: theme.colors.primary }]}>{item.pontos}</Text>
                    <Text style={styles.tableCell}>{item.jogos}</Text>
                    <Text style={styles.tableCell}>{item.vitorias}</Text>
                    <Text style={styles.tableCell}>{item.empates}</Text>
                    <Text style={styles.tableCell}>{item.derrotas}</Text>
                    <Text style={[styles.tableCell, { color: item.saldoGols >= 0 ? '#28a745' : '#dc3545' }]}>{item.saldoGols > 0 ? '+' : ''}{item.saldoGols}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Histórico de Resultados */}
            {resultadosSalvos.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle}>📊 Histórico de Resultados:</Text>
                  <TouchableOpacity
                    style={styles.clearHistoryBtn}
                    onPress={limparHistorico}
                  >
                    <Text style={styles.clearHistoryBtnText}>🗑️ Limpar</Text>
                  </TouchableOpacity>
                </View>
                {resultadosSalvos.slice(-10).reverse().map((resultado, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyDate}>{resultado.data}</Text>
                    <View style={styles.historyMatch}>
                      <Text style={styles.historyTeam}>{resultado.timeA}</Text>
                      <Text style={styles.historyScore}>{resultado.placarA} - {resultado.placarB}</Text>
                      <Text style={styles.historyTeam}>{resultado.timeB}</Text>
                    </View>
                    {/* Mostrar goleadores se disponíveis */}
                    {((resultado.goleadoresA?.length ?? 0) > 0 || (resultado.goleadoresB?.length ?? 0) > 0) && (
                      <View style={styles.historyGoalScorers}>
                        {(resultado.goleadoresA && resultado.goleadoresA.length > 0) && (
                          <Text style={styles.historyGoalScorerText}>
                            ⚽ {resultado.timeA}: {resultado.goleadoresA.join(", ")}
                          </Text>
                        )}
                        {(resultado.goleadoresB && resultado.goleadoresB.length > 0) && (
                          <Text style={styles.historyGoalScorerText}>
                            ⚽ {resultado.timeB}: {resultado.goleadoresB.join(", ")}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
                {resultadosSalvos.length > 10 && (
                  <Text style={styles.moreResultsText}>... e mais {resultadosSalvos.length - 10} resultados</Text>
                )}
              </View>
            )}
          </View>
        )}
        keyExtractor={() => "main"}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: theme.spacing.md,
    ...theme.components.card
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
    ...theme.components.card
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  champTypeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  champTypeBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  champTypeBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  champTypeText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  champTypeTextActive: {
    color: theme.colors.white,
  },
  input: {
    ...theme.components.input,
    marginTop: theme.spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  switchLabel: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },
  sortBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  sortBtnText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  manualLabel: {
    ...theme.typography.label,
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  teamBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  teamBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  teamBtnText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  teamBtnTextActive: {
    color: theme.colors.white,
  },
  addGameBtn: {
    ...theme.components.button,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
  },
  addGameBtnText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  matchCard: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: "center" as const,
    width: "100%",
    alignSelf: "center" as const,
    ...theme.components.card,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    width: "100%",
    flexWrap: "nowrap",
  },
  teamBox: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    minWidth: 40,
    maxWidth: 80,
    alignItems: "center",
    flexShrink: 1,
    marginHorizontal: 1,
  },
  teamName: {
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 70,
    overflow: "hidden",
  },
  vsText: {
    color: theme.colors.primary,
    fontWeight: "bold",
    fontSize: 18,
    marginHorizontal: theme.spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.text,
    ...theme.typography.body,
    marginTop: theme.spacing.lg,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  scoreInput: {
    ...theme.components.input,
    minWidth: 40,
    textAlign: "center",
  },
  // Estilos para tabela de classificação
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  tableHeaderText: {
    color: theme.colors.white,
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border || "#e0e0e0",
  },
  tableRowEven: {
    backgroundColor: theme.colors.card,
  },
  tableCell: {
    fontSize: 12,
    textAlign: "center",
    flex: 1,
    color: theme.colors.text,
  },
  // Estilos para histórico
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  clearHistoryBtn: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  clearHistoryBtnText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  historyItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  historyDate: {
    fontSize: 10,
    color: theme.colors.textSecondary || "#666",
    marginBottom: theme.spacing.xs,
  },
  historyMatch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTeam: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.text,
    flex: 1,
  },
  historyScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    minWidth: 50,
  },
  moreResultsText: {
    textAlign: "center",
    color: theme.colors.textSecondary || "#666",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: theme.spacing.sm,
  },
  // Estilos para goleadores
  goalScorersSection: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border || "#e0e0e0",
  },
  goalScorersTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  teamGoalScorers: {
    marginBottom: theme.spacing.sm,
  },
  teamGoalScorersTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  goalScorersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  goalScorerBtn: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.spacing.xs,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  goalScorerBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  goalScorerBtnText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  goalScorerBtnTextActive: {
    color: theme.colors.white,
  },
  selectedGoalScorers: {
    fontSize: 10,
    color: theme.colors.textSecondary || "#666",
    fontStyle: "italic",
    marginTop: theme.spacing.xs,
  },
  historyGoalScorers: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || "#e0e0e0",
  },
  historyGoalScorerText: {
    fontSize: 10,
    color: theme.colors.textSecondary || "#666",
    marginBottom: 2,
  },
});
