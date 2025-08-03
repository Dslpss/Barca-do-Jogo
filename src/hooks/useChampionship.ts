import { useState, useEffect } from "react";
import {
  Championship,
  Team,
  Player,
  Match,
  ChampionshipStats,
  GoalScorer,
} from "../types/championship";
import { ChampionshipService } from "../services/championshipService";

export const useChampionship = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [currentChampionship, setCurrentChampionship] =
    useState<Championship | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os campeonatos
  const loadChampionships = async () => {
    setLoading(true);
    try {
      const data = await ChampionshipService.getAllChampionships();
      setChampionships(data);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar campeonatos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar campeonato atual
  const loadCurrentChampionship = async () => {
    setLoading(true);
    try {
      const current = await ChampionshipService.getCurrentChampionship();
      setCurrentChampionship(current);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar campeonato atual");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo campeonato
  const createChampionship = async (
    name: string,
    type: "pontos_corridos" | "mata_mata" | "grupos"
  ) => {
    setLoading(true);
    try {
      const newChampionship = await ChampionshipService.createChampionship(
        name,
        type
      );
      await loadChampionships();
      setError(null);
      return newChampionship;
    } catch (err) {
      setError("Erro ao criar campeonato");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Selecionar campeonato atual
  const selectChampionship = async (championshipId: string) => {
    setLoading(true);
    try {
      await ChampionshipService.setCurrentChampionship(championshipId);
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao selecionar campeonato");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar time
  const addTeam = async (team: Omit<Team, "id">) => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      const newTeam: Team = {
        ...team,
        id: Date.now().toString(),
      };
      await ChampionshipService.addTeamToChampionship(
        currentChampionship.id,
        newTeam
      );
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao adicionar time");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remover time
  const removeTeam = async (teamId: string) => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.removeTeamFromChampionship(
        currentChampionship.id,
        teamId
      );
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao remover time");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar jogador a um time
  const addPlayerToTeam = async (
    teamId: string,
    player: Omit<Player, "id">
  ) => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      const newPlayer: Player = {
        ...player,
        id: Date.now().toString(),
      };
      await ChampionshipService.addPlayerToTeam(
        currentChampionship.id,
        teamId,
        newPlayer
      );
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao adicionar jogador");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remover jogador de um time
  const removePlayerFromTeam = async (teamId: string, playerId: string) => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.removePlayerFromTeam(
        currentChampionship.id,
        teamId,
        playerId
      );
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao remover jogador");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Gerar jogos
  const generateMatches = async () => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.generateMatches(currentChampionship.id);
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao gerar jogos");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registrar resultado
  const recordMatchResult = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeGoalScorers: GoalScorer[] = [],
    awayGoalScorers: GoalScorer[] = []
  ) => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.recordMatchResult(
        currentChampionship.id,
        matchId,
        homeScore,
        awayScore,
        homeGoalScorers,
        awayGoalScorers
      );
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro ao registrar resultado");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calculateStats = (): ChampionshipStats => {
    if (!currentChampionship) {
      return { teamStats: {}, playerStats: {} };
    }

    const teamStats: { [teamId: string]: any } = {};
    const playerStats: { [playerId: string]: any } = {};

    // Inicializar estatísticas dos times
    currentChampionship.teams.forEach((team) => {
      teamStats[team.id] = {
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };

      // Inicializar estatísticas dos jogadores
      team.players.forEach((player) => {
        playerStats[player.id] = {
          matches: 0,
          goals: 0,
          yellowCards: player.yellowCards || 0,
          redCards: player.redCards || 0,
        };
      });
    });

    // Processar partidas jogadas
    currentChampionship.matches.forEach((match) => {
      if (
        !match.played ||
        match.homeScore === undefined ||
        match.awayScore === undefined
      )
        return;

      const homeStats = teamStats[match.homeTeam];
      const awayStats = teamStats[match.awayTeam];

      // Atualizar estatísticas dos times
      homeStats.matches++;
      awayStats.matches++;
      homeStats.goalsFor += match.homeScore;
      homeStats.goalsAgainst += match.awayScore;
      awayStats.goalsFor += match.awayScore;
      awayStats.goalsAgainst += match.homeScore;

      // Determinar resultado
      if (match.homeScore > match.awayScore) {
        homeStats.wins++;
        homeStats.points +=
          currentChampionship.type === "pontos_corridos" ? 3 : 1;
        awayStats.losses++;
      } else if (match.awayScore > match.homeScore) {
        awayStats.wins++;
        awayStats.points +=
          currentChampionship.type === "pontos_corridos" ? 3 : 1;
        homeStats.losses++;
      } else {
        homeStats.draws++;
        awayStats.draws++;
        if (currentChampionship.type === "pontos_corridos") {
          homeStats.points += 1;
          awayStats.points += 1;
        }
      }

      // Calcular saldo de gols
      homeStats.goalDifference = homeStats.goalsFor - homeStats.goalsAgainst;
      awayStats.goalDifference = awayStats.goalsFor - awayStats.goalsAgainst;

      // Contar gols dos jogadores
      match.homeGoalScorers?.forEach((goalScorer) => {
        if (playerStats[goalScorer.playerId]) {
          playerStats[goalScorer.playerId].goals += goalScorer.goals;
          if (goalScorer.yellowCard) {
            playerStats[goalScorer.playerId].yellowCards++;
          }
          if (goalScorer.redCard) {
            playerStats[goalScorer.playerId].redCards++;
          }
        }
      });

      match.awayGoalScorers?.forEach((goalScorer) => {
        if (playerStats[goalScorer.playerId]) {
          playerStats[goalScorer.playerId].goals += goalScorer.goals;
          if (goalScorer.yellowCard) {
            playerStats[goalScorer.playerId].yellowCards++;
          }
          if (goalScorer.redCard) {
            playerStats[goalScorer.playerId].redCards++;
          }
        }
      });
    });

    return { teamStats, playerStats };
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    loadChampionships();
    loadCurrentChampionship();
  }, []);

  return {
    championships,
    currentChampionship,
    loading,
    error,
    loadChampionships,
    loadCurrentChampionship,
    createChampionship,
    selectChampionship,
    addTeam,
    removeTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    generateMatches,
    recordMatchResult,
    calculateStats,
  };
};
