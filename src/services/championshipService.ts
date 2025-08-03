import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Championship,
  Team,
  Player,
  Match,
  GoalScorer,
} from "../types/championship";

const CHAMPIONSHIPS_KEY = "championships";
const CURRENT_CHAMPIONSHIP_KEY = "currentChampionship";

export class ChampionshipService {
  // Carregar todos os campeonatos
  static async getAllChampionships(): Promise<Championship[]> {
    try {
      const data = await AsyncStorage.getItem(CHAMPIONSHIPS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Erro ao carregar campeonatos:", error);
      return [];
    }
  }

  // Salvar campeonatos
  static async saveChampionships(championships: Championship[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        CHAMPIONSHIPS_KEY,
        JSON.stringify(championships)
      );
    } catch (error) {
      console.error("Erro ao salvar campeonatos:", error);
      throw error;
    }
  }

  // Criar novo campeonato
  static async createChampionship(
    name: string,
    type: "pontos_corridos" | "mata_mata" | "grupos"
  ): Promise<Championship> {
    const newChampionship: Championship = {
      id: Date.now().toString(),
      name: name.trim(),
      type,
      status: "criado",
      teams: [],
      matches: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const championships = await this.getAllChampionships();
    championships.push(newChampionship);
    await this.saveChampionships(championships);

    return newChampionship;
  }

  // Obter campeonato por ID
  static async getChampionshipById(id: string): Promise<Championship | null> {
    const championships = await this.getAllChampionships();
    return championships.find((c) => c.id === id) || null;
  }

  // Atualizar campeonato
  static async updateChampionship(
    updatedChampionship: Championship
  ): Promise<void> {
    const championships = await this.getAllChampionships();
    const index = championships.findIndex(
      (c) => c.id === updatedChampionship.id
    );

    if (index !== -1) {
      updatedChampionship.updatedAt = new Date().toISOString();
      championships[index] = updatedChampionship;
      await this.saveChampionships(championships);
    }
  }

  // Deletar campeonato
  static async deleteChampionship(id: string): Promise<void> {
    const championships = await this.getAllChampionships();
    const filtered = championships.filter((c) => c.id !== id);
    await this.saveChampionships(filtered);
  }

  // Definir campeonato atual
  static async setCurrentChampionship(championshipId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENT_CHAMPIONSHIP_KEY, championshipId);
    } catch (error) {
      console.error("Erro ao definir campeonato atual:", error);
      throw error;
    }
  }

  // Obter campeonato atual
  static async getCurrentChampionship(): Promise<Championship | null> {
    try {
      const currentId = await AsyncStorage.getItem(CURRENT_CHAMPIONSHIP_KEY);
      if (!currentId) return null;

      return await this.getChampionshipById(currentId);
    } catch (error) {
      console.error("Erro ao obter campeonato atual:", error);
      return null;
    }
  }

  // Adicionar time ao campeonato
  static async addTeamToChampionship(
    championshipId: string,
    team: Team
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    team.id = team.id || Date.now().toString();
    championship.teams.push(team);
    await this.updateChampionship(championship);
  }

  // Remover time do campeonato
  static async removeTeamFromChampionship(
    championshipId: string,
    teamId: string
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    championship.teams = championship.teams.filter((t) => t.id !== teamId);
    await this.updateChampionship(championship);
  }

  // Atualizar time no campeonato
  static async updateTeamInChampionship(
    championshipId: string,
    updatedTeam: Team
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const teamIndex = championship.teams.findIndex(
      (t) => t.id === updatedTeam.id
    );
    if (teamIndex !== -1) {
      championship.teams[teamIndex] = updatedTeam;
      await this.updateChampionship(championship);
    }
  }

  // Adicionar jogador a um time
  static async addPlayerToTeam(
    championshipId: string,
    teamId: string,
    player: Player
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const team = championship.teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Time não encontrado");

    player.id = player.id || Date.now().toString();
    team.players.push(player);
    await this.updateChampionship(championship);
  }

  // Remover jogador de um time
  static async removePlayerFromTeam(
    championshipId: string,
    teamId: string,
    playerId: string
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const team = championship.teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Time não encontrado");

    team.players = team.players.filter((p) => p.id !== playerId);
    await this.updateChampionship(championship);
  }

  // Transferir jogador entre times
  static async transferPlayer(
    championshipId: string,
    playerId: string,
    fromTeamId: string,
    toTeamId: string
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const fromTeam = championship.teams.find((t) => t.id === fromTeamId);
    const toTeam = championship.teams.find((t) => t.id === toTeamId);

    if (!fromTeam || !toTeam) throw new Error("Time não encontrado");

    const playerIndex = fromTeam.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) throw new Error("Jogador não encontrado");

    const player = fromTeam.players.splice(playerIndex, 1)[0];
    toTeam.players.push(player);

    await this.updateChampionship(championship);
  }

  // Gerar jogos para o campeonato
  static async generateMatches(championshipId: string): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const teams = championship.teams;
    if (teams.length < 2) throw new Error("É necessário pelo menos 2 times");

    let matches: Match[] = [];

    switch (championship.type) {
      case "pontos_corridos":
        // Todos contra todos
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            matches.push({
              id: `${Date.now()}-${i}-${j}`,
              homeTeam: teams[i].id,
              awayTeam: teams[j].id,
              played: false,
            });
          }
        }
        break;

      case "mata_mata":
        // Mata-mata simples
        for (let i = 0; i < teams.length; i += 2) {
          if (i + 1 < teams.length) {
            matches.push({
              id: `${Date.now()}-${i}`,
              homeTeam: teams[i].id,
              awayTeam: teams[i + 1].id,
              played: false,
            });
          }
        }
        break;

      case "grupos":
        // Dividir em dois grupos e gerar jogos dentro dos grupos
        const grupoA = teams.filter((_, idx) => idx % 2 === 0);
        const grupoB = teams.filter((_, idx) => idx % 2 !== 0);

        grupoA.forEach((teamA) => {
          grupoB.forEach((teamB) => {
            matches.push({
              id: `${Date.now()}-${teamA.id}-${teamB.id}`,
              homeTeam: teamA.id,
              awayTeam: teamB.id,
              played: false,
            });
          });
        });
        break;
    }

    championship.matches = matches;
    championship.status = "em_andamento";
    await this.updateChampionship(championship);
  }

  // Registrar resultado de uma partida
  static async recordMatchResult(
    championshipId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeGoalScorers: GoalScorer[] = [],
    awayGoalScorers: GoalScorer[] = []
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const match = championship.matches.find((m) => m.id === matchId);
    if (!match) throw new Error("Partida não encontrada");

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.homeGoalScorers = homeGoalScorers;
    match.awayGoalScorers = awayGoalScorers;
    match.played = true;
    match.date = new Date().toISOString();

    await this.updateChampionship(championship);
  }
}
