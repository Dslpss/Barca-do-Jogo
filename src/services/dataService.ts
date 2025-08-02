import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";
import { User } from "firebase/auth";

// Tipos de dados
export interface Player {
  id?: string;
  name: string;
  cpf?: string;
  skill: number;
  position: string;
  yellowCards: number;
  redCards: number;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Team {
  id?: string;
  name: string;
  color: string;
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface GameResult {
  id?: string;
  timeA: string;
  timeB: string;
  placarA: number;
  placarB: number;
  data: string;
  goleadoresA?: string[];
  goleadoresB?: string[];
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface SavedDistribution {
  id?: string;
  name: string;
  date: string;
  distribution: { [key: string]: Player[] };
  teams: Team[];
  userId?: string;
  createdAt?: any;
  updatedAt?: any;
}

class DataService {
  private user: User | null = null;
  private isLoadingTeams = false;

  constructor() {
    // Escutar mudanças de autenticação
    auth.onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        this.syncAllData();
      }
    });
  }

  private getUserId(): string | null {
    return this.user?.uid || null;
  }

  private async isOnline(): Promise<boolean> {
    try {
      // Tentar fazer uma operação simples no Firestore para verificar conectividade
      const testDoc = doc(db, "test", "connectivity");
      await getDoc(testDoc);
      return true;
    } catch (error) {
      return false;
    }
  }

  // PLAYERS
  async getPlayers(): Promise<Player[]> {
    try {
      // Primeiro, tentar buscar do cache local
      const localData = await AsyncStorage.getItem("players");
      let players: Player[] = localData ? JSON.parse(localData) : [];

      // Se estiver online e autenticado, buscar do Firebase
      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          const playersRef = collection(db, "players");
          const q = query(
            playersRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);

          const firebasePlayers: Player[] = [];
          snapshot.forEach((doc) => {
            firebasePlayers.push({ id: doc.id, ...doc.data() } as Player);
          });

          // Sempre usar os dados do Firebase como a fonte da verdade quando online
          players = firebasePlayers;
          await AsyncStorage.setItem("players", JSON.stringify(players));
        } catch (error) {
          console.log(
            "Erro ao buscar jogadores do Firebase, usando cache local:",
            error
          );
        }
      }

      return players;
    } catch (error) {
      console.error("Erro ao buscar jogadores:", error);
      return [];
    }
  }

  async savePlayers(players: Player[]): Promise<void> {
    try {
      // Salvar localmente primeiro
      await AsyncStorage.setItem("players", JSON.stringify(players));

      // Se estiver online e autenticado, salvar no Firebase
      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          for (const player of players) {
            const playerData = {
              ...player,
              userId,
              updatedAt: serverTimestamp(),
              createdAt: player.createdAt || serverTimestamp(),
            };

            // Verificar se o player já existe no Firebase
            if (player.id && player.id.includes("-")) {
              // ID do Firebase - usar setDoc com merge para atualizar ou criar
              const playerRef = doc(db, "players", player.id);
              await setDoc(playerRef, playerData, { merge: true });
            } else {
              // ID local - verificar se já foi sincronizado antes
              const playersRef = collection(db, "players");
              const q = query(
                playersRef,
                where("userId", "==", userId),
                where("name", "==", player.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                // Jogador já existe no Firebase, atualizar
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, playerData);
                player.id = existingDoc.id;
              } else {
                // Criar novo jogador
                const newPlayerRef = doc(collection(db, "players"));
                await setDoc(newPlayerRef, playerData);
                player.id = newPlayerRef.id;
              }
            }
          }

          // Atualizar o cache local com os novos IDs do Firebase
          await AsyncStorage.setItem("players", JSON.stringify(players));
        } catch (error) {
          console.log(
            "Erro ao salvar jogadores no Firebase, dados salvos localmente:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Erro ao salvar jogadores:", error);
    }
  }

  // TEAMS
  async getTeams(): Promise<Team[]> {
    // Evitar múltiplas chamadas simultâneas
    if (this.isLoadingTeams) {
      console.log("Já carregando times, aguardando...");
      // Aguardar um pouco e tentar novamente
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.isLoadingTeams) {
        const localData = await AsyncStorage.getItem("teams");
        return localData ? JSON.parse(localData) : [];
      }
    }

    this.isLoadingTeams = true;

    try {
      const localData = await AsyncStorage.getItem("teams");
      let teams: Team[] = localData ? JSON.parse(localData) : [];

      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          console.log("Buscando times do Firebase...");
          const teamsRef = collection(db, "teams");
          const q = query(
            teamsRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);

          const firebaseTeams: Team[] = [];
          snapshot.forEach((doc) => {
            const teamData = { id: doc.id, ...doc.data() } as Team;
            firebaseTeams.push(teamData);
            console.log(
              `Time do Firebase: ${teamData.name} (ID: ${teamData.id})`
            );
          });

          console.log(`Encontrados ${firebaseTeams.length} times no Firebase`);

          // Usar os times do Firebase como fonte da verdade quando online
          teams = firebaseTeams;

          await AsyncStorage.setItem("teams", JSON.stringify(teams));
          console.log(
            `${teams.length} times salvos no AsyncStorage após sincronização`
          );
        } catch (error) {
          console.log(
            "Erro ao buscar times do Firebase, usando cache local:",
            error
          );
        }
      }

      return teams;
    } catch (error) {
      console.error("Erro ao buscar times:", error);
      return [];
    } finally {
      this.isLoadingTeams = false;
    }
  }

  async saveTeams(teams: Team[]): Promise<void> {
    try {
      await AsyncStorage.setItem("teams", JSON.stringify(teams));

      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          for (const team of teams) {
            const teamData = {
              ...team,
              userId,
              updatedAt: serverTimestamp(),
              createdAt: team.createdAt || serverTimestamp(),
            };

            // Verificar se o time já existe no Firebase
            let teamExists = false;

            // Primeiro, tentar encontrar por ID se ele existe
            if (team.id) {
              try {
                const teamRef = doc(db, "teams", team.id);
                const teamDoc = await getDoc(teamRef);

                if (teamDoc.exists()) {
                  // Time já existe no Firebase com este ID, atualizar
                  console.log(
                    `Atualizando time existente: ${team.name} (ID: ${team.id})`
                  );
                  await updateDoc(teamRef, teamData);
                  teamExists = true;
                }
              } catch (error) {
                console.log(
                  `ID ${team.id} não é válido no Firebase, tratando como ID local`
                );
              }
            }

            // Se não encontrou pelo ID, buscar por nome e userId
            if (!teamExists) {
              const teamsRef = collection(db, "teams");
              const q = query(
                teamsRef,
                where("userId", "==", userId),
                where("name", "==", team.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                // Time já existe no Firebase com outro ID, atualizar e corrigir o ID local
                const existingDoc = snapshot.docs[0];
                console.log(
                  `Time encontrado no Firebase com ID diferente: ${team.name} (Firebase ID: ${existingDoc.id}, Local ID: ${team.id})`
                );
                await updateDoc(existingDoc.ref, teamData);
                team.id = existingDoc.id; // Atualizar com o ID correto do Firebase
              } else {
                // Criar novo time no Firebase
                console.log(`Criando novo time no Firebase: ${team.name}`);
                const newTeamRef = doc(collection(db, "teams"));
                await setDoc(newTeamRef, teamData);
                team.id = newTeamRef.id; // Atualizar com o ID gerado pelo Firebase
                console.log(`Time criado com ID: ${team.id}`);
              }
            }
          }

          // Atualizar o cache local com os IDs corretos do Firebase
          await AsyncStorage.setItem("teams", JSON.stringify(teams));
          console.log(`Times salvos com IDs corretos do Firebase`);
        } catch (error) {
          console.log(
            "Erro ao salvar times no Firebase, dados salvos localmente:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Erro ao salvar times:", error);
    }
  }

  // GAME RESULTS
  async getGameResults(): Promise<GameResult[]> {
    try {
      const localData = await AsyncStorage.getItem("resultados_jogos");
      let results: GameResult[] = localData ? JSON.parse(localData) : [];

      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          const resultsRef = collection(db, "gameResults");
          const q = query(
            resultsRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);

          const firebaseResults: GameResult[] = [];
          snapshot.forEach((doc) => {
            firebaseResults.push({ id: doc.id, ...doc.data() } as GameResult);
          });

          results = firebaseResults;
          await AsyncStorage.setItem(
            "resultados_jogos",
            JSON.stringify(results)
          );
        } catch (error) {
          console.log(
            "Erro ao buscar resultados do Firebase, usando cache local:",
            error
          );
        }
      }

      return results;
    } catch (error) {
      console.error("Erro ao buscar resultados:", error);
      return [];
    }
  }

  async saveGameResults(results: GameResult[]): Promise<void> {
    try {
      await AsyncStorage.setItem("resultados_jogos", JSON.stringify(results));

      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          for (const result of results) {
            const resultData = {
              ...result,
              userId,
              updatedAt: serverTimestamp(),
              createdAt: result.createdAt || serverTimestamp(),
            };

            // Verificar se o result já existe no Firebase
            if (result.id && result.id.includes("-")) {
              // ID do Firebase - usar setDoc com merge para atualizar ou criar
              const resultRef = doc(db, "gameResults", result.id);
              await setDoc(resultRef, resultData, { merge: true });
            } else {
              // ID local - verificar se já foi sincronizado antes
              const resultsRef = collection(db, "gameResults");
              const q = query(
                resultsRef,
                where("userId", "==", userId),
                where("timeA", "==", result.timeA),
                where("timeB", "==", result.timeB),
                where("data", "==", result.data)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                // Resultado já existe no Firebase, atualizar
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, resultData);
                result.id = existingDoc.id;
              } else {
                // Criar novo resultado
                const newResultRef = doc(collection(db, "gameResults"));
                await setDoc(newResultRef, resultData);
                result.id = newResultRef.id;
              }
            }
          }

          // Atualizar o cache local com os novos IDs do Firebase
          await AsyncStorage.setItem(
            "resultados_jogos",
            JSON.stringify(results)
          );
        } catch (error) {
          console.log(
            "Erro ao salvar resultados no Firebase, dados salvos localmente:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Erro ao salvar resultados:", error);
    }
  }

  // SAVED DISTRIBUTIONS
  async getSavedDistributions(): Promise<SavedDistribution[]> {
    try {
      const localData = await AsyncStorage.getItem("savedDistributions");
      let distributions: SavedDistribution[] = localData
        ? JSON.parse(localData)
        : [];

      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          const distributionsRef = collection(db, "savedDistributions");
          const q = query(
            distributionsRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);

          const firebaseDistributions: SavedDistribution[] = [];
          snapshot.forEach((doc) => {
            firebaseDistributions.push({
              id: doc.id,
              ...doc.data(),
            } as SavedDistribution);
          });

          distributions = firebaseDistributions;
          await AsyncStorage.setItem(
            "savedDistributions",
            JSON.stringify(distributions)
          );
        } catch (error) {
          console.log(
            "Erro ao buscar distribuições do Firebase, usando cache local:",
            error
          );
        }
      }

      return distributions;
    } catch (error) {
      console.error("Erro ao buscar distribuições:", error);
      return [];
    }
  }

  async saveSavedDistributions(
    distributions: SavedDistribution[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "savedDistributions",
        JSON.stringify(distributions)
      );

      const userId = this.getUserId();
      if (userId && (await this.isOnline())) {
        try {
          for (const distribution of distributions) {
            const distributionData = {
              ...distribution,
              userId,
              updatedAt: serverTimestamp(),
              createdAt: distribution.createdAt || serverTimestamp(),
            };

            // Verificar se a distribution já existe no Firebase
            if (distribution.id && distribution.id.includes("-")) {
              // ID do Firebase - usar setDoc com merge para atualizar ou criar
              const distributionRef = doc(
                db,
                "savedDistributions",
                distribution.id
              );
              await setDoc(distributionRef, distributionData, { merge: true });
            } else {
              // ID local - verificar se já foi sincronizado antes
              const distributionsRef = collection(db, "savedDistributions");
              const q = query(
                distributionsRef,
                where("userId", "==", userId),
                where("name", "==", distribution.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                // Distribuição já existe no Firebase, atualizar
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, distributionData);
                distribution.id = existingDoc.id;
              } else {
                // Criar nova distribuição
                const newDistributionRef = doc(
                  collection(db, "savedDistributions")
                );
                await setDoc(newDistributionRef, distributionData);
                distribution.id = newDistributionRef.id;
              }
            }
          }

          // Atualizar o cache local com os novos IDs do Firebase
          await AsyncStorage.setItem(
            "savedDistributions",
            JSON.stringify(distributions)
          );
        } catch (error) {
          console.log(
            "Erro ao salvar distribuições no Firebase, dados salvos localmente:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Erro ao salvar distribuições:", error);
    }
  }

  // SYNC ALL DATA
  async syncAllData(): Promise<void> {
    try {
      console.log("Iniciando sincronização de dados...");

      // Sincronizar todos os tipos de dados
      await Promise.all([
        this.getPlayers(),
        this.getTeams(),
        this.getGameResults(),
        this.getSavedDistributions(),
      ]);

      console.log("Sincronização de dados concluída!");
    } catch (error) {
      console.error("Erro na sincronização de dados:", error);
    }
  }

  // DELETE METHODS
  async deletePlayer(playerId: string): Promise<void> {
    console.log(`Excluindo jogador com ID: ${playerId}`);
    
    const userId = this.getUserId();
    
    // Remover do Firebase se online e autenticado
    if (userId && (await this.isOnline())) {
      try {
        console.log(`Verificando se o jogador existe no Firebase...`);
        
        // Primeiro, tentar excluir diretamente usando o ID fornecido
        const playerRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerRef);
        
        if (playerDoc.exists()) {
          const playerData = playerDoc.data();
          console.log(`Jogador encontrado no Firebase:`, playerData);
          
          if (playerData.userId === userId) {
            console.log(`Excluindo jogador do Firebase com ID: ${playerId}`);
            await deleteDoc(playerRef);
            console.log(`Jogador excluído com sucesso do Firebase`);
            
            // Verificar se realmente foi excluído
            const confirmDelete = await getDoc(playerRef);
            if (!confirmDelete.exists()) {
              console.log(`Confirmado: Jogador foi excluído do Firebase`);
            } else {
              console.log(`ERRO: Jogador ainda existe no Firebase após exclusão!`);
            }
          } else {
            console.log(`ERRO: Jogador não pertence ao usuário atual`);
          }
        } else {
          console.log(`Jogador com ID ${playerId} não encontrado no Firebase`);
          
          // Se não encontrou pelo ID direto, buscar por query
          console.log(`Buscando jogador por query no Firebase...`);
          const playersRef = collection(db, "players");
          const q = query(playersRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);
          
          let playerFound = false;
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (doc.id === playerId || String(data.id) === String(playerId)) {
              console.log(`Excluindo jogador encontrado por query: ${data.name}`);
              deleteDoc(doc.ref);
              playerFound = true;
            }
          });
          
          if (!playerFound) {
            console.log(`Nenhum jogador correspondente encontrado no Firebase`);
          }
        }
      } catch (error: any) {
        console.log(`Erro ao deletar jogador do Firebase: ${error?.message || "Erro desconhecido"}`);
      }
    } else {
      console.log(`Usuário não autenticado ou offline, não é possível excluir do Firebase`);
    }
    
    // Remover do AsyncStorage local
    try {
      const localData = await AsyncStorage.getItem("players");
      let players: Player[] = localData ? JSON.parse(localData) : [];
      const playerBeforeDelete = players.find((p) => p.id === playerId);
      
      if (playerBeforeDelete) {
        console.log(`Jogador encontrado no AsyncStorage: ${playerBeforeDelete.name}`);
      } else {
        console.log(`Jogador com ID ${playerId} não encontrado no AsyncStorage`);
      }
      
      players = players.filter((p) => p.id !== playerId);
      await AsyncStorage.setItem("players", JSON.stringify(players));
      console.log(`Jogador removido do AsyncStorage, restando ${players.length} jogadores`);
    } catch (error) {
      console.log("Erro ao remover jogador do AsyncStorage:", error);
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    console.log(`Excluindo time com ID: ${teamId}`);

    // Verificar se o usuário está autenticado
    const userId = this.getUserId();
    console.log(
      `Usuário autenticado: ${userId ? "Sim" : "Não"} (ID: ${userId})`
    );

    // Remover do Firebase primeiro se online
    if (userId && (await this.isOnline())) {
      try {
        console.log(`Verificando se o time existe no Firebase...`);

        // Primeiro, tentar excluir diretamente usando o ID fornecido
        const teamRef = doc(db, "teams", teamId);
        const teamDoc = await getDoc(teamRef);

        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          console.log(`Time encontrado no Firebase:`, teamData);
          console.log(
            `UserId do time: ${teamData.userId}, UserId atual: ${userId}`
          );

          if (teamData.userId === userId) {
            console.log(`Excluindo time do Firebase com ID: ${teamId}`);
            await deleteDoc(teamRef);
            console.log(`Time excluído com sucesso do Firebase`);

            // Verificar se realmente foi excluído
            const confirmDelete = await getDoc(teamRef);
            if (!confirmDelete.exists()) {
              console.log(`Confirmado: Time foi excluído do Firebase`);
            } else {
              console.log(`ERRO: Time ainda existe no Firebase após exclusão!`);
            }
          } else {
            console.log(
              `ERRO: Time não pertence ao usuário atual. UserId do time: ${teamData.userId}, UserId atual: ${userId}`
            );
          }
        } else {
          console.log(`Time com ID ${teamId} não encontrado no Firebase`);

          // Se não encontrou pelo ID direto, vamos buscar por query para encontrar o time correto
          console.log(`Buscando time por query no Firebase...`);
          const teamsRef = collection(db, "teams");
          const q = query(teamsRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);

          console.log(
            `Encontrados ${snapshot.docs.length} times do usuário no Firebase`
          );

          // Verificar se algum dos times tem o mesmo ID ou nome
          let teamFound = false;
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`Time encontrado: ${data.name} (ID: ${doc.id})`);

            // Se encontrou um time com o mesmo ID local, excluir
            if (doc.id === teamId || String(data.id) === String(teamId)) {
              console.log(`Excluindo time encontrado por query: ${data.name}`);
              deleteDoc(doc.ref);
              teamFound = true;
            }
          });

          if (!teamFound) {
            console.log(`Nenhum time correspondente encontrado no Firebase`);
          }
        }
      } catch (error: any) {
        console.log(
          `Erro ao deletar time do Firebase: ${
            error?.message || "Erro desconhecido"
          }`
        );
        console.log(`Detalhes do erro:`, error);
      }
    } else {
      if (!userId) {
        console.log(
          `Usuário não autenticado, não é possível excluir do Firebase`
        );
      } else {
        console.log(`Dispositivo offline, não é possível excluir do Firebase`);
      }
    }

    // Remover do AsyncStorage local
    try {
      const localData = await AsyncStorage.getItem("teams");
      let teams: Team[] = localData ? JSON.parse(localData) : [];
      const teamBeforeDelete = teams.find((t) => t.id === teamId);

      if (teamBeforeDelete) {
        console.log(
          `Time encontrado no AsyncStorage: ${teamBeforeDelete.name}`
        );
      } else {
        console.log(`Time com ID ${teamId} não encontrado no AsyncStorage`);
      }

      teams = teams.filter((t) => t.id !== teamId);
      await AsyncStorage.setItem("teams", JSON.stringify(teams));
      console.log(
        `Time removido do AsyncStorage, restando ${teams.length} times`
      );
    } catch (error) {
      console.log("Erro ao remover time do AsyncStorage:", error);
    }
  }
}

export const dataService = new DataService();
