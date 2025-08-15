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
  Group,
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
        const data = doc.data();

        // Verificar se o campeonato tem ID válido
        let championshipId = data.id || doc.id;
        if (!championshipId || championshipId.trim() === "") {
          console.log("🔧 Corrigindo ID vazio, usando doc.id:", doc.id);
          championshipId = doc.id;
        }

        const championship: Championship = {
          id: championshipId,
          name: data.name || "Campeonato Sem Nome",
          type: data.type || "pontos_corridos",
          status: data.status || "criado",
          teams: data.teams || [],
          matches: data.matches || [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        };

        // Se o ID foi corrigido, atualizar no Firebase
        if (data.id !== championshipId) {
          console.log("🔧 Atualizando ID no Firebase:", championshipId);
          this.updateChampionship(championship).catch(console.error);
        }

        championships.push(championship);
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

    // Gerar o ID primeiro
    const newChampionshipRef = doc(collection(db, "championships"));
    const championshipId = newChampionshipRef.id;

    console.log("🆔 ID gerado para o campeonato:", championshipId);

    const newChampionship: Championship = {
      id: championshipId, // Usar o ID gerado
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

    console.log("💾 Salvando campeonato com ID:", championshipData.id);
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
    if (!updatedChampionship?.id || updatedChampionship.id.trim() === "") {
      throw new Error("ID de campeonato inválido para atualização");
    }
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
    if (!id || id.trim() === "") {
      throw new Error("ID de campeonato inválido para deleção");
    }
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
    console.log("🎯 Service: Definindo campeonato atual:", championshipId);
    const userId = this.getUserId();
    if (!userId) {
      console.error("❌ Service: Usuário não autenticado");
      throw new Error("Usuário não autenticado");
    }

    if (!(await this.isOnline())) {
      console.error("❌ Service: Usuário offline");
      throw new Error("Não é possível definir campeonato atual - offline");
    }

    try {
      // Validar ID
      if (!championshipId || championshipId.trim() === "") {
        console.error("❌ Service: ID de campeonato inválido ao definir atual");
        throw new Error("ID de campeonato inválido");
      }

      // Verificar se o campeonato existe
      const ref = doc(db, "championships", championshipId);
      const existsSnap = await getDoc(ref);
      if (!existsSnap.exists()) {
        console.error(
          "❌ Service: Campeonato inexistente para ID:",
          championshipId
        );
        throw new Error("Campeonato não encontrado");
      }

      // Salvar apenas no Firebase (sem cache)
      const userPrefsRef = doc(db, "userPreferences", userId);
      console.log("🔄 Service: Salvando preferência no Firebase...");
      await setDoc(
        userPrefsRef,
        {
          currentChampionshipId: championshipId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log("✅ Service: Campeonato atual definido no Firebase!");
    } catch (error) {
      console.error("❌ Service: Erro ao salvar no Firebase:", error);
      throw error;
    }
  }

  // Obter campeonato atual
  static async getCurrentChampionship(): Promise<Championship | null> {
    const userId = this.getUserId();
    if (!userId) {
      console.log(
        "⚠️ Service: Usuário não autenticado para getCurrentChampionship"
      );
      return null;
    }

    if (!(await this.isOnline())) {
      console.log("⚠️ Service: Usuário offline para getCurrentChampionship");
      return null;
    }

    // Buscar apenas do Firebase (sem cache)
    try {
      console.log("🔄 Service: Buscando campeonato atual do Firebase...");
      const userPrefsRef = doc(db, "userPreferences", userId);
      const userPrefsDoc = await getDoc(userPrefsRef);

      if (userPrefsDoc.exists()) {
        const userData = userPrefsDoc.data();
        const currentId = userData.currentChampionshipId || null;
        console.log("📋 Service: CurrentChampionshipId encontrado:", currentId);

        if (
          currentId &&
          typeof currentId === "string" &&
          currentId.trim() !== ""
        ) {
          console.log("🔄 Service: Carregando dados do campeonato...");
          const championship = await this.getChampionshipById(currentId);
          console.log(
            "✅ Service: Campeonato carregado:",
            championship?.name || "null"
          );
          return championship;
        } else {
          console.log("⚠️ Service: Nenhum campeonato atual definido");
        }
      } else {
        console.log("⚠️ Service: Documento de preferências não existe");
      }
      return null;
    } catch (error) {
      console.error(
        "❌ Service: Erro ao obter campeonato atual do Firebase:",
        error
      );
      return null;
    }
  }

  // Reparar campeonatos com ID vazio/inconsistente no Firebase
  static async repairChampionshipIdsForUser(): Promise<{
    fixed: number;
    checked: number;
  }> {
    const userId = this.getUserId();
    if (!userId) throw new Error("Usuário não autenticado");
    if (!(await this.isOnline())) throw new Error("Offline");

    console.log(
      "🛠️ Service: Reparando IDs de campeonatos para o usuário:",
      userId
    );
    const championshipsRef = collection(db, "championships");
    const q = query(championshipsRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    let fixed = 0;
    let checked = 0;

    for (const docSnap of snapshot.docs) {
      checked++;
      const data = docSnap.data() as any;
      const firestoreId = docSnap.id;
      const dataId = (data?.id as string) || "";
      if (!dataId || dataId !== firestoreId) {
        console.log(
          "🔧 Service: Corrigindo doc",
          firestoreId,
          "(id antigo:",
          dataId,
          ")"
        );
        const ref = doc(db, "championships", firestoreId);
        await setDoc(ref, { id: firestoreId }, { merge: true });
        fixed++;
      }
    }

    console.log(
      `✅ Service: Reparos concluídos. Verificados: ${checked}, Corrigidos: ${fixed}`
    );
    return { fixed, checked };
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
    } else if (options?.type === "configured" && options.manualMatches) {
      // Geração configurada (com rodadas e partidas por time)
      console.log("⚙️ Gerando partidas com configurações personalizadas...");
      newMatches = this.generateManualMatches(options.manualMatches, teams);
    } else if (championship.type === "pontos_corridos") {
      // Geração automática para pontos corridos (todos contra todos)
      console.log("🔄 Gerando partidas para pontos corridos...");
      newMatches = this.generateRoundRobinMatches(championship, options);
    } else if (championship.type === "grupos") {
      // Geração automática para fase de grupos (chaveamento + grupos)
      console.log("🏆 Gerando partidas para fase de grupos...");

      // Verificar se os grupos já foram criados
      if (!championship.groups || championship.groups.length === 0) {
        console.log("📋 Criando grupos com sorteio por chaveamento...");
        const numberOfGroups = Math.min(4, Math.floor(teams.length / 2));
        championship.groups = this.createGroupsWithDraw(teams, numberOfGroups);
        championship.currentPhase = "grupos";
        console.log(
          `✅ ${championship.groups.length} grupos criados por sorteio!`
        );
      }

      // Verificar qual fase estamos
      const currentPhase = championship.currentPhase || "grupos";

      if (currentPhase === "grupos") {
        // Verificar se já existem partidas da fase de grupos
        const hasGroupMatches = championship.matches.some((match) =>
          this.isGroupStageMatch(match, championship.groups!)
        );

        if (!hasGroupMatches) {
          console.log("🎯 Gerando partidas da fase de grupos...");
          newMatches = this.generateGroupStageMatches(championship);
        } else {
          // Verificar se fase de grupos terminou
          if (this.isGroupStageCompleted(championship)) {
            console.log("✅ Fase de grupos completada! Gerando mata-mata...");
            championship.currentPhase = "mata_mata";
            newMatches = this.generateKnockoutFromGroups(championship);
          } else {
            console.log("⏳ Fase de grupos ainda não foi completada");
            newMatches = [];
          }
        }
      } else if (currentPhase === "mata_mata") {
        console.log("⚔️ Gerando próxima fase do mata-mata...");
        newMatches = this.generateNextKnockoutRound(championship);
      }
    } else if (championship.type === "mata_mata") {
      // Geração automática para mata-mata (eliminação direta)
      console.log("⚔️ Gerando partidas para mata-mata...");
      newMatches = this.generateKnockoutMatches(championship);
    } else {
      // Sem geração automática - apenas manual
      console.log("⚠️ Apenas geração manual está disponível");
      throw new Error(
        "Apenas geração manual de partidas está disponível. Use o tipo 'manual' ou 'configured' e forneça as partidas."
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

    // *** MATA-MATA DINÂMICO: Verificar se pode gerar próxima fase ***
    if (championship.type === "mata_mata") {
      console.log("⚔️ Verificando se pode gerar próxima fase do mata-mata...");
      await this.checkAndGenerateNextKnockoutRound(championshipId);
    }
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

  // ==================== MÉTODOS PARA PONTOS CORRIDOS ====================

  // Gerar partidas para pontos corridos (todos contra todos)
  static generateRoundRobinMatches(
    championship: Championship,
    options?: MatchGenerationOptions
  ): Match[] {
    if (championship.type !== "pontos_corridos") {
      throw new Error(
        "Este método é apenas para campeonatos de pontos corridos"
      );
    }

    const teams = championship.teams;
    if (teams.length < 2) {
      throw new Error("É necessário pelo menos 2 times para pontos corridos");
    }

    console.log(`🔄 Gerando pontos corridos para ${teams.length} times`);

    // LÓGICA DE SORTEIO PARA PONTOS CORRIDOS (Brasileirão):
    // 1. Verificar se há configuração manual de rodadas/jogos
    // 2. Se não houver, gerar turno e returno completos
    // 3. Sortear apenas a ORDEM dos jogos e MANDO DE CAMPO

    const matches: Match[] = [];
    let matchId = 0;

    // Verificar se há configuração personalizada
    const hasCustomConfig =
      options?.type === "configured" && options.configuredOptions;

    if (hasCustomConfig && options.configuredOptions) {
      // CONFIGURAÇÃO PERSONALIZADA (sua ideia!)
      console.log("⚙️ Usando configuração personalizada de rodadas e jogos");
      const config = options.configuredOptions;

      console.log(`📅 Rodadas configuradas: ${config.totalRounds}`);
      console.log(`⚽ Partidas por time: ${config.matchesPerTeam}`);
      console.log(`📊 Distribuição: ${config.matchDistribution}`);

      // Embaralhar times para sorteio da ordem
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      console.log(
        "🎲 Ordem sorteada dos times:",
        shuffledTeams.map((t) => t.name)
      );

      for (let round = 1; round <= config.totalRounds; round++) {
        console.log(`\n📅 Gerando rodada ${round}:`);

        const teamsForRound = [...shuffledTeams];
        let gamesThisRound = 0;
        const maxGamesPerRound = Math.floor(teams.length / 2);

        // Calcular quantos jogos gerar nesta rodada
        const totalMatchesNeeded = (config.matchesPerTeam * teams.length) / 2; // Dividir por 2 pois cada jogo envolve 2 times
        const matchesPerRound = Math.ceil(
          totalMatchesNeeded / config.totalRounds
        );
        const targetGames = Math.min(matchesPerRound, maxGamesPerRound);

        // Gerar confrontos para esta rodada
        const usedTeams = new Set<string>();

        for (
          let attempt = 0;
          attempt < 100 && gamesThisRound < targetGames;
          attempt++
        ) {
          // Embaralhar times novamente para cada tentativa
          const availableTeams = teamsForRound.filter(
            (t) => !usedTeams.has(t.id)
          );

          if (availableTeams.length >= 2) {
            const team1 =
              availableTeams[Math.floor(Math.random() * availableTeams.length)];
            const remainingTeams = availableTeams.filter(
              (t) => t.id !== team1.id
            );
            const team2 =
              remainingTeams[Math.floor(Math.random() * remainingTeams.length)];

            // Sortear mando de campo
            const [homeTeam, awayTeam] =
              Math.random() < 0.5 ? [team1, team2] : [team2, team1];

            matches.push({
              id: `round_robin_${Date.now()}_${matchId++}`,
              homeTeam: homeTeam.id,
              awayTeam: awayTeam.id,
              played: false,
              homeGoalScorers: [],
              awayGoalScorers: [],
              round: round,
              matchOrder: gamesThisRound + 1,
            });

            console.log(
              `  ⚽ Jogo ${gamesThisRound + 1}: ${homeTeam.name} vs ${
                awayTeam.name
              } (mando: ${homeTeam.name})`
            );

            usedTeams.add(team1.id);
            usedTeams.add(team2.id);
            gamesThisRound++;
          } else {
            break; // Não há mais times disponíveis
          }
        }

        console.log(`✅ Rodada ${round}: ${gamesThisRound} jogos gerados`);
      }
    } else {
      // TURNO E RETURNO COMPLETO (padrão brasileiro)
      console.log("🇧🇷 Gerando turno e returno completo (padrão brasileiro)");

      // Embaralhar times para sorteio da ordem dos confrontos
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      console.log(
        "🎲 Ordem sorteada para confrontos:",
        shuffledTeams.map((t) => t.name)
      );

      let currentRound = 1;

      // TURNO - todos contra todos (1 vez)
      console.log("\n🔄 === GERANDO TURNO ===");
      for (let i = 0; i < shuffledTeams.length; i++) {
        for (let j = i + 1; j < shuffledTeams.length; j++) {
          const team1 = shuffledTeams[i];
          const team2 = shuffledTeams[j];

          // Sortear mando de campo para o turno
          const [homeTeam, awayTeam] =
            Math.random() < 0.5 ? [team1, team2] : [team2, team1];

          matches.push({
            id: `turno_${Date.now()}_${matchId++}`,
            homeTeam: homeTeam.id,
            awayTeam: awayTeam.id,
            played: false,
            homeGoalScorers: [],
            awayGoalScorers: [],
            round: Math.ceil(
              (i * shuffledTeams.length + j) / (shuffledTeams.length / 2)
            ),
            matchOrder:
              ((i * shuffledTeams.length + j) % (shuffledTeams.length / 2)) + 1,
          });

          console.log(
            `⚽ ${homeTeam.name} vs ${awayTeam.name} (mando: ${homeTeam.name})`
          );
        }
      }

      // RETURNO - todos contra todos (invertendo mando)
      console.log("\n🔄 === GERANDO RETURNO ===");
      const turnoMatches = [...matches];
      const maxTurnoRound = Math.max(...turnoMatches.map((m) => m.round || 1));

      turnoMatches.forEach((turnoMatch, index) => {
        // Inverter mando de campo no returno
        matches.push({
          id: `returno_${Date.now()}_${matchId++}`,
          homeTeam: turnoMatch.awayTeam, // Invertido
          awayTeam: turnoMatch.homeTeam, // Invertido
          played: false,
          homeGoalScorers: [],
          awayGoalScorers: [],
          round: maxTurnoRound + (turnoMatch.round || 1),
          matchOrder: turnoMatch.matchOrder,
        });

        const homeTeamName = teams.find(
          (t) => t.id === turnoMatch.awayTeam
        )?.name;
        const awayTeamName = teams.find(
          (t) => t.id === turnoMatch.homeTeam
        )?.name;
        console.log(
          `⚽ ${homeTeamName} vs ${awayTeamName} (returno - mando invertido)`
        );
      });
    }

    console.log(`\n🎉 ${matches.length} partidas geradas para pontos corridos`);
    console.log(
      `📊 Tipo: ${
        hasCustomConfig
          ? "Configuração personalizada"
          : "Turno e returno completo"
      }`
    );

    return matches;
  }

  // ==================== MÉTODOS PARA GRUPOS ====================

  // Criar grupos com sorteio por chaveamento (estilo Copa do Mundo)
  static createGroupsWithDraw(teams: any[], numberOfGroups: number): Group[] {
    console.log(
      `🏆 Criando ${numberOfGroups} grupos com sorteio por chaveamento`
    );
    console.log(`📊 Total de times: ${teams.length}`);

    // LÓGICA DE SORTEIO PARA FASE DE GRUPOS (Copa do Mundo):
    // 1. Dividir times em POTES baseado em ranking/qualidade
    // 2. Sortear 1 time de cada pote para cada grupo
    // 3. Garantir distribuição equilibrada

    const groups: Group[] = [];
    const teamsPerGroup = Math.floor(teams.length / numberOfGroups);
    const remainingTeams = teams.length % numberOfGroups;

    console.log(
      `👥 Times por grupo: ${teamsPerGroup} (${remainingTeams} grupos terão 1 time extra)`
    );

    // Verificar se há ranking/pontuação dos times para criar potes
    const hasRanking = teams.some((team) => {
      // Buscar estatísticas dos times se existirem partidas jogadas
      return false; // Por enquanto, assume que não há ranking
    });

    if (hasRanking) {
      console.log("📊 Sorteio por potes baseado em ranking");
      // TODO: Implementar divisão por potes quando houver ranking
    } else {
      console.log("🎲 Sorteio aleatório para grupos (sem ranking)");

      // Criar grupos vazios
      for (let i = 0; i < numberOfGroups; i++) {
        groups.push({
          id: `grupo_${String.fromCharCode(65 + i)}`, // A, B, C, D...
          name: `Grupo ${String.fromCharCode(65 + i)}`,
          teamIds: [],
        });
      }

      // Embaralhar times para sorteio
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
      console.log(
        "🎯 Ordem do sorteio:",
        shuffledTeams.map((t) => t.name)
      );

      // Distribuir times pelos grupos de forma equilibrada
      shuffledTeams.forEach((team, index) => {
        const groupIndex = index % numberOfGroups;
        groups[groupIndex].teamIds.push(team.id);

        const groupLetter = String.fromCharCode(65 + groupIndex);
        console.log(`📋 ${team.name} → Grupo ${groupLetter}`);
      });
    }

    // Log final dos grupos
    console.log("\n🏆 === GRUPOS FINALIZADOS ===");
    groups.forEach((group) => {
      const teamNames = group.teamIds.map((teamId) => {
        const team = teams.find((t) => t.id === teamId);
        return team?.name || "Time não encontrado";
      });
      console.log(
        `${group.name}: ${teamNames.join(", ")} (${teamNames.length} times)`
      );
    });

    return groups;
  }

  // Gerar partidas para mata-mata DINÂMICO (apenas primeira fase)
  static generateKnockoutMatches(championship: Championship): Match[] {
    if (championship.type !== "mata_mata") {
      throw new Error("Este método é apenas para campeonatos mata-mata");
    }

    const allTeams = championship.teams;
    if (allTeams.length < 2) {
      throw new Error("É necessário pelo menos 2 times para mata-mata");
    }

    // FILTRAR APENAS TIMES ATIVOS (NÃO ELIMINADOS)
    const activeTeams = allTeams.filter((team) => !team.eliminated);
    console.log(`👥 Times totais: ${allTeams.length}`);
    console.log(`✅ Times ativos: ${activeTeams.length}`);

    // *** DEBUG: Listar status de todos os times ***
    console.log(`\n🔍 === STATUS DE TODOS OS TIMES ===`);
    allTeams.forEach((team) => {
      const status = team.eliminated
        ? `❌ ELIMINADO (rodada ${team.eliminatedInRound})`
        : `✅ ATIVO`;
      console.log(`   ${team.name}: ${status}`);
    });

    if (activeTeams.length < 2) {
      throw new Error("É necessário pelo menos 2 times ativos para mata-mata");
    }

    // Listar times eliminados (se houver)
    const eliminatedTeams = allTeams.filter((team) => team.eliminated);
    if (eliminatedTeams.length > 0) {
      console.log(`❌ Times já eliminados:`);
      eliminatedTeams.forEach((team) => {
        console.log(
          `   🚫 ${team.name} (eliminado na rodada ${
            team.eliminatedInRound || "?"
          })`
        );
      });
    }

    // VERIFICAR SE JÁ EXISTEM PARTIDAS DO MATA-MATA
    const existingMatches =
      championship.matches?.filter((m) => m.id.includes("knockout_")) || [];
    if (existingMatches.length > 0) {
      console.log(
        "⚠️ Mata-mata já iniciado. Use generateNextKnockoutRound() para próximas fases"
      );
      return [];
    }

    const matches: Match[] = [];
    let matchId = 0;
    const totalActiveTeams = activeTeams.length;

    console.log(`⚔️ === MATA-MATA DINÂMICO - PRIMEIRA FASE ===`);
    console.log(`👥 Participantes ativos: ${totalActiveTeams} times`);

    // LÓGICA DINÂMICA PARA MATA-MATA COM APENAS TIMES ATIVOS:
    // 1. Gerar APENAS a primeira fase
    // 2. Próximas fases serão geradas após os resultados
    // 3. Chaveamento baseado em classificação (se houver) ou sorteio
    // 4. APENAS times não eliminados participam

    let sortedTeams: any[] = [];
    const playedMatches =
      championship.matches?.filter(
        (m) => m.played && !m.id.includes("knockout_")
      ) || [];
    const hasRanking = playedMatches.length > 0;

    if (hasRanking) {
      // CHAVEAMENTO POR CLASSIFICAÇÃO (mata-mata após fase de grupos)
      console.log(
        "📊 Detectada classificação prévia - chaveamento por posições"
      );

      // Calcular estatísticas de cada time ATIVO baseado em partidas anteriores
      const teamStats = activeTeams.map((team) => {
        const stats = {
          teamId: team.id,
          teamName: team.name,
          team: team,
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };

        // Calcular estatísticas com base nas partidas jogadas
        playedMatches.forEach((match) => {
          const isHomeTeam = match.homeTeam === team.id;
          const isAwayTeam = match.awayTeam === team.id;

          if (isHomeTeam || isAwayTeam) {
            stats.matches++;

            const homeScore = match.homeScore || 0;
            const awayScore = match.awayScore || 0;

            if (isHomeTeam) {
              stats.goalsFor += homeScore;
              stats.goalsAgainst += awayScore;

              if (homeScore > awayScore) {
                stats.wins++;
                stats.points += 3;
              } else if (homeScore === awayScore) {
                stats.draws++;
                stats.points += 1;
              } else {
                stats.losses++;
              }
            } else {
              stats.goalsFor += awayScore;
              stats.goalsAgainst += homeScore;

              if (awayScore > homeScore) {
                stats.wins++;
                stats.points += 3;
              } else if (awayScore === homeScore) {
                stats.draws++;
                stats.points += 1;
              } else {
                stats.losses++;
              }
            }
          }
        });

        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
        return stats;
      });

      // Ordenar por classificação (melhor para pior)
      teamStats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      sortedTeams = teamStats.map((stats) => stats.team);

      console.log(
        "🏆 Classificação para mata-mata:",
        teamStats.map(
          (stats, i) => `${i + 1}º ${stats.teamName} (${stats.points} pts)`
        )
      );
    } else {
      // SORTEIO ALEATÓRIO (mata-mata direto, sem fase anterior) - APENAS TIMES ATIVOS
      console.log("🎲 Mata-mata direto - sorteio aleatório com times ativos");
      sortedTeams = [...activeTeams].sort(() => Math.random() - 0.5);
      console.log(
        "🎯 Ordem do sorteio (apenas ativos):",
        sortedTeams.map((t) => t.name)
      );
    }

    const isPowerOfTwo = (totalActiveTeams & (totalActiveTeams - 1)) === 0;

    console.log(`🔢 Times é potência de 2: ${isPowerOfTwo ? "Sim" : "Não"}`);

    if (isPowerOfTwo) {
      // Número perfeito - todos jogam na primeira fase
      console.log("✅ Torneio perfeito - todos jogam na primeira fase");

      if (hasRanking) {
        // Chaveamento cruzado: 1º vs último, 2º vs penúltimo
        console.log("🔄 Chaveamento cruzado (1º vs último)");

        for (let i = 0; i < totalActiveTeams / 2; i++) {
          const topTeam = sortedTeams[i];
          const bottomTeam = sortedTeams[totalActiveTeams - 1 - i];

          matches.push({
            id: `knockout_r1_${Date.now()}_${matchId++}`,
            homeTeam: topTeam.id,
            awayTeam: bottomTeam.id,
            played: false,
            homeGoalScorers: [],
            awayGoalScorers: [],
            round: 1,
            matchOrder: i + 1,
          });

          console.log(
            `⚔️ Confronto ${i + 1}: ${topTeam.name} vs ${bottomTeam.name}`
          );
        }
      } else {
        // Sorteio sequencial
        for (let i = 0; i < sortedTeams.length; i += 2) {
          if (i + 1 < sortedTeams.length) {
            matches.push({
              id: `knockout_r1_${Date.now()}_${matchId++}`,
              homeTeam: sortedTeams[i].id,
              awayTeam: sortedTeams[i + 1].id,
              played: false,
              homeGoalScorers: [],
              awayGoalScorers: [],
              round: 1,
              matchOrder: Math.floor(i / 2) + 1,
            });

            console.log(
              `⚔️ Confronto ${Math.floor(i / 2) + 1}: ${
                sortedTeams[i].name
              } vs ${sortedTeams[i + 1].name}`
            );
          }
        }
      }
    } else {
      // Número ímpar - alguns times passam direto
      const nextPowerOfTwo = Math.pow(
        2,
        Math.ceil(Math.log2(totalActiveTeams))
      );
      const teamsWithBye = nextPowerOfTwo - totalActiveTeams;
      const teamsInFirstRound = totalActiveTeams - teamsWithBye;

      console.log(`⚡ ${teamsWithBye} times passam direto`);
      console.log(`⚔️ ${teamsInFirstRound} times jogam na primeira fase`);

      if (hasRanking) {
        // Melhores classificados passam direto
        const byeTeams = sortedTeams.slice(0, teamsWithBye);
        const firstRoundTeams = sortedTeams.slice(teamsWithBye);

        console.log(
          "🎫 Passaram direto:",
          byeTeams.map((t) => t.name)
        );
        console.log(
          "⚔️ Primeira fase:",
          firstRoundTeams.map((t) => t.name)
        );

        // Gerar confrontos da primeira fase
        for (let i = 0; i < firstRoundTeams.length; i += 2) {
          if (i + 1 < firstRoundTeams.length) {
            matches.push({
              id: `knockout_r1_${Date.now()}_${matchId++}`,
              homeTeam: firstRoundTeams[i].id,
              awayTeam: firstRoundTeams[i + 1].id,
              played: false,
              homeGoalScorers: [],
              awayGoalScorers: [],
              round: 1,
              matchOrder: Math.floor(i / 2) + 1,
            });

            console.log(
              `⚔️ Confronto ${Math.floor(i / 2) + 1}: ${
                firstRoundTeams[i].name
              } vs ${firstRoundTeams[i + 1].name}`
            );
          }
        }
      } else {
        // Sorteio aleatório para primeira fase
        const byeTeams = sortedTeams.slice(0, teamsWithBye);
        const firstRoundTeams = sortedTeams.slice(teamsWithBye);

        console.log(
          "🎫 Passaram direto (sorteio):",
          byeTeams.map((t) => t.name)
        );
        console.log(
          "⚔️ Primeira fase (sorteio):",
          firstRoundTeams.map((t) => t.name)
        );

        for (let i = 0; i < firstRoundTeams.length; i += 2) {
          if (i + 1 < firstRoundTeams.length) {
            matches.push({
              id: `knockout_r1_${Date.now()}_${matchId++}`,
              homeTeam: firstRoundTeams[i].id,
              awayTeam: firstRoundTeams[i + 1].id,
              played: false,
              homeGoalScorers: [],
              awayGoalScorers: [],
              round: 1,
              matchOrder: Math.floor(i / 2) + 1,
            });

            console.log(
              `⚔️ Confronto ${Math.floor(i / 2) + 1}: ${
                firstRoundTeams[i].name
              } vs ${firstRoundTeams[i + 1].name}`
            );
          }
        }
      }
    }

    console.log(`\n🎉 PRIMEIRA FASE GERADA: ${matches.length} partidas`);
    console.log(`� Participantes: ${sortedTeams.length} times ATIVOS`);
    console.log(
      `🚫 Eliminados excluídos: ${allTeams.length - activeTeams.length}`
    );
    console.log(`�📋 Próximas fases serão geradas após os resultados`);
    console.log(
      `🏆 Chaveamento: ${hasRanking ? "Por classificação" : "Por sorteio"}`
    );

    return matches;
  }

  // Gerar próxima fase do mata-mata DINÂMICO após resultados
  static generateNextKnockoutRound(championship: Championship): Match[] {
    if (championship.type !== "mata_mata") {
      console.log("❌ Método apenas para mata-mata");
      return [];
    }

    const currentMatches = championship.matches || [];
    if (currentMatches.length === 0) {
      console.log("❌ Nenhuma partida encontrada");
      return [];
    }

    console.log(`\n⚔️ === GERANDO PRÓXIMA FASE DO MATA-MATA ===`);

    // Filtrar apenas partidas do mata-mata
    const knockoutMatches = currentMatches.filter((m) =>
      m.id.includes("knockout_")
    );

    if (knockoutMatches.length === 0) {
      console.log("❌ Nenhuma partida de mata-mata encontrada");
      return [];
    }

    // Encontrar a rodada atual mais alta do mata-mata
    const maxRound = Math.max(...knockoutMatches.map((m) => m.round || 1));
    console.log(`📊 Rodada atual do mata-mata: ${maxRound}`);

    // Verificar se todas as partidas da rodada atual foram jogadas
    const currentRoundMatches = knockoutMatches.filter(
      (m) => (m.round || 1) === maxRound
    );
    const unplayedMatches = currentRoundMatches.filter((m) => !m.played);

    console.log(
      `🎮 Partidas da rodada ${maxRound}: ${currentRoundMatches.length}`
    );
    console.log(`⏳ Partidas pendentes: ${unplayedMatches.length}`);

    if (unplayedMatches.length > 0) {
      console.log(
        `⚠️ Aguardando ${unplayedMatches.length} resultados da rodada ${maxRound}`
      );
      return [];
    }

    // Obter vencedores da rodada atual
    const winners: string[] = [];
    const eliminated: string[] = [];

    console.log(`\n🏆 === RESULTADOS DA RODADA ${maxRound} ===`);

    currentRoundMatches.forEach((match, index) => {
      if (match.played) {
        const homeGoals = match.homeScore || 0;
        const awayGoals = match.awayScore || 0;

        const homeTeam = championship.teams.find(
          (t) => t.id === match.homeTeam
        );
        const awayTeam = championship.teams.find(
          (t) => t.id === match.awayTeam
        );

        console.log(
          `📊 Jogo ${index + 1}: ${
            homeTeam?.name
          } ${homeGoals} x ${awayGoals} ${awayTeam?.name}`
        );

        if (homeGoals > awayGoals) {
          winners.push(match.homeTeam);
          eliminated.push(match.awayTeam);
          console.log(`✅ Classificado: ${homeTeam?.name}`);
          console.log(`❌ Eliminado: ${awayTeam?.name}`);
        } else if (awayGoals > homeGoals) {
          winners.push(match.awayTeam);
          eliminated.push(match.homeTeam);
          console.log(`✅ Classificado: ${awayTeam?.name}`);
          console.log(`❌ Eliminado: ${homeTeam?.name}`);
        } else {
          // Em caso de empate, decidir por sorteio (simular pênaltis)
          const isHomeWinner = Math.random() < 0.5;
          const winnerTeam = isHomeWinner ? match.homeTeam : match.awayTeam;
          const loserTeam = isHomeWinner ? match.awayTeam : match.homeTeam;
          const winnerName = isHomeWinner ? homeTeam?.name : awayTeam?.name;
          const loserName = isHomeWinner ? awayTeam?.name : homeTeam?.name;

          winners.push(winnerTeam);
          eliminated.push(loserTeam);
          console.log(`🎲 Empate - Pênaltis simulados:`);
          console.log(`✅ Classificado: ${winnerName}`);
          console.log(`❌ Eliminado: ${loserName}`);
        }
      }
    });

    // Verificar se há times que passaram direto (byes) da rodada anterior
    const allTeams = championship.teams;
    const teamsInCurrentRound = currentRoundMatches.flatMap((m) => [
      m.homeTeam,
      m.awayTeam,
    ]);

    // GARANTIR QUE APENAS TIMES NÃO ELIMINADOS POSSAM PARTICIPAR
    const teamsWithBye = allTeams
      .filter((team) => !teamsInCurrentRound.includes(team.id)) // Não jogaram nesta rodada
      .filter((team) => !team.eliminated) // NÃO estão eliminados
      .filter((team) => !eliminated.includes(team.id)) // NÃO foram eliminados agora
      .map((team) => team.id);

    if (teamsWithBye.length > 0) {
      console.log(
        `\n🎫 Times que passaram direto (verificação anti-eliminados):`
      );
      teamsWithBye.forEach((teamId) => {
        const team = allTeams.find((t) => t.id === teamId);
        console.log(`✅ ${team?.name} (bye - ativo)`);
        winners.push(teamId);
      });
    }

    // Marcar times eliminados
    eliminated.forEach((teamId) => {
      const team = championship.teams.find((t) => t.id === teamId);
      if (team) {
        team.eliminated = true;
        team.eliminatedInRound = maxRound;
        console.log(
          `❌ MARCANDO COMO ELIMINADO: ${team.name} (rodada ${maxRound})`
        );
      }
    });

    console.log(`\n📊 === SITUAÇÃO APÓS RODADA ${maxRound} ===`);
    console.log(`✅ Classificados: ${winners.length}`);
    console.log(`❌ Eliminados: ${eliminated.length}`);

    // Verificar se temos um campeão
    if (winners.length <= 1) {
      console.log(`\n🏆 === CAMPEONATO FINALIZADO ===`);
      if (winners.length === 1) {
        const champion = championship.teams.find((t) => t.id === winners[0]);
        console.log(`👑 CAMPEÃO: ${champion?.name}`);
      }
      return [];
    }

    // Verificar se precisamos incluir mais times (caso haja número ímpar)
    const totalActiveTeams = winners.length;
    const isPowerOfTwo = (totalActiveTeams & (totalActiveTeams - 1)) === 0;

    if (!isPowerOfTwo) {
      const nextPowerOfTwo = Math.pow(
        2,
        Math.floor(Math.log2(totalActiveTeams))
      );
      const teamsToPlay = nextPowerOfTwo;
      const newTeamsWithBye = totalActiveTeams - teamsToPlay;

      console.log(`\n⚡ Ajuste para próxima fase:`);
      console.log(`👥 Times ativos: ${totalActiveTeams}`);
      console.log(`⚔️ Times que jogam: ${teamsToPlay}`);
      console.log(`🎫 Times que passam direto: ${newTeamsWithBye}`);
    }

    // Gerar confrontos da próxima fase
    const nextMatches: Match[] = [];
    const nextRound = maxRound + 1;
    let matchId = Date.now();

    console.log(`\n⚔️ === GERANDO RODADA ${nextRound} ===`);

    // VERIFICAÇÃO DE SEGURANÇA: Remover qualquer time eliminado dos vencedores
    const activeWinners = winners.filter((winnerId) => {
      const team = championship.teams.find((t) => t.id === winnerId);
      if (team?.eliminated) {
        console.log(
          `🚫 ERRO DETECTADO: Time eliminado ${team.name} foi removido dos vencedores!`
        );
        return false;
      }
      return true;
    });

    console.log(`👥 Times ativos para próxima fase: ${activeWinners.length}`);
    activeWinners.forEach((winnerId) => {
      const team = championship.teams.find((t) => t.id === winnerId);
      console.log(`✅ ${team?.name} (ativo)`);
    });

    // Embaralhar vencedores ATIVOS para sorteio dos confrontos
    const shuffledWinners = [...activeWinners].sort(() => Math.random() - 0.5);

    // Gerar confrontos (par a par)
    for (let i = 0; i < shuffledWinners.length; i += 2) {
      if (i + 1 < shuffledWinners.length) {
        const team1Id = shuffledWinners[i];
        const team2Id = shuffledWinners[i + 1];

        const team1 = championship.teams.find((t) => t.id === team1Id);
        const team2 = championship.teams.find((t) => t.id === team2Id);

        nextMatches.push({
          id: `knockout_r${nextRound}_${matchId++}`,
          homeTeam: team1Id,
          awayTeam: team2Id,
          played: false,
          homeGoalScorers: [],
          awayGoalScorers: [],
          round: nextRound,
          matchOrder: Math.floor(i / 2) + 1,
        });

        console.log(
          `⚔️ Confronto ${Math.floor(i / 2) + 1}: ${team1?.name} vs ${
            team2?.name
          }`
        );
      }
    }

    // Se houver número ímpar, um time passa direto
    if (shuffledWinners.length % 2 === 1) {
      const byeTeam = championship.teams.find(
        (t) => t.id === shuffledWinners[shuffledWinners.length - 1]
      );
      console.log(`🎫 Passa direto para próxima fase: ${byeTeam?.name}`);
    }

    console.log(
      `\n🎉 RODADA ${nextRound} GERADA: ${nextMatches.length} partidas`
    );

    // Determinar nome da fase
    const remainingTeams = winners.length;
    let phaseName = `Rodada ${nextRound}`;

    if (remainingTeams <= 2) {
      phaseName = "FINAL";
    } else if (remainingTeams <= 4) {
      phaseName = "SEMIFINAL";
    } else if (remainingTeams <= 8) {
      phaseName = "QUARTAS DE FINAL";
    } else if (remainingTeams <= 16) {
      phaseName = "OITAVAS DE FINAL";
    }

    console.log(`🏆 Fase: ${phaseName}`);

    return nextMatches;
  }

  // Verificar se pode gerar próxima fase do mata-mata
  static canGenerateNextKnockoutRound(championship: Championship): boolean {
    if (championship.type !== "mata_mata") {
      return false;
    }

    const knockoutMatches =
      championship.matches?.filter((m) => m.id.includes("knockout_")) || [];
    if (knockoutMatches.length === 0) {
      return false;
    }

    // Encontrar a rodada atual mais alta
    const maxRound = Math.max(...knockoutMatches.map((m) => m.round || 1));
    const currentRoundMatches = knockoutMatches.filter(
      (m) => (m.round || 1) === maxRound
    );
    const unplayedMatches = currentRoundMatches.filter((m) => !m.played);

    // Pode gerar se todas as partidas da rodada atual foram jogadas
    return unplayedMatches.length === 0 && currentRoundMatches.length > 0;
  }

  // Verificar automaticamente se deve gerar próxima fase após registrar resultado
  static async checkAndGenerateNextKnockoutRound(
    championshipId: string
  ): Promise<void> {
    try {
      const championship = await this.getChampionshipById(championshipId);
      if (!championship || championship.type !== "mata_mata") {
        return;
      }

      console.log("🔍 Verificando se pode gerar próxima fase do mata-mata...");

      if (this.canGenerateNextKnockoutRound(championship)) {
        console.log("✅ Gerando próxima fase automaticamente...");

        const nextRoundMatches = this.generateNextKnockoutRound(championship);

        if (nextRoundMatches.length > 0) {
          // *** IMPORTANTE: SALVAR TIMES ELIMINADOS PRIMEIRO ***
          console.log(
            "💾 Salvando times eliminados antes de gerar próxima fase..."
          );
          await this.updateChampionship(championship);

          // Recarregar campeonato para garantir que mudanças foram salvas
          const reloadedChampionship = await this.getChampionshipById(
            championshipId
          );
          if (!reloadedChampionship) {
            throw new Error("Erro ao recarregar campeonato");
          }

          // Adicionar as novas partidas ao campeonato recarregado
          reloadedChampionship.matches = [
            ...(reloadedChampionship.matches || []),
            ...nextRoundMatches,
          ];

          // Salvar com as novas partidas
          await this.updateChampionship(reloadedChampionship);

          console.log(
            "✅ Próxima fase gerada automaticamente:",
            nextRoundMatches.length,
            "partidas!"
          );
        } else {
          console.log("Mata-mata finalizado - temos um campeão!");

          // Finalizar campeonato se não há mais fases
          championship.status = "finalizado";
          championship.finishedAt = new Date().toISOString();
          await this.updateChampionship(championship);
        }
      } else {
        console.log("Ainda aguardando resultados para gerar próxima fase");
      }
    } catch (error) {
      console.error("Erro ao verificar/gerar próxima fase:", error);
    }
  }

  // Criar grupos automaticamente
  static createGroupsAutomatically(
    teams: Team[],
    numberOfGroups: number = 2
  ): Group[] {
    if (teams.length < 4) {
      throw new Error("É necessário pelo menos 4 times para criar grupos");
    }

    if (numberOfGroups < 2) {
      numberOfGroups = 2;
    }

    // Garantir que cada grupo tenha pelo menos 2 times
    const maxGroups = Math.floor(teams.length / 2);
    if (numberOfGroups > maxGroups) {
      numberOfGroups = maxGroups;
    }

    const groups: Group[] = [];
    const teamsPerGroup = Math.floor(teams.length / numberOfGroups);
    const remainingTeams = teams.length % numberOfGroups;

    let teamIndex = 0;

    for (let i = 0; i < numberOfGroups; i++) {
      const groupTeams = teamsPerGroup + (i < remainingTeams ? 1 : 0);
      const group: Group = {
        id: `group_${i + 1}`,
        name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
        teamIds: [],
      };

      for (let j = 0; j < groupTeams; j++) {
        if (teamIndex < teams.length) {
          group.teamIds.push(teams[teamIndex].id);
          teamIndex++;
        }
      }

      groups.push(group);
    }

    return groups;
  }

  // Adicionar grupos ao campeonato
  static async addGroupsToChampionship(
    championshipId: string,
    groups: Group[]
  ): Promise<void> {
    const championship = await this.getChampionshipById(championshipId);
    if (!championship) throw new Error("Campeonato não encontrado");

    if (championship.type !== "grupos") {
      throw new Error(
        "Apenas campeonatos do tipo 'grupos' podem ter grupos definidos"
      );
    }

    championship.groups = groups;
    await this.updateChampionship(championship);
  }

  // Gerar partidas para fase de grupos
  static generateGroupStageMatches(championship: Championship): Match[] {
    if (!championship.groups || championship.groups.length === 0) {
      throw new Error("Campeonato não possui grupos definidos");
    }

    const matches: Match[] = [];
    let matchId = 0;
    const hasReturnMatches = championship.groupStageSettings?.hasReturnMatches ?? true; // Padrão: ida e volta

    console.log(`🏆 Gerando partidas da fase de grupos (${hasReturnMatches ? 'ida e volta' : 'apenas ida'})`);

    championship.groups.forEach((group, groupIndex) => {
      if (group.teamIds.length < 2) {
        console.warn(`Grupo ${group.name} tem menos de 2 times, ignorando`);
        return;
      }

      // Gerar confrontos dentro do grupo (todos contra todos)
      for (let i = 0; i < group.teamIds.length; i++) {
        for (let j = i + 1; j < group.teamIds.length; j++) {
          const homeTeam = group.teamIds[i];
          const awayTeam = group.teamIds[j];

          // Ida (sempre gera)
          matches.push({
            id: `group_${Date.now()}_${matchId++}`,
            homeTeam,
            awayTeam,
            played: false,
            homeGoalScorers: [],
            awayGoalScorers: [],
            round: 1, // Fase de grupos é considerada rodada 1
            matchOrder: matchId,
          });

          // Volta (apenas se configurado)
          if (hasReturnMatches) {
            matches.push({
              id: `group_${Date.now()}_${matchId++}`,
              homeTeam: awayTeam,
              awayTeam: homeTeam,
              played: false,
              homeGoalScorers: [],
              awayGoalScorers: [],
              round: 2, // Segunda rodada (volta)
              matchOrder: matchId,
            });
          }
        }
      }
    });

    console.log(`✅ ${matches.length} partidas geradas para a fase de grupos`);
    return matches;
  }

  // Obter classificação por grupos
  static getGroupStandings(championship: Championship): {
    [groupId: string]: {
      group: Group;
      standings: Array<{
        teamId: string;
        matches: number;
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDifference: number;
        points: number;
      }>;
    };
  } {
    if (!championship.groups) {
      return {};
    }

    const groupStandings: { [groupId: string]: any } = {};

    championship.groups.forEach((group) => {
      const standings = group.teamIds.map((teamId) => {
        const teamStats = {
          teamId,
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };

        // Calcular estatísticas apenas para partidas dentro do grupo
        championship.matches
          .filter((match) => match.played)
          .forEach((match) => {
            const isHomeTeam = match.homeTeam === teamId;
            const isAwayTeam = match.awayTeam === teamId;

            // Verificar se ambos os times estão no mesmo grupo
            const bothInGroup =
              group.teamIds.includes(match.homeTeam) &&
              group.teamIds.includes(match.awayTeam);

            if ((isHomeTeam || isAwayTeam) && bothInGroup) {
              teamStats.matches++;

              const homeScore = match.homeScore || 0;
              const awayScore = match.awayScore || 0;

              if (isHomeTeam) {
                teamStats.goalsFor += homeScore;
                teamStats.goalsAgainst += awayScore;

                if (homeScore > awayScore) {
                  teamStats.wins++;
                  teamStats.points += 3;
                } else if (homeScore === awayScore) {
                  teamStats.draws++;
                  teamStats.points += 1;
                } else {
                  teamStats.losses++;
                }
              } else {
                teamStats.goalsFor += awayScore;
                teamStats.goalsAgainst += homeScore;

                if (awayScore > homeScore) {
                  teamStats.wins++;
                  teamStats.points += 3;
                } else if (awayScore === homeScore) {
                  teamStats.draws++;
                  teamStats.points += 1;
                } else {
                  teamStats.losses++;
                }
              }
            }
          });

        teamStats.goalDifference = teamStats.goalsFor - teamStats.goalsAgainst;
        return teamStats;
      });

      // Ordenar por pontos, depois saldo de gols, depois gols pró
      standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference)
          return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      groupStandings[group.id] = {
        group,
        standings,
      };
    });

    return groupStandings;
  }

  // ==================== MÉTODOS PARA MATA-MATA ====================

  // Calcular eliminações em campeonatos mata-mata
  static calculateKnockoutEliminations(championship: Championship): void {
    if (championship.type !== "mata_mata") {
      return;
    }

    // Resetar status de eliminação
    championship.teams.forEach((team) => {
      team.eliminated = false;
      team.eliminatedInRound = undefined;
    });

    // Agrupar partidas por rodada
    const matchesByRound: { [round: number]: Match[] } = {};
    championship.matches
      .filter((match) => match.played)
      .forEach((match) => {
        const round = match.round || 1;
        if (!matchesByRound[round]) {
          matchesByRound[round] = [];
        }
        matchesByRound[round].push(match);
      });

    // Processar cada rodada em ordem
    const rounds = Object.keys(matchesByRound)
      .map((r) => parseInt(r))
      .sort((a, b) => a - b);

    rounds.forEach((roundNumber) => {
      const roundMatches = matchesByRound[roundNumber];

      roundMatches.forEach((match) => {
        const homeScore = match.homeScore || 0;
        const awayScore = match.awayScore || 0;

        if (homeScore !== awayScore) {
          // Não há empate processado
          const homeTeam = championship.teams.find(
            (t) => t.id === match.homeTeam
          );
          const awayTeam = championship.teams.find(
            (t) => t.id === match.awayTeam
          );

          if (homeTeam && awayTeam) {
            if (homeScore > awayScore) {
              // Time visitante é eliminado
              awayTeam.eliminated = true;
              awayTeam.eliminatedInRound = roundNumber;
            } else {
              // Time da casa é eliminado
              homeTeam.eliminated = true;
              homeTeam.eliminatedInRound = roundNumber;
            }
          }
        }
        // Em caso de empate, ambos continuam (precisa de critério de desempate)
      });
    });
  }

  // Obter times ainda na competição (mata-mata)
  static getActiveTeams(championship: Championship): Team[] {
    if (championship.type !== "mata_mata") {
      return championship.teams;
    }

    this.calculateKnockoutEliminations(championship);
    return championship.teams.filter((team) => !team.eliminated);
  }

  // Obter times eliminados (mata-mata)
  static getEliminatedTeams(championship: Championship): Team[] {
    if (championship.type !== "mata_mata") {
      return [];
    }

    this.calculateKnockoutEliminations(championship);
    return championship.teams.filter((team) => team.eliminated);
  }

  // Obter estatísticas para mata-mata
  static getKnockoutStats(championship: Championship): {
    activeTeams: Team[];
    eliminatedTeams: Array<Team & { eliminatedInRound: number }>;
    totalMatches: number;
    playedMatches: number;
    remainingMatches: number;
  } {
    this.calculateKnockoutEliminations(championship);

    const activeTeams = this.getActiveTeams(championship);
    const eliminatedTeams = this.getEliminatedTeams(championship).map(
      (team) => ({
        ...team,
        eliminatedInRound: team.eliminatedInRound || 0,
      })
    );

    const totalMatches = championship.matches.length;
    const playedMatches = championship.matches.filter((m) => m.played).length;
    const remainingMatches = totalMatches - playedMatches;

    return {
      activeTeams,
      eliminatedTeams,
      totalMatches,
      playedMatches,
      remainingMatches,
    };
  }

  // Verificar se uma partida pertence à fase de grupos
  static isGroupStageMatch(match: Match, groups: Group[]): boolean {
    for (const group of groups) {
      if (
        group.teamIds.includes(match.homeTeam) &&
        group.teamIds.includes(match.awayTeam)
      ) {
        return true;
      }
    }
    return false;
  }

  // Verificar se a fase de grupos foi completada
  static isGroupStageCompleted(championship: Championship): boolean {
    if (!championship.groups || championship.groups.length === 0) {
      return false;
    }

    // Verificar se todas as partidas da fase de grupos foram jogadas
    for (const group of championship.groups) {
      const groupMatches = championship.matches.filter((match) =>
        this.isGroupStageMatch(match, [group])
      );

      // Calcular quantas partidas deveriam existir no grupo
      const hasReturnMatches = championship.groupStageSettings?.hasReturnMatches ?? true;
      const expectedMatches = this.calculateExpectedGroupMatches(
        group.teamIds.length,
        hasReturnMatches
      );

      // Verificar se todas as partidas esperadas foram jogadas
      const playedMatches = groupMatches.filter((match) => match.played);

      if (playedMatches.length < expectedMatches) {
        return false;
      }
    }

    return true;
  }

  // Calcular o número esperado de partidas em um grupo
  static calculateExpectedGroupMatches(teamCount: number, hasReturnMatches: boolean = true): number {
    if (hasReturnMatches) {
      // Fórmula para todos contra todos (ida e volta): n * (n - 1)
      return teamCount * (teamCount - 1);
    } else {
      // Fórmula para todos contra todos (apenas ida): n * (n - 1) / 2
      return (teamCount * (teamCount - 1)) / 2;
    }
  }

  // Gerar mata-mata a partir dos grupos
  static generateKnockoutFromGroups(championship: Championship): Match[] {
    if (!championship.groups || championship.groups.length === 0) {
      throw new Error("Não há grupos definidos para gerar o mata-mata");
    }

    console.log("🏆 Obtendo classificados de cada grupo...");

    // Obter classificação dos grupos
    const groupStandings = this.getGroupStandings(championship);
    const qualifiedTeams: string[] = [];

    // Pegar APENAS o vencedor de cada grupo (1º colocado)
    const teamsPerGroup = 1; // Apenas o campeão de cada grupo

    Object.values(groupStandings).forEach(({ standings, group }) => {
      // Ordenar por pontos, depois por saldo de gols
      const sortedStandings = standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
      });

      // Pegar APENAS o 1º colocado (vencedor do grupo)
      if (sortedStandings.length > 0) {
        const winner = sortedStandings[0];
        qualifiedTeams.push(winner.teamId);
        console.log(`🏆 Vencedor do ${group.name}: Time ${winner.teamId} (${winner.points} pts)`);
      }
    });

    console.log(
      `✅ ${qualifiedTeams.length} times classificados:`,
      qualifiedTeams
    );

    // Filtrar apenas os times classificados
    const qualifiedTeamsData = championship.teams.filter((team) =>
      qualifiedTeams.includes(team.id)
    );

    // Gerar partidas do mata-mata diretamente
    return this.generateKnockoutMatchesFromTeams(qualifiedTeamsData, championship.id);
  }

  // Método específico para gerar mata-mata a partir de uma lista de times
  static generateKnockoutMatchesFromTeams(teams: Team[], championshipId: string): Match[] {
    if (teams.length < 2) {
      throw new Error("É necessário pelo menos 2 times para mata-mata");
    }

    const matches: Match[] = [];
    let matchId = 0;
    const totalTeams = teams.length;

    console.log(`⚔️ === MATA-MATA A PARTIR DOS GRUPOS ===`);
    console.log(`👥 Times classificados: ${totalTeams}`);

    // Embaralhar os times para criar um chaveamento aleatório
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    // Gerar primeira fase do mata-mata
    const pairsCount = Math.floor(shuffledTeams.length / 2);
    
    for (let i = 0; i < pairsCount; i++) {
      const homeTeam = shuffledTeams[i * 2];
      const awayTeam = shuffledTeams[i * 2 + 1];

      const match: Match = {
        id: `knockout_${championshipId}_${matchId++}`,
        homeTeam: homeTeam.id,
        awayTeam: awayTeam.id,
        homeScore: 0,
        awayScore: 0,
        played: false,
        round: 1,
        homeGoalScorers: [],
        awayGoalScorers: [],
        isKnockout: true,
        knockoutRound: 1,
      };

      matches.push(match);
      console.log(`🥊 Confronto ${i + 1}: ${homeTeam.name} vs ${awayTeam.name}`);
    }

    // Se houver um time ímpar, ele passa automaticamente
    if (shuffledTeams.length % 2 === 1) {
      const byeTeam = shuffledTeams[shuffledTeams.length - 1];
      console.log(`🎯 ${byeTeam.name} passa automaticamente para a próxima fase`);
    }

    console.log(`✅ ${matches.length} partidas de mata-mata geradas!`);
    return matches;
  }

  // Resetar sorteios (limpar grupos e partidas)
  static async resetGroupDraws(championshipId: string): Promise<void> {
    try {
      const championship = await this.getChampionshipById(championshipId);
      if (!championship) {
        throw new Error("Campeonato não encontrado");
      }

      if (championship.type !== "grupos") {
        throw new Error("Esta função só é válida para campeonatos por grupos");
      }

      console.log("🔄 Resetando sorteios do campeonato:", championship.name);

      // Limpar grupos
      championship.groups = [];

      // Limpar todas as partidas
      championship.matches = [];

      // Resetar fase para grupos
      championship.currentPhase = "grupos";

      // Resetar status para criado
      championship.status = "criado";

      console.log("✅ Sorteios resetados - grupos e partidas removidos");

      // Salvar no Firebase
      await this.updateChampionship(championship);

      console.log("💾 Campeonato atualizado no Firebase");
    } catch (error) {
      console.error("❌ Erro ao resetar sorteios:", error);
      throw error;
    }
  }

  // Limpar todos os resultados das partidas
  static async clearAllMatchResults(championshipId: string): Promise<void> {
    try {
      const championship = await this.getChampionshipById(championshipId);
      if (!championship) {
        throw new Error("Campeonato não encontrado");
      }

      console.log("🧹 Limpando resultados das partidas...");

      // Limpar resultados de todas as partidas
      if (championship.matches) {
        championship.matches = championship.matches.map((match) => ({
          ...match,
          played: false,
          homeScore: undefined,
          awayScore: undefined,
          homeGoalScorers: [],
          awayGoalScorers: [],
          winner: undefined,
          // Manter campos básicos da partida
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          round: match.round,
          matchOrder: match.matchOrder,
          date: match.date,
        }));
      }

      // Limpar estatísticas dos times (se existirem)
      if (championship.teams) {
        championship.teams = championship.teams.map((team) => ({
          ...team,
          // Resetar estatísticas dos times
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          // Para mata-mata: limpar status de eliminação
          eliminated: false,
          eliminatedInRound: undefined,
        }));
      }

      // Resetar status do campeonato
      championship.status = "em_andamento";
      championship.finishedAt = undefined;

      await this.updateChampionship(championship);
      console.log("✅ Resultados limpos com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao limpar resultados:", error);
      throw error;
    }
  }
}
