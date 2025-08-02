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
            firebaseTeams.push({ id: doc.id, ...doc.data() } as Team);
          });
          
          console.log(`Encontrados ${firebaseTeams.length} times no Firebase`);

          // Verificar se há times que existem no local mas não no Firebase
          const firebaseIds = new Set(firebaseTeams.map(ft => ft.id));
          const teamsToRemove = teams.filter(lt => {
            // Se o time não está no Firebase e não é um time recém-criado
            return lt.id && !firebaseIds.has(lt.id) && lt.id.length > 10;
          });

          // Se encontramos times locais que não estão no Firebase,
          // vamos removê-los se tiverem IDs que parecem ser do Firebase
          if (teamsToRemove.length > 0) {
            console.log(
              `Removendo ${teamsToRemove.length} times que foram excluídos no Firebase`
            );
            teamsToRemove.forEach(t => {
              console.log(`- Time removido: ${t.name} (ID: ${t.id})`);
            });
            teams = teams.filter(t => !teamsToRemove.some(tr => tr.id === t.id));
          }

          // Adicionar novos times do Firebase que não existem localmente
          const localIds = new Set(teams.map(lt => lt.id));
          const newFirebaseTeams = firebaseTeams.filter(ft => !localIds.has(ft.id));
          
          if (newFirebaseTeams.length > 0) {
            console.log(`Adicionando ${newFirebaseTeams.length} novos times do Firebase`);
            teams = [...teams, ...newFirebaseTeams];
          }

          // Atualizar times existentes com dados do Firebase
          teams = teams.map(team => {
            const firebaseTeam = firebaseTeams.find(ft => ft.id === team.id);
            return firebaseTeam || team;
          });

          // Remover possíveis duplicações por nome
          const uniqueTeams: Team[] = [];
          const seenNames = new Set<string>();

          for (const team of teams) {
            if (!seenNames.has(team.name.toLowerCase())) {
              uniqueTeams.push(team);
              seenNames.add(team.name.toLowerCase());
            } else {
              console.log(`Time duplicado removido: ${team.name}`);
            }
          }

          teams = uniqueTeams;
          await AsyncStorage.setItem("teams", JSON.stringify(teams));
          console.log(`${teams.length} times salvos no AsyncStorage após sincronização`);
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

            // Verificar se o team já existe no Firebase
            if (team.id && team.id.includes("-")) {
              // ID do Firebase - usar setDoc com merge para atualizar ou criar
              const teamRef = doc(db, "teams", team.id);
              await setDoc(teamRef, teamData, { merge: true });
            } else {
              // ID local - verificar se já foi sincronizado antes
              const teamsRef = collection(db, "teams");
              const q = query(
                teamsRef,
                where("userId", "==", userId),
                where("name", "==", team.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                // Time já existe no Firebase, atualizar
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, teamData);
                team.id = existingDoc.id;
              } else {
                // Criar novo time
                const newTeamRef = doc(collection(db, "teams"));
                await setDoc(newTeamRef, teamData);
                team.id = newTeamRef.id;
              }
            }
          }

          // Atualizar o cache local com os novos IDs do Firebase
          await AsyncStorage.setItem("teams", JSON.stringify(teams));
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
    const userId = this.getUserId();
    if (userId && (await this.isOnline())) {
      try {
        const playerRef = doc(db, "players", playerId);
        await deleteDoc(playerRef);
      } catch (error) {
        console.log("Erro ao deletar jogador do Firebase:", error);
      }
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    console.log(`Excluindo time com ID: ${teamId}`);

    // Remover do AsyncStorage local imediatamente
    try {
      const localData = await AsyncStorage.getItem("teams");
      let teams: Team[] = localData ? JSON.parse(localData) : [];
      const teamBeforeDelete = teams.find((t) => t.id === teamId);

      if (teamBeforeDelete) {
        console.log(`Time encontrado para exclusão: ${teamBeforeDelete.name}`);
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

    // Remover do Firebase se online
    const userId = this.getUserId();
    if (userId && (await this.isOnline())) {
      try {
        // Tentar excluir diretamente usando o ID fornecido
        try {
          console.log(`Tentando excluir diretamente do Firebase com ID: ${teamId}`);
          const teamRef = doc(db, "teams", teamId);
          await deleteDoc(teamRef);
          console.log(`Time excluído com sucesso do Firebase usando ID direto`);
          return; // Se conseguiu excluir, podemos sair da função
        } catch (error: any) {
          console.log(`Não foi possível excluir diretamente: ${error?.message || 'Erro desconhecido'}`);
          // Continue para as próximas tentativas
        }

        // Buscar o time no Firebase por consulta
        console.log("Buscando o time no Firebase por consulta...");
        
        // Obter o nome do time se possível
        const localData = await AsyncStorage.getItem("teams");
        const teams: Team[] = localData ? JSON.parse(localData) : [];
        const teamName = teams.find(t => t.id === teamId)?.name;
        
        if (teamName) {
          // Buscar por nome
          console.log(`Buscando por nome: ${teamName}`);
          const teamsRef = collection(db, "teams");
          const q = query(
            teamsRef,
            where("userId", "==", userId),
            where("name", "==", teamName)
          );
          
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            for (const doc of snapshot.docs) {
              console.log(`Excluindo time do Firebase com ID: ${doc.id}`);
              await deleteDoc(doc.ref);
            }
            console.log(`Time(s) excluído(s) do Firebase por nome`);
          } else {
            console.log(`Nenhum time encontrado no Firebase com o nome: ${teamName}`);
          }
        } else {
          console.log("Não foi possível determinar o nome do time para busca");
        }
      } catch (error) {
        console.log("Erro ao deletar time do Firebase:", error);
      }
    } else {
      console.log(
        `Usuário não autenticado ou offline, time não excluído do Firebase`
      );
    }
  }
}

export const dataService = new DataService();
