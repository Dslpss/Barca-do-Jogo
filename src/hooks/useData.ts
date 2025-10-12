import { useState, useEffect } from "react";
import {
  dataService,
  Player,
  Team,
  GameResult,
  SavedDistribution,
} from "../services/dataService";
import { useAuth } from "../contexts/AuthContext";
import { useConnectivity } from "./useConnectivity";
import { generateUniqueId } from "../utils/keyGenerator";

export function useData() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  // Obter estado de conectividade a partir do hook compartilhado
  const { isOnline } = useConnectivity();

  // Players
  const [players, setPlayersState] = useState<Player[]>([]);
  const [teams, setTeamsState] = useState<Team[]>([]);
  const [gameResults, setGameResultsState] = useState<GameResult[]>([]);
  const [savedDistributions, setSavedDistributionsState] = useState<
    SavedDistribution[]
  >([]);

  // Load initial data
  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadPlayers(),
        loadTeams(),
        loadGameResults(),
        loadSavedDistributions(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Players methods
  const loadPlayers = async () => {
    try {
      const playersData = await dataService.getPlayers();
      setPlayersState(playersData);
    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
    }
  };

  const savePlayers = async (newPlayers: Player[]) => {
    try {
      setPlayersState(newPlayers);
      await dataService.savePlayers(newPlayers);
    } catch (error) {
      console.error("Erro ao salvar jogadores:", error);
    }
  };

  const addPlayer = async (player: Omit<Player, "id">) => {
    const newPlayer: Player = {
      ...player,
      id: generateUniqueId(),
    };
    const updatedPlayers = [...players, newPlayer];
    await savePlayers(updatedPlayers);
  };

  const updatePlayer = async (
    playerId: string,
    updatedPlayer: Partial<Player>
  ) => {
    const updatedPlayers = players.map((p) =>
      p.id === playerId ? { ...p, ...updatedPlayer } : p
    );
    await savePlayers(updatedPlayers);
  };

  const deletePlayer = async (playerId: string) => {
    // Atualizar o estado local imediatamente para feedback visual
    const updatedPlayers = players.filter((p) => p.id !== playerId);
    setPlayersState(updatedPlayers);

    // Executar a remoção no Firebase em segundo plano
    try {
      await dataService.deletePlayer(playerId);
      // Recarregar os dados do Firebase após a exclusão
      await loadPlayers();
    } catch (error) {
      console.error("Erro ao deletar jogador:", error);
      // Reverter o estado local em caso de erro
      setPlayersState(players);
    }
  };

  // Teams methods
  const loadTeams = async () => {
    try {
      const teamsData = await dataService.getTeams();
      setTeamsState(teamsData);
    } catch (error) {
      console.error("Erro ao carregar times:", error);
    }
  };

  const saveTeams = async (newTeams: Team[]) => {
    try {
      setTeamsState(newTeams);
      await dataService.saveTeams(newTeams);
    } catch (error) {
      console.error("Erro ao salvar times:", error);
    }
  };

  const addTeam = async (team: Omit<Team, "id">) => {
    const newTeam: Team = {
      ...team,
      id: generateUniqueId(),
    };
    const updatedTeams = [...teams, newTeam];
    await saveTeams(updatedTeams);
  };

  const updateTeam = async (teamId: string, updatedTeam: Partial<Team>) => {
    const updatedTeams = teams.map((t) =>
      t.id === teamId ? { ...t, ...updatedTeam } : t
    );
    await saveTeams(updatedTeams);
  };

  const deleteTeam = async (teamId: string) => {
    // Atualizar o estado local imediatamente para feedback visual
    const updatedTeams = teams.filter((t) => t.id !== teamId);
    setTeamsState(updatedTeams);

    // Executar a remoção no Firebase em segundo plano
    try {
      await dataService.deleteTeam(teamId);
      // Recarregar os dados do Firebase após a exclusão
      await loadTeams();
    } catch (error) {
      console.error("Erro ao deletar time:", error);
      // Reverter o estado local em caso de erro
      setTeamsState(teams);
    }
  };

  // Game Results methods
  const loadGameResults = async () => {
    try {
      const resultsData = await dataService.getGameResults();
      setGameResultsState(resultsData);
    } catch (error) {
      console.error("Erro ao carregar resultados:", error);
    }
  };

  const saveGameResults = async (newResults: GameResult[]) => {
    try {
      setGameResultsState(newResults);
      await dataService.saveGameResults(newResults);
    } catch (error) {
      console.error("Erro ao salvar resultados:", error);
    }
  };

  const addGameResult = async (result: Omit<GameResult, "id">) => {
    const newResult: GameResult = {
      ...result,
      id: generateUniqueId(),
    };
    const updatedResults = [...gameResults, newResult];
    await saveGameResults(updatedResults);
  };

  // Saved Distributions methods
  const loadSavedDistributions = async () => {
    try {
      const distributionsData = await dataService.getSavedDistributions();
      setSavedDistributionsState(distributionsData);
    } catch (error) {
      console.error("Erro ao carregar distribuições:", error);
    }
  };

  const saveSavedDistributions = async (
    newDistributions: SavedDistribution[]
  ) => {
    try {
      setSavedDistributionsState(newDistributions);
      await dataService.saveSavedDistributions(newDistributions);
    } catch (error) {
      console.error("Erro ao salvar distribuições:", error);
    }
  };

  const addSavedDistribution = async (
    distribution: Omit<SavedDistribution, "id">
  ) => {
    const newDistribution: SavedDistribution = {
      ...distribution,
      id: generateUniqueId(),
    };
    const updatedDistributions = [...savedDistributions, newDistribution];
    await saveSavedDistributions(updatedDistributions);
  };

  // Sync data manually
  const syncData = async () => {
    setIsLoading(true);
    try {
      await dataService.syncAllData();
      await loadAllData();
    } catch (error) {
      console.error("Erro na sincronização:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar dados
  const exportData = async () => {
    try {
      return await dataService.exportData();
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      throw error;
    }
  };

  // Importar dados
  const importData = async (jsonData: string) => {
    try {
      await dataService.importData(jsonData);
      // Recarregar todos os dados após importar
      await loadAllData();
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      throw error;
    }
  };

  // Limpar todos os dados
  const clearAllData = async () => {
    try {
      await dataService.clearAllData();
      // Limpar estados locais
      setPlayersState([]);
      setTeamsState([]);
      setGameResultsState([]);
      setSavedDistributionsState([]);
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
      throw error;
    }
  };

  return {
    // State
    players,
    teams,
    gameResults,
    savedDistributions,
    isLoading,
    isOnline,

    // Methods
    loadAllData,
    syncData,
    exportData,
    importData,
    clearAllData,

    // Players
    loadPlayers,
    savePlayers,
    addPlayer,
    updatePlayer,
    deletePlayer,

    // Teams
    loadTeams,
    saveTeams,
    addTeam,
    updateTeam,
    deleteTeam,

    // Game Results
    loadGameResults,
    saveGameResults,
    addGameResult,

    // Saved Distributions
    loadSavedDistributions,
    saveSavedDistributions,
    addSavedDistribution,
  };
}
