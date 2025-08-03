import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";
import {
  Championship,
  Team,
  Player,
  Match,
  GoalScorer,
  MatchGenerationOptions,
  ManualMatch,
} from "../types/championship";

const CHAMPIONSHIPS_KEY = "championships";
const CURRENT_CHAMPIONSHIP_KEY = "currentChampionship";

export class ChampionshipService {
  // Limpar campos undefined dos objetos antes de enviar ao Firebase
  private static cleanUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj
        .filter((item) => item !== undefined)
        .map((item) => this.cleanUndefinedFields(item));
    }

    if (typeof obj !== "object") {
      return obj;
    }

    const cleaned: any = {};

    Object.keys(obj).forEach((key) => {
      const value = obj[key];

      if (value !== undefined) {
        if (value === null) {
          // Manter valores null explícitos
          cleaned[key] = null;
        } else if (Array.isArray(value)) {
          // Limpar arrays recursivamente
          cleaned[key] = value
            .filter((item) => item !== undefined)
            .map((item) => this.cleanUndefinedFields(item));
        } else if (typeof value === "object") {
          // Limpar objetos recursivamente
          const cleanedValue = this.cleanUndefinedFields(value);
          if (Object.keys(cleanedValue).length > 0 || cleanedValue === null) {
            cleaned[key] = cleanedValue;
          }
        } else {
          // Valores primitivos
          cleaned[key] = value;
        }
      }
    });

    return cleaned;
  }

  // Verificar se está online
  private static async isOnline(): Promise<boolean> {
    try {
      const testDoc = doc(db, "test", "connectivity");
      await getDoc(testDoc);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obter ID do usuário atual
  private static getUserId(): string | null {
    return auth.currentUser?.uid || null;
  }
  // Carregar todos os campeonatos
  static async getAllChampionships(): Promise<Championship[]> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        console.log("Usuário não autenticado");
        return [];
      }

      if (!(await this.isOnline())) {
        console.log("Offline - não é possível buscar campeonatos");
        return [];
      }

      // Sempre buscar diretamente do Firebase (sem cache)
      console.log("🔄 Buscando campeonatos diretamente do Firebase...");
      const championshipsRef = collection(db, "championships");
      const q = query(championshipsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      const championships: Championship[] = [];
      snapshot.forEach((doc) => {
        championships.push({
          id: doc.id,
          ...doc.data(),
        } as Championship);
      });

      console.log(
        `✅ ${championships.length} campeonatos carregados do Firebase`
      );
      return championships;
    } catch (error) {
      console.error("Erro ao carregar campeonatos do Firebase:", error);
      return [];
    }
  }

  // Salvar campeonatos
  static async saveChampionships(championships: Championship[]): Promise<void> {
    try {
      const userId = this.getUserId();
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      if (!(await this.isOnline())) {
        throw new Error("Não é possível salvar - offline");
      }

      // Salvar apenas no Firebase (sem cache local)
      console.log("💾 Salvando campeonatos no Firebase...");
      for (const championship of championships) {
        const safeChampionship = {
          ...championship,
          teams: championship.teams || [],
          matches: championship.matches || [],
          createdAt: championship.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const championshipData = this.cleanUndefinedFields({
          ...safeChampionship,
          userId,
          updatedAt: new Date().toISOString(),
        });

        const isFirebaseId = championship.id && !/^\d+$/.test(championship.id);

        if (isFirebaseId) {
          const championshipRef = doc(db, "championships", championship.id);
          await setDoc(championshipRef, championshipData);
          console.log("🔄 Campeonato atualizado no Firebase:", championship.id);
        } else {
          const newChampionshipRef = doc(collection(db, "championships"));
          championship.id = newChampionshipRef.id;
          await setDoc(newChampionshipRef, championshipData);
          console.log(
            "✅ Novo campeonato criado no Firebase:",
            championship.id
          );
        }
      }
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
    console.log("🚀 Criando campeonato:", name);

    const userId = this.getUserId();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    if (!(await this.isOnline())) {
      throw new Error("Não é possível criar campeonato - offline");
    }

    const currentDate = new Date().toISOString();
    const newChampionship: Championship = {
      id: "", // Será definido pelo Firebase
      name: name.trim(),
      type,
      status: "criado",
      teams: [],
      matches: [],
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    // Salvar diretamente no Firebase (sem cache)
    const championshipData = this.cleanUndefinedFields({
      ...newChampionship,
      userId,
      createdAt: currentDate,
      updatedAt: currentDate,
    });

    const newChampionshipRef = doc(collection(db, "championships"));
    newChampionship.id = newChampionshipRef.id;
    await setDoc(newChampionshipRef, championshipData);

    console.log("✅ Campeonato criado no Firebase:", newChampionship.id);
    return newChampionship;
  }

  // Obter campeonato por ID
  static async getChampionshipById(id: string): Promise<Championship | null> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    if (!(await this.isOnline())) {
      throw new Error("Não é possível buscar campeonato - offline");
    }

    // Buscar diretamente do Firebase (sem cache)
    try {
      const championshipRef = doc(db, "championships", id);
      const championshipDoc = await getDoc(championshipRef);

      if (championshipDoc.exists()) {
        const championshipData = championshipDoc.data();
        if (championshipData.userId === userId) {
          return {
            id: championshipDoc.id,
            ...championshipData,
          } as Championship;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao buscar campeonato do Firebase:", error);
      return null;
    }
  }

  // Recarregar campeonato específico (força reload dos dados)
  static async reloadChampionshipById(
    id: string
  ): Promise<Championship | null> {
    console.log("🔄 Recarregando campeonato específico:", id);

    // Simplesmente usar getChampionshipById que já busca direto do Firebase
    return await this.getChampionshipById(id);
  }

  // Atualizar campeonato
  static async updateChampionship(
    updatedChampionship: Championship,
    forceReload: boolean = true
  ): Promise<void> {
    console.log(
      "🔄 Service: Atualizando campeonato:",
      updatedChampionship.name
    );
    console.log(
      "🎮 Service: Partidas no campeonato:",
      updatedChampionship.matches?.length || 0
    );

    // Debug: verificar partidas jogadas
    if (updatedChampionship.matches) {
      const playedMatches = updatedChampionship.matches.filter((m) => m.played);
      console.log(
        "✅ Service: Partidas marcadas como jogadas:",
        playedMatches.length
      );

      if (playedMatches.length > 0) {
        const lastPlayed = playedMatches[playedMatches.length - 1];
        console.log("🎯 Service: Última partida jogada:", {
          id: lastPlayed.id,
          played: lastPlayed.played,
          homeScore: lastPlayed.homeScore,
          awayScore: lastPlayed.awayScore,
        });
      }
    }

    const userId = this.getUserId();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    const currentDate = new Date().toISOString();
    updatedChampionship.updatedAt = currentDate;

    // Atualizar no Firebase primeiro se online
    if (await this.isOnline()) {
      try {
        const championshipRef = doc(
          db,
          "championships",
          updatedChampionship.id
        );

        // Limpar e preparar dados
        const championshipData = this.cleanUndefinedFields({
          ...updatedChampionship,
          userId,
          updatedAt: currentDate,
        });

        console.log("🌐 Service: Enviando para Firebase...");
        console.log("📤 Service: Dados a serem salvos:", {
          id: championshipData.id,
          matches: championshipData.matches?.length || 0,
          playedMatches:
            championshipData.matches?.filter((m: any) => m.played)?.length || 0,
        });

        // Salvar no Firebase sem merge para garantir consistência
        await setDoc(championshipRef, championshipData);
        console.log("✅ Service: Dados salvos no Firebase!");

        if (forceReload) {
          // Recarregar dados frescos do Firebase
          console.log("🔄 Service: Recarregando dados do Firebase...");
          const championshipDoc = await getDoc(championshipRef);

          if (championshipDoc.exists()) {
            const freshData = championshipDoc.data() as Championship;
            freshData.id = championshipDoc.id; // Garantir que o ID está correto

            console.log("✅ Service: Dados recarregados do Firebase:", {
              id: freshData.id,
              matches: freshData.matches?.length || 0,
              playedMatches:
                freshData.matches?.filter((m: any) => m.played)?.length || 0,
            });

            // Invalidar cache e recarregar dados frescos
            console.log("� Service: Invalidando cache e recarregando...");

            // Buscar todos os campeonatos diretamente do Firebase
            const userId = this.getUserId();
            if (userId) {
              const championshipsRef = collection(db, "championships");
              const q = query(championshipsRef, where("userId", "==", userId));
              const snapshot = await getDocs(q);

              const freshChampionships: Championship[] = [];
              snapshot.forEach((doc) => {
                freshChampionships.push({
                  id: doc.id,
                  ...doc.data(),
                } as Championship);
              });

              // Atualizar cache com dados frescos
              await AsyncStorage.setItem(
                CHAMPIONSHIPS_KEY,
                JSON.stringify(freshChampionships)
              );
              console.log(
                "✅ Service: Cache atualizado com dados frescos do Firebase!"
              );
            }
          }
        }
      } catch (error) {
        console.error(
          "❌ Service: Erro ao atualizar/recarregar do Firebase:",
          error
        );
        throw error; // Propagar erro para tratamento adequado
      }
    } else {
      // Modo offline
      console.log("� Service: Offline - salvando apenas localmente");
      const championships = await this.getAllChampionships();
      const index = championships.findIndex(
        (c) => c.id === updatedChampionship.id
      );

      if (index !== -1) {
        championships[index] = updatedChampionship;
        await AsyncStorage.setItem(
          CHAMPIONSHIPS_KEY,
          JSON.stringify(championships)
        );
        console.log("✅ Service: Cache local atualizado (offline)!");
      }
    }
  }

  // Deletar campeonato
  static async deleteChampionship(id: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    if (!(await this.isOnline())) {
      throw new Error("Não é possível deletar campeonato - offline");
    }

    // Deletar apenas do Firebase (sem cache)
    const championshipRef = doc(db, "championships", id);
    const championshipDoc = await getDoc(championshipRef);

    if (championshipDoc.exists()) {
      const championshipData = championshipDoc.data();
      if (championshipData.userId === userId) {
        await deleteDoc(championshipRef);
      } else {
        throw new Error("Campeonato não pertence ao usuário atual");
      }
    }
  }

  // Definir campeonato atual
  static async setCurrentChampionship(championshipId: string): Promise<void> {
    const userId = this.getUserId();
    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    if (!(await this.isOnline())) {
      throw new Error("Não é possível definir campeonato atual - offline");
    }

    // Salvar apenas no Firebase (sem cache)
    const userPrefsRef = doc(db, "userPreferences", userId);
    await setDoc(
      userPrefsRef,
      {
        currentChampionshipId: championshipId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  // Obter campeonato atual
  static async getCurrentChampionship(): Promise<Championship | null> {
    const userId = this.getUserId();
    if (!userId) {
      return null;
    }

    if (!(await this.isOnline())) {
      return null;
    }

    // Buscar apenas do Firebase (sem cache)
    try {
      const userPrefsRef = doc(db, "userPreferences", userId);
      const userPrefsDoc = await getDoc(userPrefsRef);

      if (userPrefsDoc.exists()) {
        const userData = userPrefsDoc.data();
        const currentId = userData.currentChampionshipId || null;

        if (currentId) {
          return await this.getChampionshipById(currentId);
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao obter campeonato atual do Firebase:", error);
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

    if (!championship.teams) {
      championship.teams = [];
    }

    // Garantir que o time tenha todas as propriedades necessárias
    const safeTeam: Team = {
      id: team.id || Date.now().toString(),
      name: team.name,
      color: team.color,
      players: team.players || [],
    };

    championship.teams.push(safeTeam);
    await this.updateChampionship(championship);
  }

  // Remover time do campeonato
  static async removeTeamFromChampionship(
    championshipId: string,
    teamId: string
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    if (!championship.teams) {
      championship.teams = [];
    }

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
    console.log("🎯 Adicionando jogador ao time:", {
      championshipId,
      teamId,
      player,
    });

    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const team = championship.teams.find((t) => t.id === teamId);
    if (!team) throw new Error("Time não encontrado");

    // Garantir que o jogador tenha todas as propriedades necessárias
    const safePlayer: Player = {
      id: player.id || Date.now().toString(),
      name: player.name,
      skill: player.skill,
      position: player.position,
      yellowCards: player.yellowCards || 0,
      redCards: player.redCards || 0,
      ...(player.cpf && { cpf: player.cpf }), // Só incluir CPF se fornecido
    };

    console.log("✅ Jogador seguro criado:", safePlayer);

    team.players.push(safePlayer);

    console.log("📝 Atualizando campeonato com novo jogador...");
    await this.updateChampionship(championship);
    console.log("🎉 Jogador adicionado com sucesso!");
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
  static async generateMatches(
    championshipId: string,
    options?: MatchGenerationOptions
  ): Promise<void> {
    console.log("🎮 Gerando partidas para o campeonato:", championshipId);
    console.log("📋 Opções:", options);

    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    const teams = championship.teams;
    if (teams.length < 2) throw new Error("É necessário pelo menos 2 times");

    // Inicializar array de partidas se não existir
    if (!championship.matches) {
      championship.matches = [];
    }

    console.log(
      "📊 Partidas existentes antes da geração:",
      championship.matches.length
    );
    console.log(
      "✅ Partidas já jogadas:",
      championship.matches.filter((m) => m.played).length
    );

    let newMatches: Match[] = [];

    // Salvar as opções de geração no campeonato
    championship.matchGenerationOptions = options;

    if (options?.type === "manual" && options.manualMatches) {
      // Geração manual de partidas
      console.log("🎯 Gerando partidas manualmente...");
      newMatches = this.generateManualMatches(options.manualMatches, teams);
    } else {
      // Sem geração automática - apenas manual
      console.log("⚠️ Apenas geração manual está disponível");
      throw new Error(
        "Apenas geração manual de partidas está disponível. Use o tipo 'manual' e forneça as partidas."
      );
    }

    console.log(`🎉 ${newMatches.length} novas partidas geradas!`);

    // CORRIGIDO: Adicionar apenas as novas partidas ao array existente
    // ao invés de substituir todas as partidas
    championship.matches = [...championship.matches, ...newMatches];

    console.log(
      "📊 Total de partidas após geração:",
      championship.matches.length
    );
    console.log(
      "✅ Partidas jogadas mantidas:",
      championship.matches.filter((m) => m.played).length
    );

    championship.status = "em_andamento";
    await this.updateChampionship(championship);
  }

  // Gerar partidas manualmente
  private static generateManualMatches(
    manualMatches: ManualMatch[],
    teams: Team[]
  ): Match[] {
    const matches: Match[] = [];

    manualMatches.forEach((manualMatch, index) => {
      // Verificar se os times existem
      const homeTeam = teams.find((t) => t.id === manualMatch.homeTeamId);
      const awayTeam = teams.find((t) => t.id === manualMatch.awayTeamId);

      if (!homeTeam || !awayTeam) {
        console.warn(
          `⚠️ Times não encontrados para partida ${index + 1}:`,
          manualMatch
        );
        return;
      }

      if (homeTeam.id === awayTeam.id) {
        console.warn(
          `⚠️ Um time não pode jogar contra ele mesmo:`,
          manualMatch
        );
        return;
      }

      matches.push({
        id: `${Date.now()}-manual-${index}`,
        homeTeam: manualMatch.homeTeamId,
        awayTeam: manualMatch.awayTeamId,
        played: false,
        homeGoalScorers: [],
        awayGoalScorers: [],
        round: manualMatch.round || 1,
        matchOrder: (index % 10) + 1, // Ordem dentro da rodada
      });
    });

    return matches;
  }

  // Obter partidas por rodada
  static getMatchesByRound(championship: Championship): {
    [round: number]: Match[];
  } {
    const matchesByRound: { [round: number]: Match[] } = {};

    championship.matches.forEach((match) => {
      const round = match.round || 1;
      if (!matchesByRound[round]) {
        matchesByRound[round] = [];
      }
      matchesByRound[round].push(match);
    });

    // Ordenar partidas dentro de cada rodada
    Object.keys(matchesByRound).forEach((roundKey) => {
      const round = parseInt(roundKey);
      matchesByRound[round].sort(
        (a, b) => (a.matchOrder || 0) - (b.matchOrder || 0)
      );
    });

    return matchesByRound;
  }

  // Obter confrontos possíveis (para seleção manual)
  static getPossibleMatchups(
    teams: Team[]
  ): { homeTeam: Team; awayTeam: Team }[] {
    const matchups: { homeTeam: Team; awayTeam: Team }[] = [];

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matchups.push({
          homeTeam: teams[i],
          awayTeam: teams[j],
        });
      }
    }

    return matchups;
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
    console.log("🎯 Service: Registrando resultado da partida:", {
      championshipId,
      matchId,
      homeScore,
      awayScore,
    });

    const championship = await this.getChampionshipById(championshipId);
    if (!championship) {
      console.error("❌ Service: Campeonato não encontrado:", championshipId);
      throw new Error("Campeonato não encontrado");
    }

    if (!championship.matches) {
      console.error("❌ Service: Campeonato não possui partidas");
      throw new Error("Campeonato não possui partidas");
    }

    console.log("🔍 Service: Procurando partida com ID:", matchId);
    console.log(
      "📋 Service: Total de partidas no campeonato:",
      championship.matches.length
    );

    const match = championship.matches.find((m) => m.id === matchId);
    if (!match) {
      console.error("❌ Service: Partida não encontrada:", matchId);
      console.log(
        "📋 Service: IDs das partidas disponíveis:",
        championship.matches.map((m) => m.id)
      );
      throw new Error("Partida não encontrada");
    }

    console.log("📝 Service: Partida encontrada, atualizando dados...");
    console.log("⚠️ Service: Estado ANTES da atualização:", {
      id: match.id,
      played: match.played,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    });

    // Atualizar dados da partida
    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.homeGoalScorers = homeGoalScorers;
    match.awayGoalScorers = awayGoalScorers;
    match.played = true;
    match.date = new Date().toISOString();

    console.log("✅ Service: Estado DEPOIS da atualização:", {
      id: match.id,
      played: match.played,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      date: match.date,
    });

    console.log("💾 Service: Salvando campeonato atualizado...");

    // Verificar o estado antes de salvar
    const matchBeforeSave = championship.matches.find((m) => m.id === matchId);
    console.log("🔍 Service: Estado da partida antes de salvar:", {
      id: matchBeforeSave?.id,
      played: matchBeforeSave?.played,
      homeScore: matchBeforeSave?.homeScore,
      awayScore: matchBeforeSave?.awayScore,
    });

    // Forçar recarregamento ao registrar resultado
    await this.updateChampionship(championship, true /* forceReload */);

    console.log("🎉 Service: Resultado registrado com sucesso!");

    // Verificar se realmente foi salvo usando recarregamento direto do Firebase
    const verifyChampionship = await this.getChampionshipById(championshipId);
    const verifyMatch = verifyChampionship?.matches.find(
      (m) => m.id === matchId
    );
    console.log("🔍 Service: Verificação pós-salvamento (Firebase):", {
      id: verifyMatch?.id,
      played: verifyMatch?.played,
      homeScore: verifyMatch?.homeScore,
      awayScore: verifyMatch?.awayScore,
    });
  }

  // Pausar campeonato
  static async pauseChampionship(championshipId: string): Promise<void> {
    console.log("⏸️ Pausando campeonato:", championshipId);

    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    if (championship.status === "finalizado") {
      throw new Error("Não é possível pausar um campeonato finalizado");
    }

    championship.status = "pausado";
    await this.updateChampionship(championship);

    console.log("✅ Campeonato pausado com sucesso!");
  }

  // Retomar campeonato pausado
  static async resumeChampionship(championshipId: string): Promise<void> {
    console.log("▶️ Retomando campeonato:", championshipId);

    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    if (championship.status !== "pausado") {
      throw new Error("Apenas campeonatos pausados podem ser retomados");
    }

    // Verificar se já tem partidas geradas para determinar o status
    const hasMatches = championship.matches && championship.matches.length > 0;
    championship.status = hasMatches ? "em_andamento" : "criado";

    await this.updateChampionship(championship);

    console.log("✅ Campeonato retomado com sucesso!");
  }

  // Finalizar campeonato
  static async finishChampionship(championshipId: string): Promise<void> {
    console.log("🏁 Finalizando campeonato:", championshipId);

    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    if (championship.status === "finalizado") {
      throw new Error("Campeonato já está finalizado");
    }

    championship.status = "finalizado";
    championship.finishedAt = new Date().toISOString();

    await this.updateChampionship(championship);

    console.log("✅ Campeonato finalizado com sucesso!");
  }

  // Sincronizar todos os dados do campeonato
  static async syncAllData(): Promise<void> {
    try {
      console.log("Iniciando sincronização de dados dos campeonatos...");

      const userId = this.getUserId();
      if (!userId || !(await this.isOnline())) {
        console.log(
          "Usuário não autenticado ou offline, sincronização cancelada"
        );
        return;
      }

      // Recarregar dados do Firebase
      await this.getAllChampionships();
      await this.getCurrentChampionship();

      console.log("Sincronização de campeonatos concluída!");
    } catch (error) {
      console.error("Erro na sincronização de campeonatos:", error);
    }
  }

  // Limpar todos os dados do usuário atual
  static async clearAllUserData(): Promise<void> {
    try {
      console.log("🗑️ Iniciando limpeza de todos os dados do usuário...");

      const userId = this.getUserId();
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      if (!(await this.isOnline())) {
        throw new Error("Não é possível limpar dados - offline");
      }

      // Buscar todos os campeonatos do usuário
      const championshipsRef = collection(db, "championships");
      const q = query(championshipsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      // Deletar todos os campeonatos
      const deletePromises: Promise<void>[] = [];
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      // Limpar preferências do usuário
      const userPrefsRef = doc(db, "userPreferences", userId);
      await deleteDoc(userPrefsRef);

      console.log("✅ Todos os dados do usuário foram limpos do Firebase!");
    } catch (error) {
      console.error("❌ Erro ao limpar dados do usuário:", error);
      throw error;
    }
  }
}
