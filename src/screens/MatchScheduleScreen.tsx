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
  const [placaresJogos, setPlacaresJogos] = useState<
    { placarA: string; placarB: string }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const timesSalvos = await AsyncStorage.getItem("teams");
      setTimes(timesSalvos ? JSON.parse(timesSalvos) : []);
      const jogosSalvos = await AsyncStorage.getItem("jogos_sorteados");
      setJogos(jogosSalvos ? JSON.parse(jogosSalvos) : []);
    };
    if (isFocused) fetchData();
  }, [isFocused]);

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
        grupoA.forEach((a) =>
          grupoB.forEach((b) =>
            jogosGerados.push({ timeA: a.name, timeB: b.name })
          )
        );
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
      setPlacaresJogos([...placaresJogos, { placarA: "", placarB: "" }]);
      setTimeSelecionadoA("");
      setTimeSelecionadoB("");
    }
  };

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
                          novos[index] = { ...novos[index], placarB: txt };
                          setPlacaresJogos(novos);
                        }}
                        placeholder="Placar B"
                        placeholderTextColor="#185a9d"
                      />
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhum jogo definido.</Text>
                }
              />
            </View>
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
});
