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

const COLORS = {
  primary: "#0A2A45", // azul escuro
  accent: "#D6B36A", // dourado
  background: "#fff",
  card: "#11385A",
  cardLight: "#1C4663",
  text: "#fff",
  textDark: "#0A2A45",
  error: "#e57373",
};

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
    const fetchTimes = async () => {
      const timesSalvos = await AsyncStorage.getItem("teams");
      setTimes(timesSalvos ? JSON.parse(timesSalvos) : []);
    };
    if (isFocused) fetchTimes();
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
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Definir Jogos" icon="calendar" />
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
              <TouchableOpacity style={styles.sortBtn} onPress={sortearJogos}>
                <Text style={styles.sortBtnText}>Sortear jogos</Text>
              </TouchableOpacity>
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
  gradientBg: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  sectionCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 18,
    marginBottom: 28,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.accent,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  champTypeRow: {
    flexDirection: "row",
    gap: 10,
  },
  champTypeBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  champTypeBtnActive: {
    backgroundColor: COLORS.accent,
  },
  champTypeText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  champTypeTextActive: {
    color: COLORS.text,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    marginTop: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    justifyContent: "space-between",
    backgroundColor: COLORS.cardLight,
    borderRadius: 8,
    padding: 10,
    elevation: 1,
  },
  switchLabel: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 15,
  },
  sortBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 18,
    elevation: 2,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sortBtnText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  manualLabel: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 15,
    marginRight: 8,
  },
  teamBtn: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    elevation: 1,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  teamBtnActive: {
    backgroundColor: COLORS.accent,
  },
  teamBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  teamBtnTextActive: {
    color: COLORS.text,
  },
  addGameBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addGameBtnText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  matchCard: {
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignItems: "center",
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minWidth: 0,
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    flexWrap: "nowrap",
  },
  teamBox: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 40,
    maxWidth: 80,
    alignItems: "center",
    flexShrink: 1,
    marginHorizontal: 1,
  },
  teamName: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: "center",
    maxWidth: 70,
    overflow: "hidden",
  },
  vsText: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 18,
    marginHorizontal: 6,
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.text,
    fontSize: 16,
    marginTop: 24,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  scoreInput: {
    borderWidth: 1.2,
    borderColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 15,
    color: COLORS.textDark,
    backgroundColor: COLORS.background,
    minWidth: 40,
    textAlign: "center",
  },
});
