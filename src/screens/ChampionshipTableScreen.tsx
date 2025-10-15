import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { Team, Group } from "../types/championship";
import { ChampionshipService } from "../services/championshipService";

interface TableRow {
  position: number;
  team: Team;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const ChampionshipTableScreen = () => {
  const isFocused = useIsFocused();
  const { currentChampionship, calculateStats, loadCurrentChampionship } =
    useChampionship();

  useEffect(() => {
    if (isFocused) {
      console.log("🔄 TABLE: Tela focada, recarregando campeonato...");
      loadCurrentChampionship();
    }
  }, [isFocused]);

  if (!currentChampionship) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Tabela de Classificação"
          icon="trophy"
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

  console.log("📊 TABLE: Calculando estatísticas...");
  const stats = calculateStats();
  const playedMatches =
    currentChampionship?.matches?.filter((m) => m.played).length || 0;

  console.log("🎮 TABLE: Campeonato atual:", {
    name: currentChampionship.name,
    totalMatches: currentChampionship?.matches?.length || 0,
    playedMatches: playedMatches,
    teams: currentChampionship?.teams?.length || 0,
  });

  console.log("📋 TABLE: Estatísticas recebidas:", stats);

  // Criar tabela de classificação
  const tableData: TableRow[] = (currentChampionship?.teams || [])
    .map((team, index) => {
      const teamStats = stats.teamStats[team.id] || {
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };

      return {
        position: 0, // Will be set after sorting
        team,
        ...teamStats,
      };
    })
    .sort((a, b) => {
      // Ordenar por pontos, depois saldo de gols, depois gols pró
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    })
    .map((row, index) => ({
      ...row,
      position: index + 1,
    }));

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, styles.positionColumn]}>Pos</Text>
      <Text style={[styles.tableHeaderCell, styles.teamColumn]}>Time</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>Pts</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>J</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>V</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>E</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>D</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>GP</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>GC</Text>
      <Text style={[styles.tableHeaderCell, styles.numberColumn]}>SG</Text>
    </View>
  );

  const renderTableRow = ({
    item,
    index,
  }: {
    item: TableRow;
    index: number;
  }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
      <Text
        style={[styles.tableCell, styles.positionColumn, styles.positionText]}
      >
        {item.position}
      </Text>
      <View style={[styles.teamColumn, styles.teamInfo]}>
        {item.team.logo && (
          <Image source={{ uri: item.team.logo }} style={styles.teamLogo} />
        )}
        <Text style={styles.teamName} numberOfLines={1}>
          {item.team.name}
        </Text>
        {item.team.color && (
          <View
            style={[
              styles.teamColorIndicator,
              { backgroundColor: item.team.color },
            ]}
          />
        )}
      </View>
      <Text style={[styles.tableCell, styles.numberColumn, styles.pointsText]}>
        {item.points}
      </Text>
      <Text style={[styles.tableCell, styles.numberColumn]}>
        {item.matches}
      </Text>
      <Text style={[styles.tableCell, styles.numberColumn]}>{item.wins}</Text>
      <Text style={[styles.tableCell, styles.numberColumn]}>{item.draws}</Text>
      <Text style={[styles.tableCell, styles.numberColumn]}>{item.losses}</Text>
      <Text style={[styles.tableCell, styles.numberColumn]}>
        {item.goalsFor}
      </Text>
      <Text style={[styles.tableCell, styles.numberColumn]}>
        {item.goalsAgainst}
      </Text>
      <Text
        style={[
          styles.tableCell,
          styles.numberColumn,
          item.goalDifference > 0
            ? styles.positiveNumber
            : item.goalDifference < 0
            ? styles.negativeNumber
            : styles.neutralNumber,
        ]}
      >
        {item.goalDifference > 0 ? "+" : ""}
        {item.goalDifference}
      </Text>
    </View>
  );

  const renderGroupTable = (group: Group) => {
    const groupStandings = ChampionshipService.getGroupStandings(
      currentChampionship!
    );
    const groupData = groupStandings[group.id];

    if (!groupData) return null;

    // Criar dados da tabela do grupo
    const groupTableData: TableRow[] = groupData.standings
      .map((standing, index) => {
        const team = currentChampionship!.teams.find(
          (t) => t.id === standing.teamId
        );
        if (!team) return null;

        return {
          position: index + 1,
          team,
          matches: standing.matches,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          goalsFor: standing.goalsFor,
          goalsAgainst: standing.goalsAgainst,
          goalDifference: standing.goalDifference,
          points: standing.points,
        };
      })
      .filter(Boolean) as TableRow[];

    // Detectar se houve desempate aplicado (ordem diferente do ordenamento apenas por pontos)
    let tiebreakApplied = false;
    if (groupTableData.length > 1) {
      const byPoints = [...groupTableData].sort((a, b) => b.points - a.points);
      // Se houver ao menos dois com os mesmos pontos e a ordem final difere da ordem por pontos, então houve desempate
      for (let i = 0; i < groupTableData.length - 1; i++) {
        const a = groupTableData[i];
        const b = groupTableData[i + 1];
        if (a.points === b.points) {
          // Comparar sequência completa
          const idsFinal = groupTableData.map((r) => r.team.id).join("|");
          const idsPoints = byPoints.map((r) => r.team.id).join("|");
          if (idsFinal !== idsPoints) {
            tiebreakApplied = true;
            break;
          }
        }
      }
    }

    // Determinar times impactados por desempate (por blocos de pontos)
    const impactedByTiebreak = new Set<string>();
    if (tiebreakApplied) {
      const byPointsMap = new Map<number, string[]>();
      groupTableData.forEach((r) => {
        const list = byPointsMap.get(r.points) || [];
        list.push(r.team.id);
        byPointsMap.set(r.points, list);
      });
      const finalOrder = groupTableData.map((r) => r.team.id);
      byPointsMap.forEach((ids, pts) => {
        if (ids.length > 1) {
          // Ordem por pontos dentro do bloco (mantém ordem de aparição)
          const blockFinal = finalOrder.filter((id) => ids.includes(id));
          const blockPoints = ids; // baseline
          if (blockFinal.join("|") !== blockPoints.join("|")) {
            blockFinal.forEach((id) => impactedByTiebreak.add(id));
          }
        }
      });
    }

    return (
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        <FlatList
          data={groupTableData}
          keyExtractor={(item) => item.team.id}
          renderItem={({ item, index }) => (
            <View style={[styles.tableRow, index % 2 === 0 && styles.evenRow]}>
              <Text
                style={[
                  styles.tableCell,
                  styles.positionColumn,
                  styles.positionText,
                ]}
              >
                {item.position}
              </Text>
              <View style={[styles.teamColumn, styles.teamInfo]}>
                {item.team.logo && (
                  <Image
                    source={{ uri: item.team.logo }}
                    style={styles.teamLogo}
                  />
                )}
                <Text style={styles.teamName} numberOfLines={1}>
                  {item.team.name}
                </Text>
                {impactedByTiebreak.has(item.team.id) && (
                  <Text
                    style={styles.tiebreakBadge}
                    accessibilityLabel="Desempate aplicado"
                  >
                    {" "}
                    ⚖️
                  </Text>
                )}
                {item.team.color && (
                  <View
                    style={[
                      styles.teamColorIndicator,
                      { backgroundColor: item.team.color },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.tableCell,
                  styles.numberColumn,
                  styles.pointsText,
                ]}
              >
                {item.points}
              </Text>
              <Text style={[styles.tableCell, styles.numberColumn]}>
                {item.matches}
              </Text>
              <Text style={[styles.tableCell, styles.numberColumn]}>
                {item.wins}
              </Text>
              <Text style={[styles.tableCell, styles.numberColumn]}>
                {item.draws}
              </Text>
              <Text style={[styles.tableCell, styles.numberColumn]}>
                {item.losses}
              </Text>
              <Text style={[styles.tableCell, styles.numberColumn]}>
                {item.goalsFor}
              </Text>
              <Text style={[styles.tableCell, styles.numberColumn]}>
                {item.goalsAgainst}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.numberColumn,
                  item.goalDifference > 0
                    ? styles.positiveNumber
                    : item.goalDifference < 0
                    ? styles.negativeNumber
                    : styles.neutralNumber,
                ]}
              >
                {item.goalDifference > 0 ? "+" : ""}
                {item.goalDifference}
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />
        {tiebreakApplied && (
          <View style={styles.tiebreakNote}>
            <Text style={styles.tiebreakNoteText}>
              ℹ️ Empates em pontos foram definidos pelos critérios de desempate.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderTopScorers = () => {
    const playerGoals: {
      playerId: string;
      playerName: string;
      teamName: string;
      goals: number;
    }[] = [];

    (currentChampionship?.teams || []).forEach((team) => {
      (team.players || []).forEach((player) => {
        const playerStats = stats.playerStats[player.id];
        if (playerStats && playerStats.goals > 0) {
          playerGoals.push({
            playerId: player.id,
            playerName: player.name,
            teamName: team.name,
            goals: playerStats.goals,
          });
        }
      });
    });

    playerGoals.sort((a, b) => b.goals - a.goals);
    const topScorers = playerGoals.slice(0, 5);

    if (topScorers.length === 0) return null;

    return (
      <View style={styles.topScorersSection}>
        <Text style={styles.sectionTitle}>🥇 Artilheiros</Text>
        {topScorers.map((scorer, index) => (
          <View key={scorer.playerId} style={styles.scorerRow}>
            <Text style={styles.scorerPosition}>{index + 1}º</Text>
            <View style={styles.scorerInfo}>
              <Text style={styles.scorerName}>{scorer.playerName}</Text>
              <Text style={styles.scorerTeam}>{scorer.teamName}</Text>
            </View>
            <Text style={styles.scorerGoals}>
              {scorer.goals} gol{scorer.goals !== 1 ? "s" : ""}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Tabela de Classificação" icon="trophy" theme="light" />

      <ScrollView style={styles.content}>
        <View style={styles.championshipInfo}>
          <Text style={styles.championshipName}>
            {currentChampionship.name}
          </Text>
          {currentChampionship.status === "finalizado" &&
          currentChampionship.champion ? (
            <Text style={styles.championInfo}>
              🏆 Campeão:{" "}
              {currentChampionship.teams.find(
                (team) => team.id === currentChampionship.champion
              )?.name || "Time não encontrado"}
            </Text>
          ) : (
            <Text style={styles.matchesInfo}>
              {playedMatches} de {currentChampionship?.matches?.length || 0}{" "}
              partidas realizadas
            </Text>
          )}
        </View>

        {(currentChampionship?.teams || []).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum time cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Adicione times para ver a classificação
            </Text>
          </View>
        ) : playedMatches === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma partida realizada</Text>
            <Text style={styles.emptySubtext}>
              Registre os resultados das partidas para ver a classificação
            </Text>
          </View>
        ) : currentChampionship.type === "grupos" &&
          currentChampionship.groups &&
          currentChampionship.groups.length > 0 ? (
          <>
            {/* Classificação por Grupos */}
            {currentChampionship.groups.map((group) => (
              <View key={group.id} style={styles.groupSection}>
                <Text style={styles.groupTitle}>🏟️ {group.name}</Text>
                {renderGroupTable(group)}
              </View>
            ))}

            {/* Classificação Geral (se necessário) */}
            {currentChampionship.currentPhase === "mata_mata" && (
              <View style={styles.tableSection}>
                <Text style={styles.sectionTitle}>🏆 Classificação Geral</Text>
                <View style={styles.tableContainer}>
                  {renderTableHeader()}
                  <FlatList
                    data={tableData}
                    renderItem={renderTableRow}
                    keyExtractor={(item) => item.team.id}
                    scrollEnabled={false}
                  />
                </View>
              </View>
            )}

            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Legenda:</Text>
              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>Pts = Pontos</Text>
                <Text style={styles.legendItem}>J = Jogos</Text>
                <Text style={styles.legendItem}>V = Vitórias</Text>
              </View>
              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>E = Empates</Text>
                <Text style={styles.legendItem}>D = Derrotas</Text>
                <Text style={styles.legendItem}>GP = Gols Pró</Text>
              </View>
              <View style={styles.legendRow}>
                <Text style={styles.legendItem}>GC = Gols Contra</Text>
                <Text style={styles.legendItem}>SG = Saldo de Gols</Text>
              </View>
            </View>

            <View style={styles.tiebreakContainer}>
              <Text style={styles.tiebreakTitle}>Critérios de desempate</Text>
              <Text style={styles.tiebreakItem}>1) Pontos</Text>
              <Text style={styles.tiebreakItem}>2) Vitórias</Text>
              <Text style={styles.tiebreakItem}>3) Saldo de Gols</Text>
              <Text style={styles.tiebreakItem}>4) Gols Pró</Text>
              <Text style={styles.tiebreakItem}>5) Menos Gols Sofridos</Text>
              <Text style={styles.tiebreakItem}>6) Menos Derrotas</Text>
              <Text style={styles.tiebreakItem}>
                7) Menos Cartões Vermelhos
              </Text>
              <Text style={styles.tiebreakItem}>8) Menos Cartões Amarelos</Text>
              <Text style={styles.tiebreakItem}>9) Sorteio</Text>
            </View>

            {renderTopScorers()}
          </>
        ) : (
          <>
            <View style={styles.tableSection}>
              <Text style={styles.sectionTitle}>📊 Classificação</Text>
              <View style={styles.tableContainer}>
                {renderTableHeader()}
                <FlatList
                  data={tableData}
                  renderItem={renderTableRow}
                  keyExtractor={(item) => item.team.id}
                  scrollEnabled={false}
                />
              </View>

              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>Legenda:</Text>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>Pts = Pontos</Text>
                  <Text style={styles.legendItem}>J = Jogos</Text>
                  <Text style={styles.legendItem}>V = Vitórias</Text>
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>E = Empates</Text>
                  <Text style={styles.legendItem}>D = Derrotas</Text>
                  <Text style={styles.legendItem}>GP = Gols Pró</Text>
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendItem}>GC = Gols Contra</Text>
                  <Text style={styles.legendItem}>SG = Saldo de Gols</Text>
                </View>
              </View>
            </View>

            {renderTopScorers()}
          </>
        )}
      </ScrollView>
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
  matchesInfo: {
    ...theme.typography.body,
    color: theme.colors.white,
    opacity: 0.9,
  },
  championInfo: {
    ...theme.typography.h3,
    color: theme.colors.white,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
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
  },
  tableSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  groupSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    overflow: "hidden",
  },
  groupTitle: {
    ...theme.typography.h3,
    color: theme.colors.primary,
    padding: theme.spacing.md,
    backgroundColor: "white",
    fontWeight: "bold",
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  tableContainer: {
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  tableHeaderCell: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  evenRow: {
    backgroundColor: theme.colors.background,
  },
  tableCell: {
    ...theme.typography.caption,
    color: theme.colors.text,
    textAlign: "center",
    fontSize: 11,
  },
  positionColumn: {
    width: 30,
  },
  teamColumn: {
    flex: 1,
    minWidth: 80,
  },
  numberColumn: {
    width: 25,
  },
  positionText: {
    fontWeight: "bold",
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: theme.spacing.xs,
  },
  teamLogo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teamName: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "bold",
    flex: 1,
    fontSize: 11,
  },
  teamColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pointsText: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  positiveNumber: {
    color: theme.colors.success,
  },
  negativeNumber: {
    color: theme.colors.error,
  },
  neutralNumber: {
    color: theme.colors.textSecondary,
  },
  legendContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  legendTitle: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  legendItem: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 10,
    flex: 1,
  },
  tiebreakContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tiebreakTitle: {
    ...theme.typography.caption,
    color: theme.colors.text,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  tiebreakItem: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  tiebreakNote: {
    marginTop: theme.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.xs,
  },
  tiebreakNoteText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  tiebreakBadge: {
    marginLeft: 4,
    fontSize: 12,
  },
  topScorersSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  scorerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  scorerPosition: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "bold",
    width: 25,
  },
  scorerInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  scorerName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  scorerTeam: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  scorerGoals: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
});

export default ChampionshipTableScreen;
