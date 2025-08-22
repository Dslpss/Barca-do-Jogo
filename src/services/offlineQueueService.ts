import AsyncStorage from '@react-native-async-storage/async-storage';
import connectivityService from './connectivityService';

const OFFLINE_QUEUE_KEY = 'offlineQueue';
const FAILED_OPERATIONS_KEY = 'failedOperations';

export interface OfflineOperation {
  id: string;
  type: 'championship_update' | 'championship_create' | 'championship_delete' | 'match_result' | 'user_preference';
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueueService {
  private queue: OfflineOperation[] = [];
  private isProcessing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeQueue();
    this.setupConnectivityListener();
  }

  private async initializeQueue() {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`📋 Fila offline carregada: ${this.queue.length} operações pendentes`);
      }
    } catch (error) {
      console.error('Erro ao carregar fila offline:', error);
    }
  }

  private setupConnectivityListener() {
    connectivityService.addConnectivityListener((isOnline) => {
      if (isOnline && this.queue.length > 0) {
        console.log('🔄 Conectividade restaurada - processando fila offline');
        this.processQueue();
      }
    });
  }

  async addOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    this.queue.push(newOperation);
    await this.saveQueue();
    
    console.log(`📝 Operação adicionada à fila offline: ${newOperation.type}`);

    // Se estiver online, tentar processar imediatamente
    if (connectivityService.isOnline()) {
      this.processQueue();
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Erro ao salvar fila offline:', error);
    }
  }

  async processQueue() {
    if (this.isProcessing || !connectivityService.isOnline()) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processando fila offline: ${this.queue.length} operações`);

    const processedOperations: string[] = [];
    const failedOperations: OfflineOperation[] = [];

    for (const operation of this.queue) {
      try {
        await this.executeOperation(operation);
        processedOperations.push(operation.id);
        console.log(`✅ Operação processada: ${operation.type} (${operation.id})`);
      } catch (error) {
        console.error(`❌ Erro ao processar operação ${operation.type}:`, error);
        
        operation.retryCount++;
        if (operation.retryCount >= operation.maxRetries) {
          console.log(`🚫 Operação ${operation.id} excedeu tentativas máximas`);
          failedOperations.push(operation);
          processedOperations.push(operation.id);
        }
      }
    }

    // Remover operações processadas da fila
    this.queue = this.queue.filter(op => !processedOperations.includes(op.id));
    await this.saveQueue();

    // Salvar operações que falharam definitivamente
    if (failedOperations.length > 0) {
      await this.saveFailedOperations(failedOperations);
    }

    console.log(`✅ Processamento da fila concluído. Restantes: ${this.queue.length}`);
    this.isProcessing = false;
  }

  private async executeOperation(operation: OfflineOperation) {
    const { ChampionshipService } = await import('./championshipService');
    
    switch (operation.type) {
      case 'championship_update':
        await ChampionshipService.updateChampionship(operation.data, false);
        break;
      
      case 'championship_create':
        await ChampionshipService.createChampionship(operation.data.name, operation.data.type);
        break;
      
      case 'championship_delete':
        await ChampionshipService.deleteChampionship(operation.data.id);
        break;
      
      case 'match_result':
        await ChampionshipService.recordMatchResult(
          operation.data.championshipId,
          operation.data.matchId,
          operation.data.homeScore,
          operation.data.awayScore,
          operation.data.homeGoalScorers,
          operation.data.awayGoalScorers
        );
        break;
      
      case 'user_preference':
        await ChampionshipService.setCurrentChampionship(operation.data.championshipId);
        break;
      
      default:
        throw new Error(`Tipo de operação não suportado: ${operation.type}`);
    }
  }

  private async saveFailedOperations(operations: OfflineOperation[]) {
    try {
      const existingFailed = await AsyncStorage.getItem(FAILED_OPERATIONS_KEY);
      const failedOps = existingFailed ? JSON.parse(existingFailed) : [];
      failedOps.push(...operations);
      await AsyncStorage.setItem(FAILED_OPERATIONS_KEY, JSON.stringify(failedOps));
    } catch (error) {
      console.error('Erro ao salvar operações falhadas:', error);
    }
  }

  async getQueueStatus() {
    return {
      pendingOperations: this.queue.length,
      isProcessing: this.isProcessing,
      operations: this.queue.map(op => ({
        id: op.id,
        type: op.type,
        timestamp: op.timestamp,
        retryCount: op.retryCount,
        maxRetries: op.maxRetries
      }))
    };
  }

  async getFailedOperations(): Promise<OfflineOperation[]> {
    try {
      const data = await AsyncStorage.getItem(FAILED_OPERATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao obter operações falhadas:', error);
      return [];
    }
  }

  async clearFailedOperations() {
    try {
      await AsyncStorage.removeItem(FAILED_OPERATIONS_KEY);
    } catch (error) {
      console.error('Erro ao limpar operações falhadas:', error);
    }
  }

  async retryFailedOperations() {
    const failedOps = await this.getFailedOperations();
    if (failedOps.length > 0) {
      // Resetar contador de tentativas e adicionar de volta à fila
      const retriedOps = failedOps.map(op => ({ ...op, retryCount: 0 }));
      this.queue.push(...retriedOps);
      await this.saveQueue();
      await this.clearFailedOperations();
      
      if (connectivityService.isOnline()) {
        this.processQueue();
      }
    }
  }

  startPeriodicSync(intervalMs: number = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (connectivityService.isOnline() && this.queue.length > 0) {
        this.processQueue();
      }
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const offlineQueueService = new OfflineQueueService();
export default offlineQueueService;