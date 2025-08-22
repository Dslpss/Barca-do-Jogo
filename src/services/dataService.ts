import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../config/firebaseConfig";
import { User } from "firebase/auth";
import { offlineQueueService } from "./offlineQueueService";

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
    auth.onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        this.syncAllData();
      }
    });
  }

  private getUserId(): string | null {
    return this.user?.uid || (globalThis as any).offlineUser?.uid || null;
  }

  private async isOnline(): Promise<boolean> {
    try {
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
      const localData = await AsyncStorage.getItem("players");
      let players: Player[] = localData ? JSON.parse(localData) : [];

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
          snapshot.forEach((d) => {
            firebasePlayers.push({ id: d.id, ...(d.data() as any) } as Player);
          });

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
      await AsyncStorage.setItem("players", JSON.stringify(players));

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

            if (player.id && player.id.includes("-")) {
              const playerRef = doc(db, "players", player.id);
              await setDoc(playerRef, playerData, { merge: true });
            } else {
              const playersRef = collection(db, "players");
              const q = query(
                playersRef,
                where("userId", "==", userId),
                where("name", "==", player.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, playerData);
                player.id = existingDoc.id;
              } else {
                const newPlayerRef = doc(collection(db, "players"));
                await setDoc(newPlayerRef, playerData);
                player.id = newPlayerRef.id;
              }
            }
          }

          await AsyncStorage.setItem("players", JSON.stringify(players));
        } catch (error) {
          console.log(
            "Erro ao salvar jogadores no Firebase, dados salvos localmente:",
            error
          );
        }
      } else {
        try {
          await offlineQueueService.addOperation({
            type: "championship_update",
            data: { players },
            maxRetries: 3,
          });
          console.log("📝 Players enfileirados para sincronização posterior");
        } catch (err) {
          console.error("Erro ao enfileirar players para sincronização:", err);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar jogadores:", error);
    }
  }

  // TEAMS
  async getTeams(): Promise<Team[]> {
    if (this.isLoadingTeams) {
      console.log("Já carregando times, aguardando...");
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
          const teamsRef = collection(db, "teams");
          const q = query(
            teamsRef,
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);

          const firebaseTeams: Team[] = [];
          snapshot.forEach((d) => {
            firebaseTeams.push({ id: d.id, ...(d.data() as any) } as Team);
          });

          teams = firebaseTeams;
          await AsyncStorage.setItem("teams", JSON.stringify(teams));
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

            let teamExists = false;

            if (team.id) {
              try {
                const teamRef = doc(db, "teams", team.id);
                const teamDoc = await getDoc(teamRef);

                if (teamDoc.exists()) {
                  await updateDoc(teamRef, teamData);
                  teamExists = true;
                }
              } catch (error) {
                console.log(
                  `ID ${team.id} não é válido no Firebase, tratando como ID local`
                );
              }
            }

            if (!teamExists) {
              const teamsRef = collection(db, "teams");
              const q = query(
                teamsRef,
                where("userId", "==", userId),
                where("name", "==", team.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, teamData);
                team.id = existingDoc.id;
              } else {
                const newTeamRef = doc(collection(db, "teams"));
                await setDoc(newTeamRef, teamData);
                team.id = newTeamRef.id;
              }
            }
          }

          await AsyncStorage.setItem("teams", JSON.stringify(teams));
        } catch (error) {
          console.log(
            "Erro ao salvar times no Firebase, dados salvos localmente:",
            error
          );
        }
      } else {
        try {
          await offlineQueueService.addOperation({
            type: "championship_update",
            data: { teams },
            maxRetries: 3,
          });
          console.log("📝 Teams enfileirados para sincronização posterior");
        } catch (err) {
          console.error("Erro ao enfileirar teams para sincronização:", err);
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
          snapshot.forEach((d) => {
            firebaseResults.push({
              id: d.id,
              ...(d.data() as any),
            } as GameResult);
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

            if (result.id && result.id.includes("-")) {
              const resultRef = doc(db, "gameResults", result.id);
              await setDoc(resultRef, resultData, { merge: true });
            } else {
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
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, resultData);
                result.id = existingDoc.id;
              } else {
                const newResultRef = doc(collection(db, "gameResults"));
                await setDoc(newResultRef, resultData);
                result.id = newResultRef.id;
              }
            }
          }

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
      } else {
        try {
          await offlineQueueService.addOperation({
            type: "match_result",
            data: { results },
            maxRetries: 3,
          });
          console.log(
            "📝 Resultados enfileirados para sincronização posterior"
          );
        } catch (err) {
          console.error(
            "Erro ao enfileirar resultados para sincronização:",
            err
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
          snapshot.forEach((d) => {
            firebaseDistributions.push({
              id: d.id,
              ...(d.data() as any),
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

            if (distribution.id && distribution.id.includes("-")) {
              const distributionRef = doc(
                db,
                "savedDistributions",
                distribution.id
              );
              await setDoc(distributionRef, distributionData, { merge: true });
            } else {
              const distributionsRef = collection(db, "savedDistributions");
              const q = query(
                distributionsRef,
                where("userId", "==", userId),
                where("name", "==", distribution.name)
              );
              const snapshot = await getDocs(q);

              if (!snapshot.empty) {
                const existingDoc = snapshot.docs[0];
                await updateDoc(existingDoc.ref, distributionData);
                distribution.id = existingDoc.id;
              } else {
                const newDistributionRef = doc(
                  collection(db, "savedDistributions")
                );
                await setDoc(newDistributionRef, distributionData);
                distribution.id = newDistributionRef.id;
              }
            }
          }

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
      } else {
        try {
          await offlineQueueService.addOperation({
            type: "user_preference",
            data: { distributions },
            maxRetries: 3,
          });
          console.log(
            "📝 Distributions enfileiradas para sincronização posterior"
          );
        } catch (err) {
          console.error(
            "Erro ao enfileirar distributions para sincronização:",
            err
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

    if (userId && (await this.isOnline())) {
      try {
        const playerRef = doc(db, "players", playerId);
        const playerDoc = await getDoc(playerRef);

        if (playerDoc.exists()) {
          const playerData = playerDoc.data();
          if (playerData.userId === userId) {
            await deleteDoc(playerRef);
          }
        } else {
          const playersRef = collection(db, "players");
          const q = query(playersRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);

          snapshot.forEach((d) => {
            const data = d.data();
            if (d.id === playerId || String(data.id) === String(playerId)) {
              deleteDoc(d.ref);
            }
          });
        }
      } catch (error: any) {
        console.log(
          `Erro ao deletar jogador do Firebase: ${
            error?.message || "Erro desconhecido"
          }`
        );
      }
    } else {
      console.log(
        `Usuário não autenticado ou offline, não é possível excluir do Firebase`
      );
    }

    try {
      const localData = await AsyncStorage.getItem("players");
      let players: Player[] = localData ? JSON.parse(localData) : [];
      players = players.filter((p) => p.id !== playerId);
      await AsyncStorage.setItem("players", JSON.stringify(players));
    } catch (error) {
      console.log("Erro ao remover jogador do AsyncStorage:", error);
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    console.log(`Excluindo time com ID: ${teamId}`);

    const userId = this.getUserId();

    if (userId && (await this.isOnline())) {
      try {
        const teamRef = doc(db, "teams", teamId);
        const teamDoc = await getDoc(teamRef);

        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          if (teamData.userId === userId) {
            await deleteDoc(teamRef);
          }
        } else {
          const teamsRef = collection(db, "teams");
          const q = query(teamsRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);

          snapshot.forEach((d) => {
            const data = d.data();
            if (d.id === teamId || String(data.id) === String(teamId)) {
              deleteDoc(d.ref);
            }
          });
        }
      } catch (error: any) {
        console.log(
          `Erro ao deletar time do Firebase: ${
            error?.message || "Erro desconhecido"
          }`
        );
      }
    } else {
      console.log(
        `Usuário não autenticado ou offline, não é possível excluir do Firebase`
      );
    }

    try {
      const localData = await AsyncStorage.getItem("teams");
      let teams: Team[] = localData ? JSON.parse(localData) : [];
      teams = teams.filter((t) => t.id !== teamId);
      await AsyncStorage.setItem("teams", JSON.stringify(teams));
    } catch (error) {
      console.log("Erro ao remover time do AsyncStorage:", error);
    }
  }
}

export const dataService = new DataService();
