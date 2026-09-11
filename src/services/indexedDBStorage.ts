import { DatabaseState } from '../db/database';
import { OfflineTransaction, OfflineTransactionStatus, SyncLogEntry } from '../types';

const DB_NAME = 'CafeOS_IndexedDB_v1';
const DB_VERSION = 1;

// Object Store Names
export const STORES = {
  TRANSACTIONS: 'offline_transactions',
  SNAPSHOTS: 'database_snapshots',
  SYNC_LOGS: 'sync_logs',
  META: 'app_meta',
} as const;

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Opens and upgrades the IndexedDB database instance safely
   */
  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // Store 1: Offline transactions queue
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('status', 'status', { unique: false });
          txStore.createIndex('createdAt', 'createdAt', { unique: false });
          txStore.createIndex('type', 'type', { unique: false });
        }

        // Store 2: High-capacity database snapshots
        if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
          db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'key' });
        }

        // Store 3: Sync audit history logs
        if (!db.objectStoreNames.contains(STORES.SYNC_LOGS)) {
          const logStore = db.createObjectStore(STORES.SYNC_LOGS, { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store 4: Meta info
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // ==========================================
  // TRANSACTION QUEUE OPERATIONS
  // ==========================================

  /**
   * Adds or updates an offline transaction in the queue
   */
  async saveTransaction(transaction: OfflineTransaction): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.put(transaction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves all offline transactions, optionally filtered by status
   */
  async getTransactions(statusFilter?: OfflineTransactionStatus): Promise<OfflineTransaction[]> {
    const db = await this.getDB();
    return new Promise<OfflineTransaction[]>((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORES.TRANSACTIONS);

      let request: IDBRequest;
      if (statusFilter) {
        const index = store.index('status');
        request = index.getAll(statusFilter);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const results = (request.result as OfflineTransaction[]) || [];
        // Sort chronologically ascending for FIFO queue execution
        results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves a single transaction by ID
   */
  async getTransactionById(id: string): Promise<OfflineTransaction | null> {
    const db = await this.getDB();
    return new Promise<OfflineTransaction | null>((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as OfflineTransaction) || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Updates partial fields of a transaction
   */
  async updateTransaction(id: string, updates: Partial<OfflineTransaction>): Promise<void> {
    const current = await this.getTransactionById(id);
    if (!current) {
      throw new Error(`Transaction with ID ${id} not found in IndexedDB queue.`);
    }
    const updated = { ...current, ...updates };
    await this.saveTransaction(updated);
  }

  /**
   * Deletes a single transaction from queue
   */
  async deleteTransaction(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORES.TRANSACTIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleans up already synced transactions
   */
  async clearSyncedTransactions(): Promise<number> {
    const synced = await this.getTransactions('synced');
    for (const tx of synced) {
      await this.deleteTransaction(tx.id);
    }
    return synced.length;
  }

  /**
   * Counts transactions by status
   */
  async getQueueCounts(): Promise<{ queued: number; syncing: number; synced: number; failed: number; total: number }> {
    const all = await this.getTransactions();
    return {
      queued: all.filter((t) => t.status === 'queued').length,
      syncing: all.filter((t) => t.status === 'syncing').length,
      synced: all.filter((t) => t.status === 'synced').length,
      failed: all.filter((t) => t.status === 'failed').length,
      total: all.length,
    };
  }

  // ==========================================
  // DATABASE SNAPSHOT PERSISTENCE
  // ==========================================

  /**
   * Saves a full database snapshot into IndexedDB for disaster recovery and offline continuity
   */
  async saveDatabaseSnapshot(state: DatabaseState): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(STORES.SNAPSHOTS);
        const record = {
          key: 'active_state',
          timestamp: new Date().toISOString(),
          ordersCount: state.orders.length,
          data: state,
        };
        const request = store.put(record);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] Could not save database snapshot:', err);
    }
  }

  /**
   * Loads the latest database snapshot from IndexedDB
   */
  async loadDatabaseSnapshot(): Promise<DatabaseState | null> {
    try {
      const db = await this.getDB();
      return new Promise<DatabaseState | null>((resolve, reject) => {
        const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
        const store = tx.objectStore(STORES.SNAPSHOTS);
        const request = store.get('active_state');

        request.onsuccess = () => {
          if (request.result && request.result.data) {
            resolve(request.result.data as DatabaseState);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] Could not load database snapshot:', err);
      return null;
    }
  }

  /**
   * Saves a dedicated catalog snapshot (items, categories, modifiers, offers) for offline POS
   */
  async saveCatalogSnapshot(catalogData: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
        const store = tx.objectStore(STORES.SNAPSHOTS);
        const record = {
          key: 'catalog_snapshot',
          timestamp: new Date().toISOString(),
          version: catalogData.version || 'v1.0',
          data: catalogData,
        };
        const request = store.put(record);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] Could not save catalog snapshot:', err);
    }
  }

  /**
   * Loads the dedicated catalog snapshot from IndexedDB
   */
  async loadCatalogSnapshot(): Promise<any | null> {
    try {
      const db = await this.getDB();
      return new Promise<any | null>((resolve, reject) => {
        const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
        const store = tx.objectStore(STORES.SNAPSHOTS);
        const request = store.get('catalog_snapshot');

        request.onsuccess = () => {
          if (request.result && request.result.data) {
            resolve(request.result.data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] Could not load catalog snapshot:', err);
      return null;
    }
  }

  /**
   * Saves catalog sync manifest metadata
   */
  async saveCatalogManifest(manifest: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORES.META, 'readwrite');
        const store = tx.objectStore(STORES.META);
        const record = {
          key: 'catalog_manifest',
          updatedAt: new Date().toISOString(),
          data: manifest,
        };
        const request = store.put(record);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] Could not save catalog manifest:', err);
    }
  }

  /**
   * Loads catalog sync manifest metadata
   */
  async loadCatalogManifest(): Promise<any | null> {
    try {
      const db = await this.getDB();
      return new Promise<any | null>((resolve, reject) => {
        const tx = db.transaction(STORES.META, 'readonly');
        const store = tx.objectStore(STORES.META);
        const request = store.get('catalog_manifest');

        request.onsuccess = () => {
          if (request.result && request.result.data) {
            resolve(request.result.data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('[IndexedDB] Could not load catalog manifest:', err);
      return null;
    }
  }

  // ==========================================
  // SYNC AUDIT LOGS
  // ==========================================

  /**
   * Records a sync execution log
   */
  async recordSyncLog(log: SyncLogEntry): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_LOGS, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_LOGS);
      const request = store.put(log);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves past sync logs, ordered newest first
   */
  async getSyncLogs(limit = 20): Promise<SyncLogEntry[]> {
    const db = await this.getDB();
    return new Promise<SyncLogEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORES.SYNC_LOGS, 'readonly');
      const store = tx.objectStore(STORES.SYNC_LOGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as SyncLogEntry[]) || [];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // STORAGE METRICS
  // ==========================================

  /**
   * Estimates browser storage usage for IndexedDB
   */
  async getStorageEstimate(): Promise<{ usage: number; quota: number; formattedUsage: string }> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;

        const formattedUsage =
          usage > 1024 * 1024
            ? `${(usage / (1024 * 1024)).toFixed(2)} MB`
            : `${(usage / 1024).toFixed(1)} KB`;

        return { usage, quota, formattedUsage };
      } catch (err) {
        console.warn('[IndexedDB] Storage estimate failed:', err);
      }
    }
    return { usage: 0, quota: 0, formattedUsage: '0 KB' };
  }
}

export const indexedDBStorage = new IndexedDBStorage();
