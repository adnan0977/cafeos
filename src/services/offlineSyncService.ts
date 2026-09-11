import {
  OfflineSyncStats,
  OfflineTransaction,
  OfflineTransactionType,
  SyncLogEntry,
  UserRole,
} from '../types';
import { indexedDBStorage } from './indexedDBStorage';
import { requestBackgroundSync } from './serviceWorkerRegistration';

type SyncListener = (stats: OfflineSyncStats, queue: OfflineTransaction[]) => void;

class OfflineSyncService {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOfflineState: boolean = false;
  private isSyncingState: boolean = false;
  private lastSyncTimeState: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private heartbeatTimer: any = null;

  constructor() {
    this.initNetworkListeners();
    this.startHeartbeat();
  }

  /**
   * Initializes browser online/offline event listeners
   */
  private initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[OfflineSync] Browser returned ONLINE.');
      this.isOnlineState = true;
      this.notifySubscribers();
      // Auto-trigger sync queue on reconnect
      if (!this.isSimulatedOfflineState) {
        this.processQueue();
      }
    });

    window.addEventListener('offline', () => {
      console.warn('[OfflineSync] Browser went OFFLINE.');
      this.isOnlineState = false;
      this.notifySubscribers();
    });
  }

  /**
   * Periodic heartbeat to sync pending items if online
   */
  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    this.heartbeatTimer = setInterval(async () => {
      if (this.effectiveOnlineStatus() && !this.isSyncingState) {
        const counts = await indexedDBStorage.getQueueCounts();
        if (counts.queued > 0 || counts.failed > 0) {
          console.log(`[OfflineSync] Heartbeat detected ${counts.queued} pending items. Triggering sync...`);
          this.processQueue();
        }
      }
    }, 25000);
  }

  /**
   * Effective online status taking into account simulated mode
   */
  public effectiveOnlineStatus(): boolean {
    if (this.isSimulatedOfflineState) return false;
    return this.isOnlineState;
  }

  /**
   * Toggles simulated offline mode for testing/demoing internet outages
   */
  public setSimulatedOffline(simulated: boolean) {
    this.isSimulatedOfflineState = simulated;
    console.log(`[OfflineSync] Simulated offline mode set to: ${simulated}`);
    this.notifySubscribers();

    if (!simulated && this.isOnlineState) {
      // Re-connected from simulation, trigger sync
      this.processQueue();
    }
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOfflineState;
  }

  /**
   * Enqueues a business transaction into IndexedDB queue
   */
  public async queueTransaction(
    type: OfflineTransactionType,
    payload: any,
    actor: { id: string; name: string; role: UserRole },
    description: string,
    amount?: number,
    entityId?: string
  ): Promise<OfflineTransaction> {
    const transaction: OfflineTransaction = {
      id: `tx-off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      entityId,
      description,
      amount,
      payload,
      actor,
      status: 'queued',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Save to IndexedDB
    await indexedDBStorage.saveTransaction(transaction);
    console.log(`[OfflineSync] Transaction queued in IndexedDB:`, transaction);

    // Request Service Worker background sync if supported
    requestBackgroundSync('cafeos-sync-queue').catch(() => {});

    this.notifySubscribers();

    // If we are currently online, process immediately in the background
    if (this.effectiveOnlineStatus() && !this.isSyncingState) {
      setTimeout(() => {
        this.processQueue();
      }, 500);
    }

    return transaction;
  }

  /**
   * Processes all queued transactions in IndexedDB sequentially
   */
  public async processQueue(): Promise<SyncLogEntry> {
    if (this.isSyncingState) {
      console.log('[OfflineSync] Sync already in progress, skipping duplicate call.');
      return {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        syncedCount: 0,
        failedCount: 0,
        status: 'partial',
        details: 'Sync already in progress',
        durationMs: 0,
      };
    }

    if (!this.effectiveOnlineStatus()) {
      console.warn('[OfflineSync] Cannot sync while offline.');
      return {
        id: `sync-${Date.now()}`,
        timestamp: new Date().toISOString(),
        syncedCount: 0,
        failedCount: 0,
        status: 'failed',
        details: 'Network is offline. Transaction kept securely in IndexedDB.',
        durationMs: 0,
      };
    }

    const startTime = Date.now();
    this.isSyncingState = true;
    this.notifySubscribers();

    let syncedCount = 0;
    let failedCount = 0;
    const detailsList: string[] = [];

    try {
      const pending = await indexedDBStorage.getTransactions();
      const itemsToSync = pending.filter((t) => t.status === 'queued' || t.status === 'failed');

      if (itemsToSync.length === 0) {
        this.isSyncingState = false;
        this.notifySubscribers();
        return {
          id: `sync-${Date.now()}`,
          timestamp: new Date().toISOString(),
          syncedCount: 0,
          failedCount: 0,
          status: 'success',
          details: 'Queue is already empty. All transactions synchronized.',
          durationMs: Date.now() - startTime,
        };
      }

      console.log(`[OfflineSync] Starting background sync of ${itemsToSync.length} transactions...`);

      for (const tx of itemsToSync) {
        // Mark transaction as syncing
        await indexedDBStorage.updateTransaction(tx.id, { status: 'syncing' });
        this.notifySubscribers();

        try {
          // Simulate realistic cloud server API replication
          await this.replicateTransactionToCloud(tx);

          // Mark transaction as synced
          await indexedDBStorage.updateTransaction(tx.id, {
            status: 'synced',
            syncedAt: new Date().toISOString(),
            error: undefined,
          });
          syncedCount++;
          detailsList.push(`Synced ${tx.type} (${tx.id})`);
        } catch (err: any) {
          failedCount++;
          const errorMsg = err?.message || 'Sync failed';
          await indexedDBStorage.updateTransaction(tx.id, {
            status: 'failed',
            retryCount: (tx.retryCount || 0) + 1,
            error: errorMsg,
          });
          detailsList.push(`Failed ${tx.type}: ${errorMsg}`);
        }
      }

      this.lastSyncTimeState = new Date().toISOString();

      const logEntry: SyncLogEntry = {
        id: `sync-log-${Date.now()}`,
        timestamp: this.lastSyncTimeState,
        syncedCount,
        failedCount,
        status: failedCount === 0 ? 'success' : syncedCount > 0 ? 'partial' : 'failed',
        details: detailsList.join('; ') || `Processed ${syncedCount} items successfully`,
        durationMs: Date.now() - startTime,
      };

      await indexedDBStorage.recordSyncLog(logEntry);
      return logEntry;
    } finally {
      this.isSyncingState = false;
      this.notifySubscribers();
    }
  }

  /**
   * Cloud sync replication mock handler with realistic timing and payload validation
   */
  private async replicateTransactionToCloud(tx: OfflineTransaction): Promise<void> {
    // Artificial latency (100-300ms) to simulate real server API call
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Validation
    if (!tx.payload && !tx.entityId) {
      throw new Error('Malformed transaction payload');
    }

    console.log(`[OfflineSync] ☁️ Successfully replicated transaction to cloud backend: [${tx.type}]`, tx.description);
  }

  /**
   * Retries a specific failed transaction
   */
  public async retryTransaction(id: string): Promise<void> {
    await indexedDBStorage.updateTransaction(id, { status: 'queued', error: undefined });
    this.notifySubscribers();
    if (this.effectiveOnlineStatus()) {
      await this.processQueue();
    }
  }

  /**
   * Deletes a transaction from queue
   */
  public async deleteTransaction(id: string): Promise<void> {
    await indexedDBStorage.deleteTransaction(id);
    this.notifySubscribers();
  }

  /**
   * Purges all completed (synced) transactions from IndexedDB
   */
  public async clearSynced(): Promise<number> {
    const count = await indexedDBStorage.clearSyncedTransactions();
    this.notifySubscribers();
    return count;
  }

  /**
   * Retrieves comprehensive sync metrics
   */
  public async getStats(): Promise<OfflineSyncStats> {
    const counts = await indexedDBStorage.getQueueCounts();
    const storage = await indexedDBStorage.getStorageEstimate();

    return {
      isOnline: this.isOnlineState,
      isSimulatedOffline: this.isSimulatedOfflineState,
      isSyncing: this.isSyncingState,
      queuedCount: counts.queued,
      syncedCount: counts.synced,
      failedCount: counts.failed,
      lastSyncTime: this.lastSyncTimeState,
      storageUsageBytes: storage.usage,
    };
  }

  /**
   * Subscribes to sync state changes
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Trigger initial notification immediately
    this.notifySingleSubscriber(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifySingleSubscriber(listener: SyncListener) {
    try {
      const stats = await this.getStats();
      const queue = await indexedDBStorage.getTransactions();
      listener(stats, queue);
    } catch (err) {
      console.warn('[OfflineSync] Subscriber notification error:', err);
    }
  }

  private async notifySubscribers() {
    try {
      const stats = await this.getStats();
      const queue = await indexedDBStorage.getTransactions();
      this.listeners.forEach((listener) => {
        listener(stats, queue);
      });
    } catch (err) {
      console.warn('[OfflineSync] Broadcast notification error:', err);
    }
  }
}

export const offlineSyncService = new OfflineSyncService();
