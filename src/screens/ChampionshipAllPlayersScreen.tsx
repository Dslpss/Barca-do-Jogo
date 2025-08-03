import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { theme } from "../theme/theme";
import { useChampionship } from "../hooks/useChampionship";
import { Player, Team } from "../types/championship";

const ChampionshipAllPlayersScreen = () => {
  const isFocused = useIsFocused();
  const { currentChampionship, loadCurrentChampionship } = useChampionship();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<
    "all" | "name" | "cpf" | "team"
  >("all");
  const [filteredPlayers, setFilteredPlayers] = useState<
    Array<Player & { teamName: string; teamColor: string }>
  >([]);

  useEffect(() => {
    if (isFocused) {
      loadCurrentChampionship();
    }
  }, [isFocused]);

  useEffect(() => {
    if (currentChampionship) {
      filterPlayers();
    }
  }, [currentChampionship, searchTerm, searchFilter]);

  const getAllPlayersWithTeam = () => {
    if (!currentChampionship) return [];

    const allPlayers: Array<Player & { teamName: string; teamColor: string }> =
      [];

    currentChampionship.teams.forEach((team) => {
      team.players.forEach((player) => {
        allPlayers.push({
          ...player,
          teamName: team.name,
          teamColor: team.color,
        });
      });
    });

    return allPlayers.sort((a, b) => a.name.localeCompare(b.name));
  };

  const filterPlayers = () => {
    const allPlayers = getAllPlayersWithTeam();

    if (!searchTerm.trim()) {
      setFilteredPlayers(allPlayers);
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    const filtered = allPlayers.filter((player) => {
      switch (searchFilter) {
        case "name":
          return player.name.toLowerCase().includes(term);
        case "cpf":
          return player.cpf
            ?.replace(/\D/g, "")
            .includes(term.replace(/\D/g, ""));
        case "team":
          return player.teamName.toLowerCase().includes(term);
        case "all":
        default:
          return (
            player.name.toLowerCase().includes(term) ||
            player.cpf?.replace(/\D/g, "").includes(term.replace(/\D/g, "")) ||
            player.teamName.toLowerCase().includes(term)
          );
      }
    });

    setFilteredPlayers(filtered);
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return cpf;
  };

  const getSkillLevel = (skill: number) => {
    const levels = [
      "Iniciante",
      "Básico",
      "Intermediário",
      "Avançado",
      "Profissional",
    ];
    return levels[skill - 1] || "Não definido";
  };

  const renderFilterButton = (
    filter: typeof searchFilter,
    label: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        searchFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSearchFilter(filter)}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={
          searchFilter === filter ? theme.colors.white : theme.colors.primary
        }
      />
      <Text
        style={[
          styles.filterButtonText,
          searchFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPlayerCard = (
    player: Player & { teamName: string; teamColor: string }
  ) => (
    <View key={player.id} style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerPosition}>{player.position}</Text>
        </View>
        <View style={[styles.teamBadge, { backgroundColor: player.teamColor }]}>
          <Text style={styles.teamBadgeText}>{player.teamName}</Text>
        </View>
      </View>

      <View style={styles.playerDetails}>
        <View style={styles.playerDetailRow}>
          <View style={styles.playerDetailItem}>
            <Ionicons name="star" size={16} color={theme.colors.secondary} />
            <Text style={styles.playerDetailText}>
              Nível: {getSkillLevel(player.skill)}
            </Text>
          </View>

          {player.cpf && (
            <View style={styles.playerDetailItem}>
              <Ionicons name="card" size={16} color={theme.colors.primary} />
              <Text style={styles.playerDetailText}>
                CPF: {formatCPF(player.cpf)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.playerDetailRow}>
          <View style={styles.playerDetailItem}>
            <Ionicons name="warning" size={16} color={theme.colors.error} />
            <Text style={styles.playerDetailText}>
              Cartões: {player.yellowCards} 🟨 {player.redCards} 🟥
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (!currentChampionship) {
    return (
      <View style={styles.container}>
        <AppHeader title="Todos os Jogadores" theme="light" />
        <View style={styles.emptyState}>
          <Ionicons
            name="people-outline"
            size={64}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Nenhum campeonato selecionado</Text>
          <Text style={styles.emptySubtext}>
            Selecione um campeonato para ver os jogadores
          </Text>
        </View>
      </View>
    );
  }

  const totalPlayers = getAllPlayersWithTeam().length;

  return (
    <View style={styles.container}>
      <AppHeader title="Todos os Jogadores" theme="light" />

      <View style={styles.content}>
        {/* Estatísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPlayers}</Text>
            <Text style={styles.statLabel}>Total de Jogadores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {currentChampionship.teams.length}
            </Text>
            <Text style={styles.statLabel}>Times</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredPlayers.length}</Text>
            <Text style={styles.statLabel}>Encontrados</Text>
          </View>
        </View>

        {/* Campo de Busca */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {renderFilterButton("all", "Todos", "apps")}
            {renderFilterButton("name", "Nome", "person")}
            {renderFilterButton("cpf", "CPF", "card")}
            {renderFilterButton("team", "Time", "people")}
          </ScrollView>
        </View>

        {/* Lista de Jogadores */}
        {filteredPlayers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="search"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchTerm
                ? "Nenhum jogador encontrado"
                : "Nenhum jogador cadastrado"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchTerm
                ? "Tente buscar por outro termo"
                : "Adicione jogadores aos times para vê-los aqui"}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.playersList}
            contentContainerStyle={styles.playersListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredPlayers.map(renderPlayerCard)}
          </ScrollView>
        )}
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
    padding: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.xs,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    paddingBottom: theme.spacing.lg,
  },
  playerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  playerPosition: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  teamBadge: {
    borderRadius: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  teamBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: "bold",
  },
  playerDetails: {
    gap: theme.spacing.xs,
  },
  playerDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  playerDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
  },
  playerDetailText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
});

export default ChampionshipAllPlayersScreen;
