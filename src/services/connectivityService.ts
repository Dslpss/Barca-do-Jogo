import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebaseConfig";

type ConnectivityListener = (isOnline: boolean) => void;

class ConnectivityService {
  private listeners: ConnectivityListener[] = [];
  private isOnlineState: boolean = true;
  private lastConnectivityCheck: Date | null = null;
  private connectivityCheckInterval: NodeJS.Timeout | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor() {
    this.initializeConnectivityMonitoring();
  }

  private async initializeConnectivityMonitoring() {
    // Verificar estado inicial
    await this.checkConnectivity();

    // Monitorar mudanças de rede usando NetInfo
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      console.log("📡 NetInfo - Estado da conexão:", {
        isConnected: state.isConnected,
        type: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Verificar conectividade real quando há mudança de rede
      if (state.isConnected && state.isInternetReachable) {
        this.checkConnectivity();
      } else {
        this.updateConnectivityState(false);
      }
    });

    // Verificação periódica a cada 30 segundos
    this.connectivityCheckInterval = setInterval(() => {
      this.checkConnectivity();
    }, 30000);
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      // Primeiro verificar NetInfo
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        this.updateConnectivityState(false);
        return false;
      }
      // Verificar conectividade real com Firebase
      const testDoc = doc(db, "connectivity", "test");
      try {
        await getDoc(testDoc);
        this.updateConnectivityState(true);
        this.lastConnectivityCheck = new Date();
        return true;
      } catch (err: any) {
        // Se NetInfo indica internet mas o Firestore retorna permission-denied,
        // considerar a rede como disponível (problema de regras/autenticação)
        const isPermissionDenied =
          err?.code === "permission-denied" ||
          String(err?.message || "")
            .toLowerCase()
            .includes("insufficient permissions");

        if (isPermissionDenied) {
          console.log(
            "🔔 Conectividade: rede disponível, mas sem permissão para ler o Firestore (permission-denied)"
          );
          this.updateConnectivityState(true);
          this.lastConnectivityCheck = new Date();
          return true;
        }

        // Outros erros significam que provavelmente não há conectividade real
        throw err;
      }
    } catch (error) {
      console.log("🔴 Conectividade: Offline detectado", error);
      this.updateConnectivityState(false);
      return false;
    }
  }

  private updateConnectivityState(isOnline: boolean) {
    if (this.isOnlineState !== isOnline) {
      console.log(`📡 Conectividade mudou: ${isOnline ? "ONLINE" : "OFFLINE"}`);
      this.isOnlineState = isOnline;

      // Salvar estado no AsyncStorage
      AsyncStorage.setItem(
        "lastKnownConnectivity",
        JSON.stringify({
          isOnline,
          timestamp: new Date().toISOString(),
        })
      );

      // Notificar todos os listeners
      this.listeners.forEach((listener) => {
        try {
          listener(isOnline);
        } catch (error) {
          console.error("Erro ao notificar listener de conectividade:", error);
        }
      });
    }
  }

  isOnline(): boolean {
    return this.isOnlineState;
  }

  getLastConnectivityCheck(): Date | null {
    return this.lastConnectivityCheck;
  }

  addConnectivityListener(listener: ConnectivityListener): () => void {
    this.listeners.push(listener);

    // Retornar função para remover o listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async getLastKnownConnectivity(): Promise<{
    isOnline: boolean;
    timestamp: string;
  } | null> {
    try {
      const data = await AsyncStorage.getItem("lastKnownConnectivity");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Erro ao obter último estado de conectividade:", error);
      return null;
    }
  }

  destroy() {
    if (this.connectivityCheckInterval) {
      clearInterval(this.connectivityCheckInterval);
    }
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.listeners = [];
  }
}

export const connectivityService = new ConnectivityService();
export default connectivityService;
