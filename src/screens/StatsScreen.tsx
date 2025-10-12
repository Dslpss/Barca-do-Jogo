import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { useData } from "../hooks/useData";

interface StatCard {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  subtitle?: string;
}

interface PlayerStats {
  id: string;
  name: string;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  yellowCards: number;
  redCards: number;
  teamName?: string;
}

interface TeamStats {
  id: string;
  name: string;
  color: string;
  players: number;
  totalGames: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  winRate: number;
}

const StatsScreen = () => {
  const { championships, currentChampionship } = useChampionship();
  const { players, teams, gameResults } = useData();

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "players" | "teams" | "championships"
  >("overview");
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);

  useEffect(() => {
    calculateStats();
  }, [championships, currentChampionship, players, teams, gameResults]);

  const calculateStats = () => {
    calculatePlayerStats();
    calculateTeamStats();
  };

  const calculatePlayerStats = () => {
    if (
      !currentChampionship ||
      !currentChampionship.teams ||
      !currentChampionship.matches
    ) {
      setPlayerStats([]);
      return;
    }

    const stats: PlayerStats[] = [];

    // Iterar sobre todos os times do campeonato atual
    currentChampionship.teams.forEach((team) => {
      if (team.players) {
        team.players.forEach((player) => {
          // Calcular estatísticas baseadas nas partidas
          const playerMatches =
            currentChampionship.matches?.filter(
              (match) =>
                match.played &&
                (match.homeTeam === team.id || match.awayTeam === team.id)
            ) || [];

          let wins = 0;
          let draws = 0;
          let losses = 0;

          playerMatches.forEach((match) => {
            const isHomeTeam = match.homeTeam === team.id;
            const teamScore = isHomeTeam ? match.homeScore : match.awayScore;
            const opponentScore = isHomeTeam
              ? match.awayScore
              : match.homeScore;

            if (teamScore !== undefined && opponentScore !== undefined) {
              if (teamScore > opponentScore) wins++;
              else if (teamScore === opponentScore) draws++;
              else losses++;
            }
          });

          const totalGames = wins + draws + losses;
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

          stats.push({
            id: player.id || "",
            name: player.name,
            totalGames,
            wins,
            draws,
            losses,
            winRate,
            yellowCards: player.yellowCards || 0,
            redCards: player.redCards || 0,
            teamName: team.name,
          });
        });
      }
    });

    setPlayerStats(stats.sort((a, b) => b.winRate - a.winRate));
  };

  const calculateTeamStats = () => {
    if (
      !currentChampionship ||
      !currentChampionship.teams ||
      !currentChampionship.matches
    ) {
      setTeamStats([]);
      return;
    }

    const stats: TeamStats[] = currentChampionship.teams.map((team) => {
      const teamMatches =
        currentChampionship.matches?.filter(
          (match) =>
            match.played &&
            (match.homeTeam === team.id || match.awayTeam === team.id)
        ) || [];

      let wins = 0;
      let draws = 0;
      let losses = 0;

      teamMatches.forEach((match) => {
        const isHomeTeam = match.homeTeam === team.id;
        const teamScore = isHomeTeam ? match.homeScore : match.awayScore;
        const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;

        if (teamScore !== undefined && opponentScore !== undefined) {
          if (teamScore > opponentScore) wins++;
          else if (teamScore === opponentScore) draws++;
          else losses++;
        }
      });

      const totalGames = wins + draws + losses;
      const points = wins * 3 + draws * 1;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      return {
        id: team.id || "",
        name: team.name,
        color: team.color || "#000",
        players: team.players?.length || 0,
        totalGames,
        wins,
        draws,
        losses,
        points,
        winRate,
      };
    });

    setTeamStats(stats.sort((a, b) => b.points - a.points));
  };

  const getOverviewStats = (): StatCard[] => {
    const totalChampionships = championships?.length || 0;
    const activeChampionships =
      championships?.filter((c) => c.status === "em_andamento").length || 0;
    const totalTeams = currentChampionship?.teams?.length || 0;
    const totalPlayers =
      currentChampionship?.teams?.reduce(
        (sum, team) => sum + (team.players?.length || 0),
        0
      ) || 0;
    const totalMatches = currentChampionship?.matches?.length || 0;
    const playedMatches =
      currentChampionship?.matches?.filter((m) => m.played).length || 0;

    return [
      {
        title: "Campeonatos",
        value: totalChampionships,
        icon: "trophy",
        color: "#FFD700",
        subtitle: `${activeChampionships} ativos`,
      },
      {
        title: "Times",
        value: totalTeams,
        icon: "people",
        color: "#4CAF50",
        subtitle: currentChampionship?.name || "Nenhum ativo",
      },
      {
        title: "Jogadores",
        value: totalPlayers,
        icon: "person",
        color: "#2196F3",
        subtitle: `${totalTeams} times`,
      },
      {
        title: "Partidas",
        value: `${playedMatches}/${totalMatches}`,
        icon: "football",
        color: "#FF9800",
        subtitle:
          totalMatches > 0
            ? `${Math.round((playedMatches / totalMatches) * 100)}% completas`
            : "Nenhuma",
      },
    ];
  };

  const renderStatCard = (stat: StatCard, index: number) => (
    <View
      key={index}
      style={[styles.statCard, { borderLeftColor: stat.color }]}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={stat.icon} size={24} color={stat.color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
        {stat.subtitle && (
          <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
        )}
      </View>
    </View>
  );

  const renderPlayerStatsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🏆 Ranking de Jogadores</Text>
      {playerStats.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="person-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            Nenhum dado de jogador disponível
          </Text>
          <Text style={styles.emptySubtext}>
            {!currentChampionship
              ? "Selecione um campeonato para ver as estatísticas"
              : "Adicione jogadores e jogue partidas para ver as estatísticas"}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {playerStats.map((player, index) => (
            <View key={player.id} style={styles.playerStatCard}>
              <View style={styles.playerRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerTeam}>{player.teamName}</Text>
              </View>
              <View style={styles.playerStatsGrid}>
                <View style={styles.playerStatItem}>
                  <Text style={styles.playerStatValue}>
                    {player.totalGames}
                  </Text>
                  <Text style={styles.playerStatLabel}>Jogos</Text>
                </View>
                <View style={styles.playerStatItem}>
                  <Text style={styles.playerStatValue}>{player.wins}</Text>
                  <Text style={styles.playerStatLabel}>Vitórias</Text>
                </View>
                <View style={styles.playerStatItem}>
                  <Text style={[styles.playerStatValue, { color: "#4CAF50" }]}>
                    {player.winRate.toFixed(0)}%
                  </Text>
                  <Text style={styles.playerStatLabel}>Taxa</Text>
                </View>
              </View>
              {(player.yellowCards > 0 || player.redCards > 0) && (
                <View style={styles.cardsContainer}>
                  {player.yellowCards > 0 && (
                    <Text style={styles.cardText}>🟨 {player.yellowCards}</Text>
                  )}
                  {player.redCards > 0 && (
                    <Text style={styles.cardText}>🟥 {player.redCards}</Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderTeamStatsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🎽 Classificação dos Times</Text>
      {teamStats.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="shirt-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Nenhum dado de time disponível</Text>
          <Text style={styles.emptySubtext}>
            {!currentChampionship
              ? "Selecione um campeonato para ver as estatísticas"
              : "Adicione times e jogue partidas para ver as estatísticas"}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {teamStats.map((team, index) => (
            <View key={team.id} style={styles.teamStatCard}>
              <View style={styles.teamRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <View
                style={[
                  styles.teamColorIndicator,
                  { backgroundColor: team.color },
                ]}
              />
              <View style={styles.teamInfo}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamPlayers}>{team.players} jogadores</Text>
              </View>
              <View style={styles.teamStatsGrid}>
                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatValue}>{team.points}</Text>
                  <Text style={styles.teamStatLabel}>Pts</Text>
                </View>
                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatValue}>{team.totalGames}</Text>
                  <Text style={styles.teamStatLabel}>J</Text>
                </View>
                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatValue}>{team.wins}</Text>
                  <Text style={styles.teamStatLabel}>V</Text>
                </View>
                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatValue}>{team.draws}</Text>
                  <Text style={styles.teamStatLabel}>E</Text>
                </View>
                <View style={styles.teamStatItem}>
                  <Text style={styles.teamStatValue}>{team.losses}</Text>
                  <Text style={styles.teamStatLabel}>D</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderChampionshipsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🏟️ Seus Campeonatos</Text>
      {!championships || championships.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="trophy-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Nenhum campeonato criado</Text>
          <Text style={styles.emptySubtext}>
            Crie seu primeiro campeonato para começar a ver estatísticas
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {championships.map((championship) => (
            <View key={championship.id} style={styles.championshipCard}>
              <View style={styles.championshipHeader}>
                <Ionicons
                  name="trophy"
                  size={24}
                  color={
                    championship.status === "em_andamento"
                      ? "#4CAF50"
                      : "#9E9E9E"
                  }
                />
                <View style={styles.championshipInfo}>
                  <Text style={styles.championshipName}>
                    {championship.name}
                  </Text>
                  <Text style={styles.championshipStatus}>
                    {championship.status === "em_andamento"
                      ? "Em andamento"
                      : championship.status === "finalizado"
                      ? "Finalizado"
                      : "Criado"}
                  </Text>
                </View>
              </View>
              <View style={styles.championshipStats}>
                <View style={styles.championshipStatItem}>
                  <Text style={styles.championshipStatValue}>
                    {championship.teams?.length || 0}
                  </Text>
                  <Text style={styles.championshipStatLabel}>Times</Text>
                </View>
                <View style={styles.championshipStatItem}>
                  <Text style={styles.championshipStatValue}>
                    {championship.matches?.length || 0}
                  </Text>
                  <Text style={styles.championshipStatLabel}>Partidas</Text>
                </View>
                <View style={styles.championshipStatItem}>
                  <Text style={styles.championshipStatValue}>
                    {championship.matches?.filter((m) => m.played).length || 0}
                  </Text>
                  <Text style={styles.championshipStatLabel}>Jogadas</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const tabs = [
    { key: "overview", label: "Geral", icon: "stats-chart" },
    { key: "players", label: "Jogadores", icon: "person" },
    { key: "teams", label: "Times", icon: "people" },
    { key: "championships", label: "Campeonatos", icon: "trophy" },
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Estatísticas" icon="stats-chart" theme="light" />

      <View style={styles.content}>
        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={
                  selectedTab === tab.key
                    ? theme.colors.white
                    : theme.colors.primary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {selectedTab === "overview" && (
          <ScrollView
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>📊 Visão Geral</Text>
            <View style={styles.statsGrid}>
              {getOverviewStats().map((stat, index) =>
                renderStatCard(stat, index)
              )}
            </View>

            {currentChampionship && (
              <View style={styles.currentChampionshipSection}>
                <Text style={styles.sectionTitle}>🏆 Campeonato Atual</Text>
                <View style={styles.championshipHighlight}>
                  <Text style={styles.championshipHighlightName}>
                    {currentChampionship.name}
                  </Text>
                  <Text style={styles.championshipHighlightInfo}>
                    {currentChampionship.teams?.length || 0} times •{" "}
                    {currentChampionship.matches?.filter((m) => m.played)
                      .length || 0}
                    /{currentChampionship.matches?.length || 0} partidas
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {selectedTab === "players" && renderPlayerStatsTab()}
        {selectedTab === "teams" && renderTeamStatsTab()}
        {selectedTab === "championships" && renderChampionshipsTab()}
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
    padding: 16,
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
  activeTabText: {
    color: theme.colors.white,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
  },
  statSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  currentChampionshipSection: {
    marginTop: 24,
  },
  championshipHighlight: {
    backgroundColor: theme.colors.primary + "20",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + "40",
  },
  championshipHighlightName: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  championshipHighlightInfo: {
    fontSize: 14,
    color: theme.colors.text,
  },
  playerStatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.white,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  playerTeam: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  playerStatsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  playerStatItem: {
    alignItems: "center",
  },
  playerStatValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  playerStatLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 8,
  },
  cardText: {
    fontSize: 12,
  },
  teamStatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  teamRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  teamColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  teamPlayers: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  teamStatsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  teamStatItem: {
    alignItems: "center",
    minWidth: 24,
  },
  teamStatValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  teamStatLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  championshipCard: {
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  championshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  championshipInfo: {
    flex: 1,
    marginLeft: 12,
  },
  championshipName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  championshipStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  championshipStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  championshipStatItem: {
    alignItems: "center",
  },
  championshipStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  championshipStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default StatsScreen;
