import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

interface Jogador {
  id: string;
  nome: string;
}

interface Time {
  id: string;
  nome: string;
  cor: string;
  jogadores: Jogador[];
}

interface Resultado {
  timeA: string;
  timeB: string;
  placarA: number;
  placarB: number;
  data: string;
}

interface DistribuicaoSalva {
  id: string;
  nome?: string;
  name?: string;
  data: string; // Maintained for compatibility
  date?: string; // Preferred property
  times: Time[]; // Maintained for compatibility
  teams?: Time[]; // Preferred property
}

interface EstatisticaJogador {
  nome: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  percentualVitorias: number;
}

interface EstatisticaTime {
  nome: string;
  cor: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
  pontos: number;
  percentualVitorias: number;
}

export function HistoryReportsScreen() {
  const isFocused = useIsFocused();
  const keyCounter = useRef(0);

  // Gerador de keys únicas
  const generateUniqueKey = (prefix: string) => {
    keyCounter.current += 1;
    return `${prefix}-${Date.now()}-${keyCounter.current}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  };

  const [distribuicoesSalvas, setDistribuicoesSalvas] = useState<
    DistribuicaoSalva[]
  >([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [estatisticasJogadores, setEstatisticasJogadores] = useState<
    EstatisticaJogador[]
  >([]);
  const [estatisticasTimes, setEstatisticasTimes] = useState<EstatisticaTime[]>(
    []
  );
  const [abaSelecionada, setAbaSelecionada] = useState<
    "sorteios" | "jogadores" | "times" | "exportar"
  >("sorteios");

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const distribuicoes = await AsyncStorage.getItem("savedDistributions");
        const distribuicoesData = distribuicoes
          ? JSON.parse(distribuicoes)
          : [];
        setDistribuicoesSalvas(distribuicoesData);

        const resultadosJSON = await AsyncStorage.getItem("resultados_jogos");
        const resultadosData = resultadosJSON ? JSON.parse(resultadosJSON) : [];
        setResultados(resultadosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    if (isFocused) {
      carregarDados();
    }
  }, [isFocused]);

  useEffect(() => {
    if (resultados && Array.isArray(resultados) && resultados.length > 0) {
      calcularEstatisticas(resultados, distribuicoesSalvas);
    } else {
      setEstatisticasTimes([]);
      setEstatisticasJogadores([]);
    }
  }, [resultados, distribuicoesSalvas]);

  const getTimesFromDistribuicao = (dist: DistribuicaoSalva): Time[] =>
    dist.teams || dist.times || [];
  const getDateFromDistribuicao = (dist: DistribuicaoSalva): string =>
    dist.date || dist.data;

  const findLatestDistributionForGame = (
    distribuicoes: DistribuicaoSalva[],
    nomeTimeA: string,
    nomeTimeB: string
  ): DistribuicaoSalva | undefined => {
    return distribuicoes
      .filter((d) => {
        const times = getTimesFromDistribuicao(d);
        return (
          times.some((t) => t.nome === nomeTimeA) &&
          times.some((t) => t.nome === nomeTimeB)
        );
      })
      .sort(
        (a, b) =>
          new Date(getDateFromDistribuicao(b)).getTime() -
          new Date(getDateFromDistribuicao(a)).getTime()
      )[0];
  };

  const inicializarEstatisticas = (
    distribuicoes: DistribuicaoSalva[],
    resultados: Resultado[]
  ) => {
    const statsJogadores: Record<string, EstatisticaJogador> = {};
    const statsTimes: Record<string, EstatisticaTime> = {};

    if (distribuicoes.length > 0) {
      distribuicoes.forEach((dist) => {
        getTimesFromDistribuicao(dist).forEach((time) => {
          if (time && time.jogadores && Array.isArray(time.jogadores)) {
            time.jogadores.forEach((jogador) => {
              if (jogador && jogador.nome && !statsJogadores[jogador.nome]) {
                statsJogadores[jogador.nome] = {
                  nome: jogador.nome,
                  jogos: 0,
                  vitorias: 0,
                  empates: 0,
                  derrotas: 0,
                  golsPro: 0,
                  golsContra: 0,
                  percentualVitorias: 0,
                };
              }
            });
          }
        });
      });
    } else {
      const timesUnicos = new Set<string>();
      resultados.forEach((r) => {
        if (r.timeA) timesUnicos.add(r.timeA);
        if (r.timeB) timesUnicos.add(r.timeB);
      });
      timesUnicos.forEach((nomeTime) => {
        const nomeJogador = `Time ${nomeTime}`;
        if (!statsJogadores[nomeJogador]) {
          statsJogadores[nomeJogador] = {
            nome: nomeJogador,
            jogos: 0,
            vitorias: 0,
            empates: 0,
            derrotas: 0,
            golsPro: 0,
            golsContra: 0,
            percentualVitorias: 0,
          };
        }
      });
    }

    resultados.forEach((r) => {
      if (r.timeA && !statsTimes[r.timeA]) {
        statsTimes[r.timeA] = {
          nome: r.timeA,
          cor: "",
          jogos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          golsPro: 0,
          golsContra: 0,
          saldoGols: 0,
          pontos: 0,
          percentualVitorias: 0,
        };
      }
      if (r.timeB && !statsTimes[r.timeB]) {
        statsTimes[r.timeB] = {
          nome: r.timeB,
          cor: "",
          jogos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          golsPro: 0,
          golsContra: 0,
          saldoGols: 0,
          pontos: 0,
          percentualVitorias: 0,
        };
      }
    });

    return { statsJogadores, statsTimes };
  };

  const calcularEstatisticas = (
    resultados: Resultado[],
    distribuicoes: DistribuicaoSalva[]
  ) => {
    try {
      const { statsJogadores, statsTimes } = inicializarEstatisticas(
        distribuicoes,
        resultados
      );

      for (const resultado of resultados) {
        if (!resultado || !resultado.timeA || !resultado.timeB) continue;

        const {
          timeA: nomeTimeA,
          timeB: nomeTimeB,
          placarA = 0,
          placarB = 0,
        } = resultado;

        // Atualiza estatísticas dos times
        if (statsTimes[nomeTimeA]) {
          statsTimes[nomeTimeA].jogos++;
          statsTimes[nomeTimeA].golsPro += placarA;
          statsTimes[nomeTimeA].golsContra += placarB;
        }
        if (statsTimes[nomeTimeB]) {
          statsTimes[nomeTimeB].jogos++;
          statsTimes[nomeTimeB].golsPro += placarB;
          statsTimes[nomeTimeB].golsContra += placarA;
        }

        const distribuicaoDoJogo =
          distribuicoes.length > 0
            ? findLatestDistributionForGame(distribuicoes, nomeTimeA, nomeTimeB)
            : undefined;

        const atualizarStatsJogadores = (
          timeData: Time | undefined,
          golsPro: number,
          golsContra: number,
          resultado: "vitoria" | "derrota" | "empate"
        ) => {
          if (
            !timeData ||
            !timeData.jogadores ||
            !Array.isArray(timeData.jogadores)
          )
            return;
          timeData.jogadores.forEach((jogador) => {
            if (jogador && jogador.nome && statsJogadores[jogador.nome]) {
              const stats = statsJogadores[jogador.nome];
              stats.jogos++;
              stats.golsPro += golsPro;
              stats.golsContra += golsContra;
              if (resultado === "vitoria") stats.vitorias++;
              else if (resultado === "derrota") stats.derrotas++;
              else stats.empates++;
            }
          });
        };

        if (distribuicaoDoJogo) {
          const timesDoJogo = getTimesFromDistribuicao(distribuicaoDoJogo);
          const timeAData = timesDoJogo.find((t) => t.nome === nomeTimeA);
          const timeBData = timesDoJogo.find((t) => t.nome === nomeTimeB);

          if (placarA > placarB) {
            atualizarStatsJogadores(timeAData, placarA, placarB, "vitoria");
            atualizarStatsJogadores(timeBData, placarB, placarA, "derrota");
          } else if (placarB > placarA) {
            atualizarStatsJogadores(timeAData, placarA, placarB, "derrota");
            atualizarStatsJogadores(timeBData, placarB, placarA, "vitoria");
          } else {
            atualizarStatsJogadores(timeAData, placarA, placarB, "empate");
            atualizarStatsJogadores(timeBData, placarB, placarA, "empate");
          }
        } else {
          const jogadorTimeA = `Time ${nomeTimeA}`;
          const jogadorTimeB = `Time ${nomeTimeB}`;
          if (statsJogadores[jogadorTimeA])
            statsJogadores[jogadorTimeA].jogos++;
          if (statsJogadores[jogadorTimeB])
            statsJogadores[jogadorTimeB].jogos++;

          if (placarA > placarB) {
            if (statsJogadores[jogadorTimeA])
              statsJogadores[jogadorTimeA].vitorias++;
            if (statsJogadores[jogadorTimeB])
              statsJogadores[jogadorTimeB].derrotas++;
          } else if (placarB > placarA) {
            if (statsJogadores[jogadorTimeA])
              statsJogadores[jogadorTimeA].derrotas++;
            if (statsJogadores[jogadorTimeB])
              statsJogadores[jogadorTimeB].vitorias++;
          } else {
            if (statsJogadores[jogadorTimeA])
              statsJogadores[jogadorTimeA].empates++;
            if (statsJogadores[jogadorTimeB])
              statsJogadores[jogadorTimeB].empates++;
          }
        }

        // Atualiza pontos e resultado dos times
        if (placarA > placarB) {
          if (statsTimes[nomeTimeA]) {
            statsTimes[nomeTimeA].vitorias++;
            statsTimes[nomeTimeA].pontos += 3;
          }
          if (statsTimes[nomeTimeB]) {
            statsTimes[nomeTimeB].derrotas++;
          }
        } else if (placarB > placarA) {
          if (statsTimes[nomeTimeB]) {
            statsTimes[nomeTimeB].vitorias++;
            statsTimes[nomeTimeB].pontos += 3;
          }
          if (statsTimes[nomeTimeA]) {
            statsTimes[nomeTimeA].derrotas++;
          }
        } else {
          if (statsTimes[nomeTimeA]) {
            statsTimes[nomeTimeA].empates++;
            statsTimes[nomeTimeA].pontos += 1;
          }
          if (statsTimes[nomeTimeB]) {
            statsTimes[nomeTimeB].empates++;
            statsTimes[nomeTimeB].pontos += 1;
          }
        }
      }

      // Finaliza cálculos e ordena
      const timesArray = Object.values(statsTimes)
        .map((time) => ({
          ...time,
          saldoGols: time.golsPro - time.golsContra,
          percentualVitorias:
            time.jogos > 0 ? (time.vitorias / time.jogos) * 100 : 0,
        }))
        .sort(
          (a, b) =>
            b.pontos - a.pontos ||
            b.saldoGols - a.saldoGols ||
            b.golsPro - a.golsPro
        );

      const jogadoresArray = Object.values(statsJogadores)
        .map((jogador) => ({
          ...jogador,
          percentualVitorias:
            jogador.jogos > 0 ? (jogador.vitorias / jogador.jogos) * 100 : 0,
        }))
        .sort(
          (a, b) =>
            b.vitorias - a.vitorias ||
            b.percentualVitorias - a.percentualVitorias
        );

      setEstatisticasTimes(timesArray);
      setEstatisticasJogadores(jogadoresArray);
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      setEstatisticasTimes([]);
      setEstatisticasJogadores([]);
    }
  };

  const exportarPDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #2196F3; text-align: center; }
              h2 { color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #2196F3; color: white; }
              tr:nth-child(even) { background-color: #f2f2f2; }
              .section { margin: 30px 0; }
            </style>
          </head>
          <body>
            <h1>Relatório do Campeonato - L.E.L</h1>
            
            <div class="section">
              <h2>Classificação dos Times</h2>
              <table>
                <tr>
                  <th>Posição</th>
                  <th>Time</th>
                  <th>Jogos</th>
                  <th>Vitórias</th>
                  <th>Empates</th>
                  <th>Derrotas</th>
                  <th>Gols Pró</th>
                  <th>Gols Contra</th>
                  <th>Saldo</th>
                  <th>Pontos</th>
                  <th>% Vitórias</th>
                </tr>
                ${(estatisticasTimes || [])
                  .filter((t) => t?.nome)
                  .map(
                    (time: EstatisticaTime, index: number) => `
                  <tr>
                    <td>${index + 1}º</td>
                    <td>${time?.nome || "N/A"}</td>
                    <td>${time?.jogos || 0}</td>
                    <td>${time?.vitorias || 0}</td>
                    <td>${time?.empates || 0}</td>
                    <td>${time?.derrotas || 0}</td>
                    <td>${time?.golsPro || 0}</td>
                    <td>${time?.golsContra || 0}</td>
                    <td>${time?.saldoGols || 0}</td>
                    <td>${time?.pontos || 0}</td>
                    <td>${time?.percentualVitorias?.toFixed(1) || "0.0"}%</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            </div>
            
            <div class="section">
              <h2>Estatísticas dos Jogadores</h2>
              <table>
                <tr>
                  <th>Jogador</th>
                  <th>Jogos</th>
                  <th>Vitórias</th>
                  <th>Empates</th>
                  <th>Derrotas</th>
                  <th>Gols Pró</th>
                  <th>Gols Contra</th>
                  <th>% Vitórias</th>
                </tr>
                ${(estatisticasJogadores || [])
                  .filter((j) => j?.nome)
                  .map(
                    (jogador: EstatisticaJogador) => `
                  <tr>
                    <td>${jogador?.nome || "N/A"}</td>
                    <td>${jogador?.jogos || 0}</td>
                    <td>${jogador?.vitorias || 0}</td>
                    <td>${jogador?.empates || 0}</td>
                    <td>${jogador?.derrotas || 0}</td>
                    <td>${jogador?.golsPro || 0}</td>
                    <td>${jogador?.golsContra || 0}</td>
                    <td>${
                      jogador?.percentualVitorias?.toFixed(1) || "0.0"
                    }%</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            </div>
            
            <div class="section">
              <h2>Histórico de Sorteios</h2>
              <table>
                <tr>
                  <th>Nome</th>
                  <th>Data</th>
                  <th>Número de Times</th>
                </tr>
                ${(distribuicoesSalvas || [])
                  .filter((d) => d?.nome)
                  .map(
                    (dist: DistribuicaoSalva) => `
                  <tr>
                    <td>${dist?.nome || "N/A"}</td>
                    <td>${
                      dist?.data
                        ? new Date(dist.data).toLocaleDateString("pt-BR")
                        : "N/A"
                    }</td>
                    <td>${dist?.times?.length || 0}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            </div>
            
            <p style="text-align: center; margin-top: 50px; color: #666;">
              Relatório gerado em ${new Date().toLocaleDateString(
                "pt-BR"
              )} às ${new Date().toLocaleTimeString("pt-BR")}
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      await shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });

      Alert.alert(
        "PDF Exportado!",
        "Relatório gerado e compartilhado com sucesso!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      Alert.alert("Erro", "Não foi possível exportar o relatório.");
    }
  };

  const renderContent = () => {
    switch (abaSelecionada) {
      case "sorteios":
        return (
          <HistoricoSorteios
            distribuicoes={distribuicoesSalvas}
            styles={styles}
          />
        );
      case "jogadores":
        return (
          <EstatisticasJogadores
            estatisticas={estatisticasJogadores}
            styles={styles}
          />
        );
      case "times":
        return (
          <EstatisticasTimes estatisticas={estatisticasTimes} styles={styles} />
        );
      case "exportar":
        return <Exportacao onExport={exportarPDF} styles={styles} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Histórico & Relatórios"
        theme="light"
        icon="stats-chart"
      />

      <View style={styles.tabContainer}>
        <TabButton
          title="📋 Sorteios"
          active={abaSelecionada === "sorteios"}
          onPress={() => setAbaSelecionada("sorteios")}
          styles={styles}
        />
        <TabButton
          title="👤 Jogadores"
          active={abaSelecionada === "jogadores"}
          onPress={() => setAbaSelecionada("jogadores")}
          styles={styles}
        />
        <TabButton
          title="⚽ Times"
          active={abaSelecionada === "times"}
          onPress={() => setAbaSelecionada("times")}
          styles={styles}
        />
        <TabButton
          title="📊 Exportar"
          active={abaSelecionada === "exportar"}
          onPress={() => setAbaSelecionada("exportar")}
          styles={styles}
        />
      </View>

      <ScrollView style={styles.scrollView}>{renderContent()}</ScrollView>
    </View>
  );
}

interface TabButtonProps extends ComponentProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

const TabButton = ({ title, active, onPress, styles }: TabButtonProps) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.tabActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, active && styles.tabTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

interface StylesProps {
  container: ViewStyle;
  tabContainer: ViewStyle;
  tab: ViewStyle;
  tabActive: ViewStyle;
  tabText: TextStyle;
  tabTextActive: TextStyle;
  scrollView: ViewStyle;
  tabContent: ViewStyle;
  sectionTitle: TextStyle;
  emptyText: TextStyle;
  historyItem: ViewStyle;
  historyTitle: TextStyle;
  historyDate: TextStyle;
  historyDetails: TextStyle;
  tableHeader: ViewStyle;
  tableHeaderText: TextStyle;
  tableRow: ViewStyle;
  tableRowEven: ViewStyle;
  tableCell: TextStyle;
  exportDescription: TextStyle;
  exportButton: ViewStyle;
  exportButtonText: TextStyle;
  exportInfo: ViewStyle;
  exportInfoTitle: TextStyle;
  exportInfoItem: TextStyle;
}

interface ComponentProps {
  styles: StylesProps;
}

interface HistoricoSorteiosProps extends ComponentProps {
  distribuicoes: DistribuicaoSalva[];
}

interface EstatisticasJogadoresProps extends ComponentProps {
  estatisticas: EstatisticaJogador[];
}

interface EstatisticasTimesProps extends ComponentProps {
  estatisticas: EstatisticaTime[];
}

interface ExportacaoProps extends ComponentProps {
  onExport: () => Promise<void>;
}

const HistoricoSorteios = ({
  distribuicoes,
  styles,
}: HistoricoSorteiosProps) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Histórico de Sorteios Realizados</Text>
    {distribuicoes.length === 0 ? (
      <Text style={styles.emptyText}>Nenhum sorteio salvo encontrado.</Text>
    ) : (
      distribuicoes.map((distribuicao: DistribuicaoSalva, index: number) => {
        const times = distribuicao.teams || distribuicao.times || [];
        const totalJogadores = Array.isArray(times)
          ? times.reduce((total: number, time: Time) => {
              return (
                total +
                (time?.jogadores && Array.isArray(time.jogadores)
                  ? time.jogadores.length
                  : 0)
              );
            }, 0)
          : 0;

        const dataDistribuicao = distribuicao.date || distribuicao.data;
        const dataValida =
          dataDistribuicao && !isNaN(new Date(dataDistribuicao).getTime());

        return (
          <View
            key={`distribuicao-${index}-${
              distribuicao.id || "no-id"
            }-${Math.random().toString(36).substr(2, 9)}`}
            style={styles.historyItem}
          >
            <Text style={styles.historyTitle}>
              {(distribuicao.nome || distribuicao.name || "").trim() ||
                "Sorteio sem nome"}
            </Text>
            <Text style={styles.historyDate}>
              {dataValida
                ? `${new Date(dataDistribuicao).toLocaleDateString(
                    "pt-BR"
                  )} às ${new Date(dataDistribuicao).toLocaleTimeString(
                    "pt-BR"
                  )}`
                : "Data não disponível"}
            </Text>
            <Text style={styles.historyDetails}>
              {times?.length || 0} teams • {totalJogadores || 0} jogadores
            </Text>
          </View>
        );
      })
    )}
  </View>
);

const EstatisticasJogadores = ({
  estatisticas,
  styles,
}: EstatisticasJogadoresProps) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Estatísticas dos Jogadores</Text>
    {estatisticas.length === 0 ? (
      <Text style={styles.emptyText}>Nenhuma estatística disponível.</Text>
    ) : (
      <View>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Jogador</Text>
          <Text style={styles.tableHeaderText}>Jogos</Text>
          <Text style={styles.tableHeaderText}>V</Text>
          <Text style={styles.tableHeaderText}>E</Text>
          <Text style={styles.tableHeaderText}>D</Text>
          <Text style={styles.tableHeaderText}>%V</Text>
        </View>
        {estatisticas.map((jogador: EstatisticaJogador, index: number) => (
          <View
            key={`jogador-${index}-${jogador.nome}-${Math.random()
              .toString(36)
              .substr(2, 9)}`}
            style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
          >
            <Text style={[styles.tableCell, { flex: 2 }]}>{jogador.nome}</Text>
            <Text style={styles.tableCell}>{jogador.jogos}</Text>
            <Text style={styles.tableCell}>{jogador.vitorias}</Text>
            <Text style={styles.tableCell}>{jogador.empates}</Text>
            <Text style={styles.tableCell}>{jogador.derrotas}</Text>
            <Text style={styles.tableCell}>
              {jogador?.percentualVitorias?.toFixed(1) || "0.0"}%
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const EstatisticasTimes = ({
  estatisticas,
  styles,
}: EstatisticasTimesProps) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Relatórios de Desempenho por Time</Text>
    {estatisticas.length === 0 ? (
      <Text style={styles.emptyText}>Nenhuma estatística disponível.</Text>
    ) : (
      <View>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Pos</Text>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Time</Text>
          <Text style={styles.tableHeaderText}>J</Text>
          <Text style={styles.tableHeaderText}>V</Text>
          <Text style={styles.tableHeaderText}>E</Text>
          <Text style={styles.tableHeaderText}>D</Text>
          <Text style={styles.tableHeaderText}>GP</Text>
          <Text style={styles.tableHeaderText}>GC</Text>
          <Text style={styles.tableHeaderText}>SG</Text>
          <Text style={styles.tableHeaderText}>Pts</Text>
        </View>
        {estatisticas.map((time: EstatisticaTime, index: number) => (
          <View
            key={`time-${index}-${time.nome}-${Math.random()
              .toString(36)
              .substr(2, 9)}`}
            style={[styles.tableRow, index % 2 === 0 && styles.tableRowEven]}
          >
            <Text style={styles.tableCell}>{index + 1}º</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>{time.nome}</Text>
            <Text style={styles.tableCell}>{time.jogos}</Text>
            <Text style={styles.tableCell}>{time.vitorias}</Text>
            <Text style={styles.tableCell}>{time.empates}</Text>
            <Text style={styles.tableCell}>{time.derrotas}</Text>
            <Text style={styles.tableCell}>{time.golsPro}</Text>
            <Text style={styles.tableCell}>{time.golsContra}</Text>
            <Text style={styles.tableCell}>{time.saldoGols}</Text>
            <Text style={styles.tableCell}>{time.pontos}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const Exportacao = ({ onExport, styles }: ExportacaoProps) => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Exportação de Dados</Text>
    <Text style={styles.exportDescription}>
      Exporte um relatório completo com todas as estatísticas, classificações e
      histórico do campeonato em formato PDF.
    </Text>

    <TouchableOpacity style={styles.exportButton} onPress={onExport}>
      <Text style={styles.exportButtonText}>📄 Exportar Relatório PDF</Text>
    </TouchableOpacity>

    <View style={styles.exportInfo}>
      <Text style={styles.exportInfoTitle}>O relatório incluirá:</Text>
      <Text style={styles.exportInfoItem}>
        • Classificação completa dos times
      </Text>
      <Text style={styles.exportInfoItem}>
        • Estatísticas detalhadas dos jogadores
      </Text>
      <Text style={styles.exportInfoItem}>
        • Histórico de sorteios realizados
      </Text>
      <Text style={styles.exportInfoItem}>• Data e hora de geração</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme?.colors?.background || "#FFFFFF",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: theme?.colors?.card || "#F5F5F5",
    paddingHorizontal: theme?.spacing?.sm || 8,
    paddingTop: theme?.spacing?.sm || 8,
  },
  tab: {
    flex: 1,
    paddingVertical: theme?.spacing?.sm || 8,
    paddingHorizontal: theme?.spacing?.xs || 4,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: theme?.colors?.primary || "#2196F3",
  },
  tabText: {
    fontSize: 12,
    color: theme?.colors?.textSecondary || "#666",
    fontWeight: "500",
  },
  tabTextActive: {
    color: theme?.colors?.primary || "#2196F3",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: theme?.spacing?.md || 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme?.colors?.text || "#000",
    marginBottom: theme?.spacing?.md || 16,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    color: theme?.colors?.textSecondary || "#666",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: theme?.spacing?.lg || 24,
  },
  historyItem: {
    backgroundColor: theme?.colors?.card || "#F5F5F5",
    padding: theme?.spacing?.md || 16,
    marginBottom: theme?.spacing?.sm || 8,
    borderRadius: theme?.spacing?.xs || 4,
    borderLeftWidth: 4,
    borderLeftColor: theme?.colors?.primary || "#2196F3",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme?.colors?.text || "#000",
    marginBottom: theme?.spacing?.xs || 4,
  },
  historyDate: {
    fontSize: 12,
    color: theme?.colors?.textSecondary || "#666",
    marginBottom: theme?.spacing?.xs || 4,
  },
  historyDetails: {
    fontSize: 14,
    color: theme?.colors?.text || "#000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme?.colors?.primary || "#2196F3",
    paddingVertical: theme?.spacing?.sm || 8,
    paddingHorizontal: theme?.spacing?.xs || 4,
    borderRadius: theme?.spacing?.xs || 4,
    marginBottom: theme?.spacing?.xs || 4,
  },
  tableHeaderText: {
    color: theme?.colors?.white || "#FFFFFF",
    fontWeight: "bold",
    fontSize: 11,
    textAlign: "center",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: theme?.spacing?.xs || 4,
    paddingHorizontal: theme?.spacing?.xs || 4,
    borderBottomWidth: 1,
    borderBottomColor: theme?.colors?.border || "#e0e0e0",
  },
  tableRowEven: {
    backgroundColor: theme?.colors?.card || "#F5F5F5",
  },
  tableCell: {
    fontSize: 11,
    textAlign: "center",
    flex: 1,
    color: theme?.colors?.text || "#000",
  },
  exportDescription: {
    fontSize: 14,
    color: theme?.colors?.text || "#000",
    textAlign: "center",
    marginBottom: theme?.spacing?.lg || 24,
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: theme?.colors?.primary || "#2196F3",
    paddingVertical: theme?.spacing?.md || 16,
    paddingHorizontal: theme?.spacing?.lg || 24,
    borderRadius: theme?.spacing?.sm || 8,
    alignItems: "center",
    marginBottom: theme?.spacing?.lg || 24,
  },
  exportButtonText: {
    color: theme?.colors?.white || "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  exportInfo: {
    backgroundColor: theme?.colors?.card || "#F5F5F5",
    padding: theme?.spacing?.md || 16,
    borderRadius: theme?.spacing?.xs || 4,
    borderWidth: 1,
    borderColor: theme?.colors?.border || "#e0e0e0",
  },
  exportInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme?.colors?.text || "#000",
    marginBottom: theme?.spacing?.sm || 8,
  },
  exportInfoItem: {
    fontSize: 13,
    color: theme?.colors?.text || "#000",
    marginBottom: theme?.spacing?.xs || 4,
    paddingLeft: theme?.spacing?.sm || 8,
  },
});
