import { useState, useEffect } from "react";
import {
  Championship,
  Team,
  Player,
  Match,
  ChampionshipStats,
  GoalScorer,
  MatchGenerationOptions,
  ManualMatch,
} from "../types/championship";
import { ChampionshipService } from "../services/championshipService";
import { useAuth } from "../contexts/AuthContext";

export const useChampionship = () => {
  const { user } = useAuth();
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

      // Deduplicar baseado no ID como proteção extra
      const uniqueChampionships = data.filter(
        (championship, index, arr) =>
          arr.findIndex((c) => c.id === championship.id) === index
      );

      if (uniqueChampionships.length !== data.length) {
        console.log(
          `🧹 Hook: Removidas ${
            data.length - uniqueChampionships.length
          } duplicatas da lista`
        );
      }

      setChampionships(uniqueChampionships);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar campeonatos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Função para forçar recarregamento completo dos dados
  const forceReloadCurrentChampionship = async () => {
    if (!currentChampionship?.id) {
      console.log("⚠️ Hook: Nenhum campeonato atual para recarregar");
      return;
    }

    console.log("🔄 Hook: Forçando recarregamento completo dos dados...");
    setLoading(true);
    try {
      // Primeiro, tentar recarregar diretamente do Firebase
      const reloadedChampionship =
        await ChampionshipService.reloadChampionshipById(
          currentChampionship.id
        );
      if (reloadedChampionship) {
        setCurrentChampionship(reloadedChampionship);
        console.log("✅ Hook: Dados recarregados diretamente do Firebase!");

        // Log das partidas para debug
        if (reloadedChampionship.matches) {
          const playedMatches = reloadedChampionship.matches.filter(
            (m) => m.played
          );
          console.log(
            `🎮 Hook: Total de partidas: ${reloadedChampionship.matches.length}`
          );
          console.log(`✅ Hook: Partidas jogadas: ${playedMatches.length}`);

          // Log de uma partida específica para debug
          if (playedMatches.length > 0) {
            const lastPlayed = playedMatches[playedMatches.length - 1];
            console.log("🎯 Hook: Última partida jogada:", {
              id: lastPlayed.id,
              homeScore: lastPlayed.homeScore,
              awayScore: lastPlayed.awayScore,
              played: lastPlayed.played,
            });
          }
        }
      } else {
        console.log("⚠️ Hook: Fallback para loadCurrentChampionship");
        await loadCurrentChampionship();
      }
    } catch (error) {
      console.error("❌ Hook: Erro ao forçar recarregamento:", error);
      setError("Erro ao recarregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Carregar campeonato atual
  const loadCurrentChampionship = async () => {
    console.log("🔄 Hook: Carregando campeonato atual...");
    setLoading(true);
    try {
      const current = await ChampionshipService.getCurrentChampionship();
      console.log("📊 Hook: Campeonato carregado:", current?.name);
      console.log(
        "🎮 Hook: Número de partidas:",
        current?.matches?.length || 0
      );

      if (current?.matches) {
        const playedMatches = current.matches.filter((m) => m.played);
        console.log("✅ Hook: Partidas jogadas:", playedMatches.length);
      }

      setCurrentChampionship(current);
      setError(null);
    } catch (err) {
      console.error("❌ Hook: Erro ao carregar campeonato atual:", err);
      setError("Erro ao carregar campeonato atual");
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

      // Atualizar o estado local diretamente ao invés de recarregar
      // para evitar condições de corrida com Firebase
      setChampionships((prev) => {
        const exists = prev.some((c) => c.id === newChampionship.id);
        if (exists) {
          console.log("⚠️ Campeonato já existe na lista local, não duplicando");
          return prev;
        }
        console.log("✅ Adicionando campeonato à lista local");
        return [...prev, newChampionship];
      });

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

    console.log("🏒 Hook: Adicionando jogador ao time:", { teamId, player });

    setLoading(true);
    try {
      const newPlayer: Player = {
        ...player,
        id: Date.now().toString(),
      };

      console.log("🎲 Hook: Jogador com ID gerado:", newPlayer);

      await ChampionshipService.addPlayerToTeam(
        currentChampionship.id,
        teamId,
        newPlayer
      );

      console.log("🔄 Hook: Recarregando campeonato atual...");
      await loadCurrentChampionship();
      setError(null);
      console.log("✅ Hook: Jogador adicionado com sucesso!");
    } catch (err) {
      setError("Erro ao adicionar jogador");
      console.error("❌ Hook: Erro ao adicionar jogador:", err);
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
  const generateMatches = async (options?: MatchGenerationOptions) => {
    if (!currentChampionship) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.generateMatches(
        currentChampionship.id,
        options
      );
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

  // Obter confrontos possíveis para seleção manual
  const getPossibleMatchups = () => {
    if (!currentChampionship || !currentChampionship.teams) {
      return [];
    }
    return ChampionshipService.getPossibleMatchups(currentChampionship.teams);
  };

  // Obter partidas agrupadas por rodada
  const getMatchesByRound = () => {
    if (!currentChampionship) {
      return {};
    }
    return ChampionshipService.getMatchesByRound(currentChampionship);
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

    console.log("🎯 Hook: Registrando resultado...");
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

      console.log("🔄 Hook: Recarregando campeonato com dados atualizados...");
      // Usar reloadChampionshipById para forçar a busca dos dados mais recentes
      const reloadedChampionship =
        await ChampionshipService.reloadChampionshipById(
          currentChampionship.id
        );
      if (reloadedChampionship) {
        setCurrentChampionship(reloadedChampionship);
        console.log("✅ Hook: Campeonato recarregado diretamente!");
      } else {
        // Fallback para o método normal
        await loadCurrentChampionship();
      }

      setError(null);
    } catch (err) {
      console.error("❌ Hook: Erro ao registrar resultado:", err);
      setError("Erro ao registrar resultado");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calculateStats = (): ChampionshipStats => {
    if (!currentChampionship) {
      console.log("🔍 STATS: Nenhum campeonato atual");
      return { teamStats: {}, playerStats: {} };
    }

    console.log(
      "🔍 STATS: Calculando estatísticas para:",
      currentChampionship.name
    );
    console.log(
      "📊 STATS: Total de partidas:",
      currentChampionship.matches?.length || 0
    );

    const teamStats: { [teamId: string]: any } = {};
    const playerStats: { [playerId: string]: any } = {};

    // Inicializar estatísticas dos times
    currentChampionship.teams?.forEach((team) => {
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
      team.players?.forEach((player) => {
        playerStats[player.id] = {
          matches: 0,
          goals: 0,
          yellowCards: player.yellowCards || 0,
          redCards: player.redCards || 0,
        };
      });
    });

    // Processar partidas jogadas
    if (currentChampionship?.matches) {
      const playedMatches = currentChampionship.matches.filter((m) => m.played);
      console.log(
        "✅ STATS: Partidas jogadas encontradas:",
        playedMatches.length
      );

      playedMatches.forEach((match, index) => {
        console.log(`🎯 STATS: Processando partida ${index + 1}:`, {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          played: match.played,
        });
      });

      currentChampionship.matches.forEach((match) => {
        if (
          !match.played ||
          match.homeScore === undefined ||
          match.awayScore === undefined
        ) {
          console.log("⏭️ STATS: Pulando partida não jogada:", {
            id: match.id,
            played: match.played,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          });
          return;
        }

        const homeStats = teamStats[match.homeTeam];
        const awayStats = teamStats[match.awayTeam];

        if (!homeStats || !awayStats) {
          console.log("❌ STATS: Times não encontrados para a partida:", {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            homeFound: !!homeStats,
            awayFound: !!awayStats,
          });
          return;
        }

        console.log(
          `⚽ STATS: Processando resultado ${match.homeScore} x ${match.awayScore}`
        );

        // Atualizar estatísticas dos times
        homeStats.matches++;
        awayStats.matches++;
        homeStats.goalsFor += match.homeScore;
        homeStats.goalsAgainst += match.awayScore;
        awayStats.goalsFor += match.awayScore;
        awayStats.goalsAgainst += match.homeScore;

        // Determinar resultado
        if (match.homeScore > match.awayScore) {
          console.log("🏆 STATS: Vitória do time da casa");
          homeStats.wins++;
          homeStats.points +=
            currentChampionship.type === "pontos_corridos" ? 3 : 1;
          awayStats.losses++;
        } else if (match.awayScore > match.homeScore) {
          console.log("🏆 STATS: Vitória do time visitante");
          awayStats.wins++;
          awayStats.points +=
            currentChampionship.type === "pontos_corridos" ? 3 : 1;
          homeStats.losses++;
        } else {
          console.log("🤝 STATS: Empate");
          homeStats.draws++;
          awayStats.draws++;
          if (currentChampionship.type === "pontos_corridos") {
            homeStats.points += 1;
            awayStats.points += 1;
          }
        }

        console.log("📊 STATS: Estatísticas atualizadas:", {
          homeTeam: {
            id: match.homeTeam,
            points: homeStats.points,
            matches: homeStats.matches,
            wins: homeStats.wins,
            draws: homeStats.draws,
            losses: homeStats.losses,
          },
          awayTeam: {
            id: match.awayTeam,
            points: awayStats.points,
            matches: awayStats.matches,
            wins: awayStats.wins,
            draws: awayStats.draws,
            losses: awayStats.losses,
          },
        });

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
    }

    console.log("📋 STATS: Estatísticas finais calculadas:");
    Object.entries(teamStats).forEach(([teamId, stats]) => {
      const team = currentChampionship.teams?.find((t) => t.id === teamId);
      console.log(`🏆 STATS: Time ${team?.name || teamId}:`, {
        points: stats.points,
        matches: stats.matches,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
      });
    });

    return { teamStats, playerStats };
  };

  // Pausar campeonato
  const pauseChampionship = async (championshipId?: string) => {
    const id = championshipId || currentChampionship?.id;
    if (!id) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.pauseChampionship(id);
      await loadCurrentChampionship();
      await loadChampionships();
      setError(null);
    } catch (err) {
      setError("Erro ao pausar campeonato");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Retomar campeonato
  const resumeChampionship = async (championshipId?: string) => {
    const id = championshipId || currentChampionship?.id;
    if (!id) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.resumeChampionship(id);
      await loadCurrentChampionship();
      await loadChampionships();
      setError(null);
    } catch (err) {
      setError("Erro ao retomar campeonato");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Finalizar campeonato
  const finishChampionship = async (championshipId?: string) => {
    const id = championshipId || currentChampionship?.id;
    if (!id) throw new Error("Nenhum campeonato selecionado");

    setLoading(true);
    try {
      await ChampionshipService.finishChampionship(id);
      await loadCurrentChampionship();
      await loadChampionships();
      setError(null);
    } catch (err) {
      setError("Erro ao finalizar campeonato");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar campeonato
  const deleteChampionship = async (championshipId: string) => {
    setLoading(true);
    try {
      await ChampionshipService.deleteChampionship(championshipId);

      // Se o campeonato deletado era o atual, limpar a seleção
      if (currentChampionship?.id === championshipId) {
        setCurrentChampionship(null);
      }

      await loadChampionships();
      setError(null);
    } catch (err) {
      setError("Erro ao deletar campeonato");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar dados
  const syncData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await ChampionshipService.syncAllData();
      await loadChampionships();
      await loadCurrentChampionship();
      setError(null);
    } catch (err) {
      setError("Erro na sincronização");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Limpar todos os dados do usuário
  const clearAllData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await ChampionshipService.clearAllUserData();
      // Limpar dados locais também
      setChampionships([]);
      setCurrentChampionship(null);
      setError(null);
      console.log("✅ Hook: Todos os dados foram limpos!");
    } catch (err) {
      setError("Erro ao limpar dados");
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadChampionships();
      loadCurrentChampionship();
    }
  }, [user]);

  return {
    championships,
    currentChampionship,
    loading,
    error,
    loadChampionships,
    loadCurrentChampionship,
    forceReloadCurrentChampionship,
    createChampionship,
    selectChampionship,
    addTeam,
    removeTeam,
    addPlayerToTeam,
    removePlayerFromTeam,
    generateMatches,
    getPossibleMatchups,
    getMatchesByRound,
    recordMatchResult,
    calculateStats,
    pauseChampionship,
    resumeChampionship,
    finishChampionship,
    deleteChampionship,
    syncData,
    clearAllData,
  };
};
