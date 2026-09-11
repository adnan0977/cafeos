import { Category, Coupon, MenuItem, MenuModifier, MenuVariant } from '../types';
import { DatabaseState } from '../db/database';
import { indexedDBStorage } from './indexedDBStorage';

export interface CatalogChangeLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  type: 'category' | 'item' | 'variant' | 'modifier' | 'offer';
  action: 'created' | 'updated' | 'deleted';
  title: string;
  details?: string;
}

export interface CatalogManifest {
  version: string;
  versionNumber: number;
  lastUpdatedAt: string;
  updatedBy: string;
  summary: string;
  counts: {
    categories: number;
    items: number;
    variants: number;
    modifiers: number;
    coupons: number;
  };
  recentChanges: CatalogChangeLogEntry[];
}

export interface CatalogSnapshot {
  version: string;
  versionNumber: number;
  timestamp: string;
  categories: Category[];
  menuItems: MenuItem[];
  modifiers: MenuModifier[];
  coupons: Coupon[];
  settings: {
    name?: string;
    currencySymbol?: string;
    taxPercent?: number;
    gstNumber?: string;
    organization?: any;
    brandTheme?: any;
    billPrinterWidth?: string;
  };
}

export interface CatalogSyncResult {
  success: boolean;
  version: string;
  timestamp: string;
  itemsCount: number;
  categoriesCount: number;
  variantsCount: number;
  modifiersCount: number;
  couponsCount: number;
  syncedFrom: 'cloud' | 'local_admin' | 'offline_cache' | 'package_import';
  message: string;
  changesSinceLastSync?: CatalogChangeLogEntry[];
}

type CatalogSyncListener = (manifest: CatalogManifest, lastSyncResult: CatalogSyncResult | null) => void;

const MANIFEST_STORAGE_KEY = 'cafeos_catalog_manifest_v1';
const SNAPSHOT_STORAGE_KEY = 'cafeos_catalog_snapshot_v1';
const LAST_SYNC_VERSION_KEY = 'cafeos_terminal_last_synced_version';
const LAST_SYNC_TIME_KEY = 'cafeos_terminal_last_synced_time';

class CatalogSyncService {
  private manifest: CatalogManifest;
  private lastSyncResult: CatalogSyncResult | null = null;
  private listeners: Set<CatalogSyncListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.manifest = this.loadInitialManifest();
    this.initBroadcastChannel();
    this.initStorageListener();
    // Warm up IndexedDB cache
    this.warmUpLocalCache();
  }

  /**
   * Loads manifest from local storage or returns a fresh seed manifest
   */
  private loadInitialManifest(): CatalogManifest {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(MANIFEST_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (err) {
        console.warn('[CatalogSync] Failed to parse manifest from localStorage:', err);
      }
    }

    return {
      version: 'v1.0',
      versionNumber: 1,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: 'Admin (System Setup)',
      summary: 'Initial Seed Catalog with Categories, Variants, Add-ons & Offers',
      counts: {
        categories: 6,
        items: 12,
        variants: 24,
        modifiers: 8,
        coupons: 4,
      },
      recentChanges: [
        {
          id: 'chg-init-1',
          timestamp: new Date().toISOString(),
          actor: 'Adnan Khan (Admin)',
          type: 'offer',
          action: 'created',
          title: 'Promotional Offer Active',
          details: 'WELCOME20 (20% Off), ZORKO50 (Flat ₹50), BOGO-BURGER (Buy 1 Get 1)',
        },
        {
          id: 'chg-init-2',
          timestamp: new Date().toISOString(),
          actor: 'Adnan Khan (Admin)',
          type: 'category',
          action: 'created',
          title: 'Core Categories Created',
          details: 'Burgers, Beverages, Pizzas, Combos, Desserts, Starters',
        },
        {
          id: 'chg-init-3',
          timestamp: new Date().toISOString(),
          actor: 'Adnan Khan (Admin)',
          type: 'variant',
          action: 'created',
          title: 'Menu Variants & Add-ons Configured',
          details: 'Regular, Medium, Large, Monster, Double Patty, Extra Cheese, Sauces',
        },
      ],
    };
  }

  /**
   * Initializes BroadcastChannel for instant cross-tab / cross-window sync
   */
  private initBroadcastChannel() {
    if (typeof window === 'undefined') return;

    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('cafeos_catalog_sync_bus');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'ADMIN_CATALOG_UPDATED') {
            console.log('[CatalogSync] Received BroadcastChannel ADMIN_CATALOG_UPDATED:', event.data.manifest?.version);
            if (event.data.manifest) {
              this.manifest = event.data.manifest;
              this.notifyListeners();
            }
          }
        };
      }
    } catch (e) {
      console.warn('[CatalogSync] BroadcastChannel not supported:', e);
    }
  }

  /**
   * Listens for cross-tab updates via localStorage events
   */
  private initStorageListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      if (event.key === MANIFEST_STORAGE_KEY && event.newValue) {
        try {
          this.manifest = JSON.parse(event.newValue);
          this.notifyListeners();
        } catch (e) {
          // ignore
        }
      }
    });
  }

  /**
   * Checks IndexedDB for existing cached manifest on startup
   */
  private async warmUpLocalCache() {
    try {
      const idbManifest = await indexedDBStorage.loadCatalogManifest();
      if (idbManifest && idbManifest.versionNumber > this.manifest.versionNumber) {
        this.manifest = idbManifest;
        this.notifyListeners();
      }
    } catch (err) {
      // ignore
    }
  }

  /**
   * Returns the current catalog manifest
   */
  public getManifest(): CatalogManifest {
    return this.manifest;
  }

  /**
   * Gets terminal's last synced version
   */
  public getLastSyncedVersion(): string {
    if (typeof window === 'undefined') return 'v1.0';
    return localStorage.getItem(LAST_SYNC_VERSION_KEY) || 'v1.0';
  }

  /**
   * Gets terminal's last synced time
   */
  public getLastSyncedTime(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_SYNC_TIME_KEY);
  }

  /**
   * Checks if terminal has pending updates from Admin waiting to be synced
   */
  public hasPendingAdminUpdates(): boolean {
    const lastSynced = this.getLastSyncedVersion();
    return this.manifest.version !== lastSynced;
  }

  /**
   * Records a catalog change made by Admin and broadcasts to all terminals
   */
  public async recordAdminCatalogChange(
    entry: Omit<CatalogChangeLogEntry, 'id' | 'timestamp'>,
    dbState?: DatabaseState
  ): Promise<CatalogManifest> {
    const now = new Date();
    const newChange: CatalogChangeLogEntry = {
      ...entry,
      id: `chg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now.toISOString(),
    };

    const nextVerNum = (this.manifest.versionNumber || 1) + 1;
    const nextVer = `v1.${nextVerNum}`;

    let counts = { ...this.manifest.counts };
    if (dbState) {
      const totalVariants = (dbState.menuItems || []).reduce(
        (acc, item) => acc + (item.variants?.length || 0),
        0
      );
      counts = {
        categories: dbState.categories?.length || 0,
        items: dbState.menuItems?.length || 0,
        variants: totalVariants,
        modifiers: dbState.modifiers?.length || 0,
        coupons: (dbState.coupons || []).filter((c) => c.isActive).length,
      };
    }

    const updatedManifest: CatalogManifest = {
      version: nextVer,
      versionNumber: nextVerNum,
      lastUpdatedAt: now.toISOString(),
      updatedBy: entry.actor || 'Admin',
      summary: `${entry.title} (${entry.action.toUpperCase()})`,
      counts,
      recentChanges: [newChange, ...(this.manifest.recentChanges || [])].slice(0, 30),
    };

    this.manifest = updatedManifest;

    // Persist locally in LocalStorage and IndexedDB
    try {
      localStorage.setItem(MANIFEST_STORAGE_KEY, JSON.stringify(updatedManifest));
      await indexedDBStorage.saveCatalogManifest(updatedManifest);

      if (dbState) {
        const snapshot: CatalogSnapshot = {
          version: nextVer,
          versionNumber: nextVerNum,
          timestamp: now.toISOString(),
          categories: dbState.categories || [],
          menuItems: dbState.menuItems || [],
          modifiers: dbState.modifiers || [],
          coupons: dbState.coupons || [],
          settings: {
            name: dbState.settings?.name,
            currencySymbol: dbState.settings?.currencySymbol,
            taxPercent: dbState.settings?.taxRates?.[0]?.percent || 5,
            gstNumber: dbState.settings?.gstNumber,
            organization: (dbState.settings as any)?.organization,
            brandTheme: (dbState.settings as any)?.brandTheme,
            billPrinterWidth: dbState.settings?.billPrinterWidth,
          },
        };
        localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
        await indexedDBStorage.saveCatalogSnapshot(snapshot);
      }
    } catch (err) {
      console.warn('[CatalogSync] Failed to persist updated manifest:', err);
    }

    // Broadcast across windows / tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'ADMIN_CATALOG_UPDATED',
        manifest: updatedManifest,
      });
    }

    // Trigger local custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cafeos:catalog-updated', { detail: { manifest: updatedManifest } })
      );
    }

    this.notifyListeners();
    return updatedManifest;
  }

  /**
   * Synchronizes terminal catalog from Admin state or cached snapshot
   */
  public async syncCatalogFromAdmin(
    dbState?: DatabaseState,
    forceFull: boolean = false
  ): Promise<CatalogSyncResult> {
    const now = new Date().toISOString();
    let syncedCategories: Category[] = [];
    let syncedMenuItems: MenuItem[] = [];
    let syncedModifiers: MenuModifier[] = [];
    let syncedCoupons: Coupon[] = [];
    let syncSource: CatalogSyncResult['syncedFrom'] = 'local_admin';

    if (dbState) {
      syncedCategories = dbState.categories || [];
      syncedMenuItems = dbState.menuItems || [];
      syncedModifiers = dbState.modifiers || [];
      syncedCoupons = dbState.coupons || [];
      syncSource = 'local_admin';
    } else {
      // Fallback: check IndexedDB snapshot or localStorage snapshot
      const cachedSnapshot = (await indexedDBStorage.loadCatalogSnapshot()) || this.loadSnapshotFromLocalStorage();
      if (cachedSnapshot) {
        syncedCategories = cachedSnapshot.categories || [];
        syncedMenuItems = cachedSnapshot.menuItems || [];
        syncedModifiers = cachedSnapshot.modifiers || [];
        syncedCoupons = cachedSnapshot.coupons || [];
        syncSource = 'offline_cache';
      }
    }

    const totalVariants = syncedMenuItems.reduce(
      (acc, item) => acc + (item.variants?.length || 0),
      0
    );

    // Save snapshot to IndexedDB and LocalStorage for offline use
    const snapshot: CatalogSnapshot = {
      version: this.manifest.version,
      versionNumber: this.manifest.versionNumber,
      timestamp: now,
      categories: syncedCategories,
      menuItems: syncedMenuItems,
      modifiers: syncedModifiers,
      coupons: syncedCoupons,
      settings: {
        name: dbState?.settings?.name,
        currencySymbol: dbState?.settings?.currencySymbol,
        taxPercent: dbState?.settings?.taxRates?.[0]?.percent || 5,
        gstNumber: dbState?.settings?.gstNumber,
        organization: (dbState?.settings as any)?.organization,
        brandTheme: (dbState?.settings as any)?.brandTheme,
        billPrinterWidth: dbState?.settings?.billPrinterWidth,
      },
    };

    try {
      localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
      localStorage.setItem(LAST_SYNC_VERSION_KEY, this.manifest.version);
      localStorage.setItem(LAST_SYNC_TIME_KEY, now);
      await indexedDBStorage.saveCatalogSnapshot(snapshot);
      await indexedDBStorage.saveCatalogManifest(this.manifest);
    } catch (err) {
      console.warn('[CatalogSync] Failed to persist synced catalog snapshot:', err);
    }

    const result: CatalogSyncResult = {
      success: true,
      version: this.manifest.version,
      timestamp: now,
      itemsCount: syncedMenuItems.length,
      categoriesCount: syncedCategories.length,
      variantsCount: totalVariants,
      modifiersCount: syncedModifiers.length,
      couponsCount: syncedCoupons.filter((c) => c.isActive).length,
      syncedFrom: syncSource,
      message: `Successfully synchronized catalog (${this.manifest.version}). Local terminal cache updated for offline operation.`,
      changesSinceLastSync: this.manifest.recentChanges.slice(0, 5),
    };

    this.lastSyncResult = result;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cafeos:catalog-synced', { detail: { result } })
      );
    }

    this.notifyListeners();
    return result;
  }

  /**
   * Helper to load catalog snapshot from LocalStorage
   */
  private loadSnapshotFromLocalStorage(): CatalogSnapshot | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Exports an air-gapped Catalog Update Package (.json) for USB offline distribution
   */
  public exportCatalogPackage(dbState: DatabaseState): void {
    const totalVariants = (dbState.menuItems || []).reduce(
      (acc, item) => acc + (item.variants?.length || 0),
      0
    );

    const exportBundle = {
      packageType: 'CafeOS_Catalog_Sync_Package',
      exportDate: new Date().toISOString(),
      manifest: this.manifest,
      catalog: {
        categories: dbState.categories,
        menuItems: dbState.menuItems,
        modifiers: dbState.modifiers,
        coupons: dbState.coupons,
        settings: {
          name: dbState.settings?.name,
          currencySymbol: dbState.settings?.currencySymbol,
          taxPercent: dbState.settings?.taxRates?.[0]?.percent || 5,
          gstNumber: dbState.settings?.gstNumber,
          organization: (dbState.settings as any)?.organization,
          brandTheme: (dbState.settings as any)?.brandTheme,
          billPrinterWidth: dbState.settings?.billPrinterWidth,
        },
      },
      stats: {
        categoriesCount: dbState.categories.length,
        itemsCount: dbState.menuItems.length,
        variantsCount: totalVariants,
        modifiersCount: dbState.modifiers.length,
        activeOffersCount: dbState.coupons.filter((c) => c.isActive).length,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeOrgName = ((dbState.settings as any)?.organization?.name || 'CafeOS').replace(/\s+/g, '_');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${safeOrgName}_Catalog_${this.manifest.version}_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Imports an offline catalog package (.json) from USB / file
   */
  public async importCatalogPackage(
    jsonString: string,
    applyToDatabase: (catalog: any) => void
  ): Promise<CatalogSyncResult> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.catalog || !parsed.catalog.menuItems) {
        throw new Error('Invalid catalog package file format.');
      }

      applyToDatabase(parsed.catalog);

      if (parsed.manifest) {
        this.manifest = parsed.manifest;
      }

      const totalVariants = (parsed.catalog.menuItems || []).reduce(
        (acc: number, item: any) => acc + (item.variants?.length || 0),
        0
      );

      const now = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_VERSION_KEY, this.manifest.version);
      localStorage.setItem(LAST_SYNC_TIME_KEY, now);

      const result: CatalogSyncResult = {
        success: true,
        version: this.manifest.version,
        timestamp: now,
        itemsCount: parsed.catalog.menuItems.length,
        categoriesCount: (parsed.catalog.categories || []).length,
        variantsCount: totalVariants,
        modifiersCount: (parsed.catalog.modifiers || []).length,
        couponsCount: (parsed.catalog.coupons || []).filter((c: any) => c.isActive).length,
        syncedFrom: 'package_import',
        message: `Offline Catalog Package "${this.manifest.version}" imported successfully!`,
        changesSinceLastSync: parsed.manifest?.recentChanges?.slice(0, 5),
      };

      this.lastSyncResult = result;
      this.notifyListeners();
      return result;
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to import catalog package.');
    }
  }

  /**
   * Subscribes to catalog manifest and sync state changes
   */
  public subscribe(listener: CatalogSyncListener): () => void {
    this.listeners.add(listener);
    listener(this.manifest, this.lastSyncResult);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.manifest, this.lastSyncResult));
  }
}

export const catalogSyncService = new CatalogSyncService();
