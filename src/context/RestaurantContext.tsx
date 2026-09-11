import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DatabaseState, db } from '../db/database';
import { indexedDBStorage } from '../services/indexedDBStorage';
import { offlineSyncService } from '../services/offlineSyncService';
import { catalogSyncService, CatalogManifest, CatalogSyncResult } from '../services/catalogSyncService';
import { INITIAL_FRANCHISE_GROUPS, INITIAL_INTER_STORE_TRANSFERS, INITIAL_ORGANIZATIONS, INITIAL_OUTLETS } from '../data/multiStoreData';
import { playKitchenReadyChime, playNewOrderKitchenChime } from '../utils/soundUtils';
import {
  AdminSubTab,
  Category,
  Coupon,
  Customer,
  Equipment,
  Expense,
  FranchiseGroup,
  Ingredient,
  InterStoreTransfer,
  MaintenanceRecord,
  MenuItem,
  MenuModifier,
  OfflineSyncStats,
  OfflineTransaction,
  Order,
  OrderItem,
  Organization,
  Outlet,
  PaymentAllocation,
  PaymentMethod,
  PurchaseOrder,
  Recipe,
  RestaurantSettings,
  RestaurantTable,
  SOPMaster,
  SOPTask,
  StockCount,
  Supplier,
  UnitType,
  User,
  WastageRecord,
} from '../types';
import { useAuth } from './AuthContext';

interface RestaurantContextType {
  state: DatabaseState;
  settings: RestaurantSettings;
  orders: Order[];
  tables: RestaurantTable[];
  customers: Customer[];
  menuItems: MenuItem[];
  categories: Category[];
  modifiers: MenuModifier[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  wastage: WastageRecord[];
  stockCounts: StockCount[];
  coupons: Coupon[];
  riders: DatabaseState['riders'];
  shifts: DatabaseState['shifts'];
  sopTasks: SOPTask[];
  sopMasters: SOPMaster[];
  equipment: Equipment[];
  maintenanceRecords: MaintenanceRecord[];
  expenses: Expense[];
  auditLogs: DatabaseState['auditLogs'];
  notifications: DatabaseState['notifications'];

  // Multi-Store, Multi-Brand & Multi-Franchise Multi-Tenancy
  organizations: Organization[];
  activeOrganizationId: string;
  activeOrganization: Organization;
  setActiveOrganizationId: (id: string) => void;
  addOrganization: (org: Omit<Organization, 'id' | 'createdAt'>) => Organization;
  updateOrganization: (id: string, updates: Partial<Organization>) => void;
  outlets: Outlet[];
  activeOutletId: string;
  activeOutlet: Outlet;
  accessibleOutlets: Outlet[];
  setActiveOutletId: (id: string) => void;
  updateOutlet: (id: string, updates: Partial<Outlet>) => void;
  addOutlet: (outlet: Omit<Outlet, 'id'>) => Outlet;
  franchiseGroups: FranchiseGroup[];
  addFranchiseGroup: (group: Omit<FranchiseGroup, 'id' | 'joinedDate'>) => FranchiseGroup;
  updateFranchiseGroup: (id: string, updates: Partial<FranchiseGroup>) => void;
  interStoreTransfers: InterStoreTransfer[];
  createInterStoreTransfer: (transfer: Omit<InterStoreTransfer, 'id' | 'transferNumber' | 'transferDate'>) => InterStoreTransfer;
  updateTransferStatus: (id: string, status: InterStoreTransfer['status'], receivedBy?: string) => void;
  isConsolidatedStoreView: boolean;
  setIsConsolidatedStoreView: (val: boolean) => void;
  isSuperAdmin: boolean;
  isFranchiseOwner: boolean;
  isBrandAdmin: boolean;
  isPlatformStaff: boolean;

  // Global Modals & Navigation Drawers
  receiptModalOrder: Order | null;
  setReceiptModalOrder: (order: Order | null) => void;
  kotModalOrder: Order | null;
  setKOTModalOrder: (order: Order | null) => void;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (open: boolean) => void;
  isHamburgerOpen: boolean;
  setIsHamburgerOpen: (open: boolean) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (tab: AdminSubTab) => void;

  // Offline Sync & IndexedDB State
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: (force?: boolean) => void;
  syncStats: OfflineSyncStats;
  offlineQueue: OfflineTransaction[];
  syncNow: () => Promise<void>;
  retryTransaction: (id: string) => Promise<void>;
  deleteOfflineTransaction: (id: string) => Promise<void>;
  clearSyncedTransactions: () => Promise<number>;

  // Catalog & Offers Sync State (Admin to POS/Android/Windows)
  catalogManifest: CatalogManifest;
  hasCatalogUpdate: boolean;
  isCatalogSyncing: boolean;
  lastCatalogSyncResult: CatalogSyncResult | null;
  syncCatalogFromAdmin: (force?: boolean) => Promise<CatalogSyncResult>;
  isCatalogSyncModalOpen: boolean;
  setIsCatalogSyncModalOpen: (open: boolean) => void;
  exportCatalogPackage: () => void;
  importCatalogPackage: (jsonStr: string) => Promise<CatalogSyncResult>;
  applyCatalogImport: (catalogData: any) => void;

  // Actions
  createOrder: (orderData: Partial<Order>) => Order;
  addItemsToOrder: (orderId: string, newItems: OrderItem[]) => Order | undefined;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateOrderItemKitchenStatus: (
    orderId: string,
    itemId: string,
    itemKitchenStatus: 'pending' | 'preparing' | 'ready' | 'served'
  ) => Order | undefined;
  processPayment: (
    orderId: string,
    payments: PaymentAllocation[],
    discountAmount?: number,
    discountReason?: string
  ) => Order | undefined;
  cancelOrder: (orderId: string, reason: string) => void;
  processRefund: (orderId: string, amount: number, reason: string, method: PaymentMethod) => void;

  // Customer Loyalty Actions
  linkOrderCustomer: (
    orderId: string,
    customerData: {
      customerId?: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
    }
  ) => Order | undefined;
  applyLoyaltyDiscountToOrder: (
    orderId: string,
    pointsToRedeem: number,
    discountAmount: number,
    couponCode: string,
    rewardTitle: string
  ) => Order | undefined;
  removeOrderLoyaltyDiscount: (orderId: string) => Order | undefined;
  addCustomer: (
    customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend'> & { initialPoints?: number }
  ) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  adjustCustomerPoints: (customerId: string, pointsDelta: number, reason: string) => Customer | undefined;

  // Menu Actions
  addCategory: (cat: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addModifier: (mod: Omit<MenuModifier, 'id'>) => MenuModifier;
  updateModifier: (id: string, updates: Partial<MenuModifier>) => void;
  deleteModifier: (id: string) => void;
  saveRecipe: (recipe: Omit<Recipe, 'id'> & { id?: string }) => Recipe;
  deleteRecipe: (id: string) => void;

  // Inventory Actions
  addIngredient: (ing: Omit<Ingredient, 'id'>) => Ingredient;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  bulkImportIngredients: (
    items: Array<{
      name: string;
      category?: string;
      unit?: UnitType;
      purchaseUnit?: UnitType;
      conversionFactor?: number;
      supplierId?: string;
      costPerUnit: number;
      quantity: number;
      minStock?: number;
      reorderLevel?: number;
      maxStock?: number;
      storageLocation?: string;
    }>,
    mode: 'add_to_existing' | 'overwrite_stock' | 'create_only'
  ) => { addedCount: number; updatedCount: number };
  addSupplier: (sup: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id'>) => PurchaseOrder;
  receivePurchaseOrder: (poId: string, invoiceNumber?: string) => void;
  recordWastage: (waste: Omit<WastageRecord, 'id' | 'date'>) => WastageRecord;
  submitStockCount: (count: Omit<StockCount, 'id' | 'date'>) => StockCount;
  approveStockCount: (countId: string) => void;

  // Tables
  addTable: (table: Omit<RestaurantTable, 'id'>) => RestaurantTable;
  updateTable: (id: string, updates: Partial<RestaurantTable>) => void;
  clearTableStatus: (tableId: string) => void;
  deleteTable: (id: string) => void;

  // Expenses & Petty Cash
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;

  // Shift & Closing
  openShift: (openingCash: number) => void;
  closeShift: (shiftId: string, actualCash: number, notes: string) => void;
  executeDailyClosing: (date: string, actualCash: number, notes: string) => void;

  // Delivery Actions
  assignRider: (orderId: string, riderId: string) => void;
  updateDeliveryStatus: (orderId: string, status: Order['deliveryStatus']) => void;

  // SOP & Tasks
  generateDailySOPTasks: (outletId?: string) => void;
  publishSOPTaskForToday: (sopMasterId: string, targetOutletId?: string) => SOPTask | undefined;
  submitSOPTask: (taskId: string, results: SOPTask['results']) => void;
  reviewSOPTask: (taskId: string, reviewStatus: 'approved' | 'rejected', notes: string) => void;
  addSOPMaster: (sop: Omit<SOPMaster, 'id' | 'createdAt'>) => SOPMaster;
  updateSOPMaster: (id: string, updates: Partial<SOPMaster>) => void;

  // Equipment & Maintenance
  addEquipment: (eq: Omit<Equipment, 'id'>) => Equipment;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  logMaintenance: (maint: Omit<MaintenanceRecord, 'id'>) => MaintenanceRecord;

  // Coupons & Offers Promotions Actions
  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'totalDiscountGiven' | 'totalRevenueGenerated'>) => Coupon;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  toggleCouponStatus: (id: string) => void;
  deleteCoupon: (id: string) => void;
  recordCouponUsage: (couponId: string, discountAmount: number, grandTotal: number) => void;

  // Settings & Helpers
  updateSettings: (settings: Partial<RestaurantSettings>) => void;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetDatabase: () => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [state, setState] = useState<DatabaseState>(() => db.getState());

  // Global modals & navigation
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [kotModalOrder, setKOTModalOrder] = useState<Order | null>(null);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState<boolean>(false);
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('staff');

  // Multi-Tenant Organizations State
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const saved = localStorage.getItem('royalpos_organizations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ORGANIZATIONS;
  });

  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string>(() => {
    return localStorage.getItem('royalpos_active_organization_id') || 'org-bk';
  });

  const activeOrganization = useMemo<Organization>(() => {
    return (
      organizations.find((o) => o.id === activeOrganizationId) ||
      organizations[0] ||
      INITIAL_ORGANIZATIONS[0]
    );
  }, [organizations, activeOrganizationId]);

  const setActiveOrganizationId = (orgId: string) => {
    setActiveOrganizationIdState(orgId);
    localStorage.setItem('royalpos_active_organization_id', orgId);
  };

  useEffect(() => {
    localStorage.setItem('royalpos_organizations', JSON.stringify(organizations));
  }, [organizations]);

  const addOrganization = (orgData: Omit<Organization, 'id' | 'createdAt'>): Organization => {
    const newOrg: Organization = {
      ...orgData,
      id: `org-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setOrganizations((prev) => [...prev, newOrg]);
    return newOrg;
  };

  const updateOrganization = (id: string, updates: Partial<Organization>) => {
    setOrganizations((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  // Multi-Store Outlets State
  const [outlets, setOutlets] = useState<Outlet[]>(() => {
    const saved = localStorage.getItem('royalpos_outlets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_OUTLETS;
  });

  const [activeOutletId, setActiveOutletIdState] = useState<string>(() => {
    return localStorage.getItem('royalpos_active_outlet_id') || 'out-1';
  });

  const [isConsolidatedStoreView, setIsConsolidatedStoreView] = useState<boolean>(false);

  const [franchiseGroups, setFranchiseGroups] = useState<FranchiseGroup[]>(() => {
    const saved = localStorage.getItem('royalpos_franchise_groups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_FRANCHISE_GROUPS;
  });

  const addFranchiseGroup = (groupData: Omit<FranchiseGroup, 'id' | 'joinedDate'>): FranchiseGroup => {
    const newGroup: FranchiseGroup = {
      ...groupData,
      id: `fg-${Date.now().toString(36)}`,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setFranchiseGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const updateFranchiseGroup = (id: string, updates: Partial<FranchiseGroup>) => {
    setFranchiseGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  // Inter-Store Stock Transfers across Cities
  const [interStoreTransfers, setInterStoreTransfers] = useState<InterStoreTransfer[]>(() => {
    const saved = localStorage.getItem('royalpos_transfers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_INTER_STORE_TRANSFERS;
  });

  useEffect(() => {
    localStorage.setItem('royalpos_transfers', JSON.stringify(interStoreTransfers));
  }, [interStoreTransfers]);

  const createInterStoreTransfer = (
    transferData: Omit<InterStoreTransfer, 'id' | 'transferNumber' | 'transferDate'>
  ): InterStoreTransfer => {
    const newXfer: InterStoreTransfer = {
      ...transferData,
      id: `xfer-${Date.now()}`,
      transferNumber: `TRF-${new Date().getFullYear()}-${String(interStoreTransfers.length + 1).padStart(3, '0')}`,
      transferDate: new Date().toISOString(),
    };
    setInterStoreTransfers((prev) => [newXfer, ...prev]);
    return newXfer;
  };

  const updateTransferStatus = (
    id: string,
    status: InterStoreTransfer['status'],
    receivedBy?: string
  ) => {
    setInterStoreTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, receivedBy: receivedBy || t.receivedBy } : t))
    );
  };

  useEffect(() => {
    localStorage.setItem('royalpos_outlets', JSON.stringify(outlets));
  }, [outlets]);

  useEffect(() => {
    localStorage.setItem('royalpos_franchise_groups', JSON.stringify(franchiseGroups));
  }, [franchiseGroups]);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isPlatformStaff = Boolean(
    currentUser?.isPlatformStaff || currentUser?.role === 'platform_employee'
  );
  const isBrandAdmin = currentUser?.role === 'brand_admin';
  const isFranchiseOwner = Boolean(
    currentUser?.isFranchiseOwner ||
      currentUser?.role === 'franchise_owner' ||
      (currentUser?.role === 'admin' && (currentUser?.assignedStoreIds?.length || 0) > 0)
  );

  // Filter outlets accessible to the currently logged in user:
  // - CaféOS Super Admin & Platform Staff see all outlets
  // - Brand Admin (e.g., Burger King HQ) sees all outlets under their organizationId
  // - Franchise Owner sees their specific franchise stores across multiple cities
  const accessibleOutlets = useMemo(() => {
    if (!currentUser || currentUser.role === 'super_admin' || currentUser.role === 'platform_employee') {
      return outlets;
    }
    if (currentUser.role === 'brand_admin' && currentUser.organizationId) {
      const orgOutlets = outlets.filter((o) => o.organizationId === currentUser.organizationId);
      return orgOutlets.length > 0 ? orgOutlets : outlets;
    }
    if (currentUser.assignedStoreIds && currentUser.assignedStoreIds.length > 0) {
      const filtered = outlets.filter(
        (o) =>
          currentUser.assignedStoreIds!.includes(o.id) ||
          o.franchiseOwnerId === currentUser.id
      );
      return filtered.length > 0 ? filtered : [outlets[0]];
    }
    return [outlets[0]];
  }, [currentUser, outlets]);

  // Current active outlet object
  const activeOutlet = useMemo(() => {
    return (
      outlets.find((o) => o.id === activeOutletId) ||
      accessibleOutlets[0] ||
      outlets[0]
    );
  }, [outlets, activeOutletId, accessibleOutlets]);

  // Set active store from anywhere in the app
  const setActiveOutletId = (id: string) => {
    setActiveOutletIdState(id);
    localStorage.setItem('royalpos_active_outlet_id', id);
    const selected = outlets.find((o) => o.id === id);
    if (selected) {
      db.updateSettings(
        {
          name: selected.name,
          address: `${selected.address}, ${selected.city}`,
          phone: selected.phone,
          gstNumber: selected.gstNumber,
          fssaiLicense: selected.fssaiLicense,
          taxRates: [
            { name: 'CGST', percent: (selected.defaultTaxPercent || 5) / 2, isInclusive: false },
            { name: 'SGST', percent: (selected.defaultTaxPercent || 5) / 2, isInclusive: false },
          ],
        },
        defaultActor
      );
    }
  };

  const updateOutlet = (id: string, updates: Partial<Outlet>) => {
    setOutlets((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const addOutlet = (newOutletData: Omit<Outlet, 'id'>): Outlet => {
    const newOutlet: Outlet = {
      ...newOutletData,
      id: `out-${Date.now().toString(36)}`,
    };
    setOutlets((prev) => [...prev, newOutlet]);
    return newOutlet;
  };

  // Offline Sync State
  const [syncStats, setSyncStats] = useState<OfflineSyncStats>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSimulatedOffline: false,
    isSyncing: false,
    queuedCount: 0,
    syncedCount: 0,
    failedCount: 0,
    lastSyncTime: null,
  });
  const [offlineQueue, setOfflineQueue] = useState<OfflineTransaction[]>([]);

  // Snapshot timer ref
  const snapshotTimerRef = useRef<any>(null);

  // Catalog & Offers Sync State
  const [catalogManifest, setCatalogManifest] = useState<CatalogManifest>(() =>
    catalogSyncService.getManifest()
  );
  const [hasCatalogUpdate, setHasCatalogUpdate] = useState<boolean>(() =>
    catalogSyncService.hasPendingAdminUpdates()
  );
  const [isCatalogSyncing, setIsCatalogSyncing] = useState<boolean>(false);
  const [lastCatalogSyncResult, setLastCatalogSyncResult] = useState<CatalogSyncResult | null>(null);
  const [isCatalogSyncModalOpen, setIsCatalogSyncModalOpen] = useState<boolean>(false);

  // Listen to Catalog Sync Service changes & global open modal event
  useEffect(() => {
    const unsubscribeCatalog = catalogSyncService.subscribe((manifest, lastResult) => {
      setCatalogManifest(manifest);
      setLastCatalogSyncResult(lastResult);
      setHasCatalogUpdate(catalogSyncService.hasPendingAdminUpdates());
    });

    const handleOpenCatalogModal = () => setIsCatalogSyncModalOpen(true);
    window.addEventListener('open-catalog-sync-modal', handleOpenCatalogModal);

    return () => {
      unsubscribeCatalog();
      window.removeEventListener('open-catalog-sync-modal', handleOpenCatalogModal);
    };
  }, []);

  const syncCatalogFromAdmin = async (force: boolean = false): Promise<CatalogSyncResult> => {
    setIsCatalogSyncing(true);
    try {
      const result = await catalogSyncService.syncCatalogFromAdmin(state, force);
      setHasCatalogUpdate(false);
      return result;
    } finally {
      setIsCatalogSyncing(false);
    }
  };

  const exportCatalogPackage = () => {
    if (state) {
      catalogSyncService.exportCatalogPackage(state);
    }
  };

  const importCatalogPackage = async (jsonStr: string): Promise<CatalogSyncResult> => {
    const result = await catalogSyncService.importCatalogPackage(jsonStr, (catalog) => {
      db.applyCatalogImport(catalog, defaultActor);
    });
    return result;
  };

  const applyCatalogImport = (catalogData: any) => {
    db.applyCatalogImport(catalogData, defaultActor);
  };

  // Listen to in-memory Database changes & auto-persist snapshot to IndexedDB
  useEffect(() => {
    const unsubscribe = db.subscribe((newState) => {
      setState(newState);

      // Debounced IndexedDB Snapshot Save
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
      snapshotTimerRef.current = setTimeout(() => {
        indexedDBStorage.saveDatabaseSnapshot(newState).catch((err) => {
          console.warn('[RestaurantContext] Snapshot save error:', err);
        });
      }, 1000);
    });

    return () => {
      unsubscribe();
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    };
  }, []);

  // Listen to Offline Sync Service changes & global open modal event
  useEffect(() => {
    const unsubscribeSync = offlineSyncService.subscribe((newStats, queue) => {
      setSyncStats(newStats);
      setOfflineQueue(queue);
    });

    const handleOpenSyncModal = () => setIsSyncModalOpen(true);
    window.addEventListener('open-sync-modal', handleOpenSyncModal);

    return () => {
      unsubscribeSync();
      window.removeEventListener('open-sync-modal', handleOpenSyncModal);
    };
  }, []);

  const defaultActor: User = currentUser || {
    id: 'usr-sys',
    name: 'System User',
    email: 'system@cafeos.com',
    phone: '',
    role: 'super_admin',
    branchId: 'branch-1',
    isActive: true,
    maxDiscountPercent: 100,
  };

  const actorInfo = {
    id: defaultActor.id,
    name: defaultActor.name,
    role: defaultActor.role,
  };

  // Helper to enqueue offline transaction
  const queueTx = (
    type: OfflineTransaction['type'],
    payload: any,
    description: string,
    amount?: number,
    entityId?: string
  ) => {
    offlineSyncService
      .queueTransaction(type, payload, actorInfo, description, amount, entityId)
      .catch((err) => console.warn('[RestaurantContext] Failed to queue transaction:', err));
  };

  // ----------------------------------------------------
  // ORDER & PAYMENT ACTIONS (WITH INDEXEDDB QUEUEING)
  // ----------------------------------------------------

  const createOrder = (orderData: Partial<Order>): Order => {
    const order = db.createOrder(orderData, defaultActor);
    playNewOrderKitchenChime();
    queueTx(
      'CREATE_ORDER',
      order,
      `New ${order.orderType.toUpperCase()} Order #${order.id.slice(-4)} (${order.items.length} items)`,
      order.grandTotal,
      order.id
    );
    return order;
  };

  const addItemsToOrder = (orderId: string, newItems: OrderItem[]) => {
    const order = db.addItemsToOrder(orderId, newItems, defaultActor);
    if (order) {
      playNewOrderKitchenChime();
      queueTx(
        'ADD_ITEMS_TO_ORDER',
        { orderId, newItems },
        `Added ${newItems.length} items to Order #${order.orderNumber}`,
        undefined,
        orderId
      );
    }
    return order;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    db.updateOrderStatus(orderId, status, defaultActor);
    if (status === 'ready') {
      playKitchenReadyChime();
    }
    queueTx(
      'UPDATE_ORDER_STATUS',
      { orderId, status },
      `Order #${orderId.slice(-4)} status -> ${status}`,
      undefined,
      orderId
    );
  };

  const updateOrderItemKitchenStatus = (
    orderId: string,
    itemId: string,
    itemKitchenStatus: 'pending' | 'preparing' | 'ready' | 'served'
  ) => {
    const order = db.updateOrderItemKitchenStatus(orderId, itemId, itemKitchenStatus, defaultActor);
    if (itemKitchenStatus === 'ready') {
      playKitchenReadyChime();
    }
    queueTx(
      'UPDATE_ITEM_KITCHEN_STATUS',
      { orderId, itemId, itemKitchenStatus },
      `Item in Order #${orderId.slice(-4)} -> ${itemKitchenStatus}`,
      undefined,
      orderId
    );
    return order;
  };

  const processPayment = (
    orderId: string,
    payments: PaymentAllocation[],
    discountAmount = 0,
    discountReason?: string
  ) => {
    const order = db.processOrderPayment(orderId, payments, defaultActor, discountAmount, discountReason);
    if (order) {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      queueTx(
        'PROCESS_PAYMENT',
        { orderId, payments, discountAmount, discountReason },
        `Payment of $${totalPaid.toFixed(2)} for Order #${orderId.slice(-4)}`,
        totalPaid,
        orderId
      );
    }
    return order;
  };

  const cancelOrder = (orderId: string, reason: string) => {
    db.cancelOrder(orderId, reason, defaultActor);
    queueTx('CANCEL_ORDER', { orderId, reason }, `Cancelled Order #${orderId.slice(-4)}`, undefined, orderId);
  };

  const processRefund = (orderId: string, amount: number, reason: string, method: PaymentMethod) => {
    db.processRefund(orderId, amount, reason, method, defaultActor);
    queueTx(
      'PROCESS_REFUND',
      { orderId, amount, reason, method },
      `Refund of $${amount.toFixed(2)} for Order #${orderId.slice(-4)}`,
      amount,
      orderId
    );
  };

  // ----------------------------------------------------
  // CUSTOMER & LOYALTY ACTIONS
  // ----------------------------------------------------
  const linkOrderCustomer = (
    orderId: string,
    customerData: {
      customerId?: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
    }
  ) => {
    return db.linkOrderCustomer(orderId, customerData, defaultActor);
  };

  const applyLoyaltyDiscountToOrder = (
    orderId: string,
    pointsToRedeem: number,
    discountAmount: number,
    couponCode: string,
    rewardTitle: string
  ) => {
    return db.applyLoyaltyDiscountToOrder(
      orderId,
      pointsToRedeem,
      discountAmount,
      couponCode,
      rewardTitle,
      defaultActor
    );
  };

  const removeOrderLoyaltyDiscount = (orderId: string) => {
    return db.removeOrderLoyaltyDiscount(orderId, defaultActor);
  };

  const addCustomer = (
    customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend'> & { initialPoints?: number }
  ) => {
    return db.addCustomer(customerData, defaultActor);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    db.updateCustomer(id, updates, defaultActor);
  };

  const adjustCustomerPoints = (customerId: string, pointsDelta: number, reason: string) => {
    return db.adjustCustomerPoints(customerId, pointsDelta, reason, defaultActor);
  };

  // ----------------------------------------------------
  // MENU ACTIONS
  // ----------------------------------------------------
  const addCategory = (cat: Omit<Category, 'id'>) => db.addCategory(cat, defaultActor);
  const updateCategory = (id: string, updates: Partial<Category>) => db.updateCategory(id, updates, defaultActor);
  const deleteCategory = (id: string) => db.deleteCategory(id, defaultActor);

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => db.addMenuItem(item, defaultActor);
  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => db.updateMenuItem(id, updates, defaultActor);
  const deleteMenuItem = (id: string) => db.deleteMenuItem(id, defaultActor);

  const addModifier = (mod: Omit<MenuModifier, 'id'>) => db.addModifier(mod, defaultActor);
  const updateModifier = (id: string, updates: Partial<MenuModifier>) => db.updateModifier(id, updates, defaultActor);
  const deleteModifier = (id: string) => db.deleteModifier(id, defaultActor);

  const saveRecipe = (recipe: Omit<Recipe, 'id'> & { id?: string }) => db.saveRecipe(recipe, defaultActor);
  const deleteRecipe = (id: string) => db.deleteRecipe(id, defaultActor);

  // ----------------------------------------------------
  // INVENTORY ACTIONS
  // ----------------------------------------------------
  const addIngredient = (ing: Omit<Ingredient, 'id'>) => db.addIngredient(ing, defaultActor);
  const updateIngredient = (id: string, updates: Partial<Ingredient>) => db.updateIngredient(id, updates, defaultActor);
  const deleteIngredient = (id: string) => db.deleteIngredient(id, defaultActor);
  const bulkImportIngredients = (
    items: Array<{
      name: string;
      category?: string;
      unit?: UnitType;
      purchaseUnit?: UnitType;
      conversionFactor?: number;
      supplierId?: string;
      costPerUnit: number;
      quantity: number;
      minStock?: number;
      reorderLevel?: number;
      maxStock?: number;
      storageLocation?: string;
    }>,
    mode: 'add_to_existing' | 'overwrite_stock' | 'create_only'
  ) => db.bulkImportIngredients(items, mode, defaultActor);
  const addSupplier = (sup: Omit<Supplier, 'id'>) => db.addSupplier(sup, defaultActor);
  const updateSupplier = (id: string, updates: Partial<Supplier>) => db.updateSupplier(id, updates, defaultActor);

  const addTable = (table: Omit<RestaurantTable, 'id'>) => db.addTable(table, defaultActor);
  const updateTable = (id: string, updates: Partial<RestaurantTable>) => db.updateTable(id, updates, defaultActor);
  const clearTableStatus = (tableId: string) => db.clearTableStatus(tableId, defaultActor);
  const deleteTable = (id: string) => db.deleteTable(id, defaultActor);

  const addExpense = (expense: Omit<Expense, 'id'>) => db.addExpense(expense, defaultActor);

  const addPurchaseOrder = (po: Omit<PurchaseOrder, 'id'>) => {
    const res = db.addPurchaseOrder(po, defaultActor);
    queueTx('ADD_PURCHASE_ORDER', res, `Purchase Order #${res.id.slice(-4)} created`, res.grandTotal, res.id);
    return res;
  };

  const receivePurchaseOrder = (poId: string, invoiceNumber?: string) => {
    db.receivePurchaseOrder(poId, defaultActor, invoiceNumber);
    queueTx('RECEIVE_PURCHASE_ORDER', { poId, invoiceNumber }, `PO #${poId.slice(-4)} received`, undefined, poId);
  };

  const recordWastage = (waste: Omit<WastageRecord, 'id' | 'date'>) => {
    const res = db.recordWastage(waste, defaultActor);
    queueTx('RECORD_WASTAGE', res, `Wastage logged: ${res.ingredientName}`, res.totalCost, res.id);
    return res;
  };

  const submitStockCount = (count: Omit<StockCount, 'id' | 'date'>) => {
    const res = db.submitStockCount(count, defaultActor);
    queueTx('SUBMIT_STOCK_COUNT', res, `Stock Count submitted #${res.id.slice(-4)}`, undefined, res.id);
    return res;
  };

  const approveStockCount = (countId: string) => db.approveStockCount(countId, defaultActor);

  // ----------------------------------------------------
  // SHIFTS & CLOSING
  // ----------------------------------------------------
  const openShift = (openingCash: number) => {
    db.openShift(defaultActor.id, defaultActor.name, openingCash, defaultActor);
    queueTx('OPEN_SHIFT', { openingCash }, `Opening Shift with $${openingCash}`, openingCash);
  };

  const closeShift = (shiftId: string, actualCash: number, notes: string) => {
    db.closeShift(shiftId, actualCash, notes, defaultActor);
    queueTx('CLOSE_SHIFT', { shiftId, actualCash, notes }, `Closing Shift #${shiftId.slice(-4)}`, actualCash, shiftId);
  };

  const executeDailyClosing = (date: string, actualCash: number, notes: string) => {
    db.executeDailyClosing(date, actualCash, notes, defaultActor);
  };

  // ----------------------------------------------------
  // DELIVERY & RIDERS
  // ----------------------------------------------------
  const assignRider = (orderId: string, riderId: string) => {
    db.assignRider(orderId, riderId, defaultActor);
    queueTx('ASSIGN_RIDER', { orderId, riderId }, `Assigned rider to order #${orderId.slice(-4)}`, undefined, orderId);
  };

  const updateDeliveryStatus = (orderId: string, status: Order['deliveryStatus']) => {
    db.updateDeliveryStatus(orderId, status, defaultActor);
    queueTx('UPDATE_DELIVERY_STATUS', { orderId, status }, `Order #${orderId.slice(-4)} delivery -> ${status}`, undefined, orderId);
  };

  // ----------------------------------------------------
  // SOP & TASKS
  // ----------------------------------------------------
  const generateDailySOPTasks = (outletId?: string) => db.generateDailySOPTasks(outletId);

  const publishSOPTaskForToday = (sopMasterId: string, targetOutletId?: string) =>
    db.publishSOPTaskForToday(sopMasterId, defaultActor, targetOutletId);

  const submitSOPTask = (taskId: string, results: SOPTask['results']) => {
    db.submitSOPTask(taskId, results, defaultActor);
    queueTx('SUBMIT_SOP_TASK', { taskId, results }, `SOP Task completed #${taskId.slice(-4)}`, undefined, taskId);
  };

  const reviewSOPTask = (taskId: string, reviewStatus: 'approved' | 'rejected', notes: string) =>
    db.reviewSOPTask(taskId, reviewStatus, notes, defaultActor);

  const addSOPMaster = (sop: Omit<SOPMaster, 'id' | 'createdAt'>) => db.addSOPMaster(sop, defaultActor);
  const updateSOPMaster = (id: string, updates: Partial<SOPMaster>) => db.updateSOPMaster(id, updates, defaultActor);

  // ----------------------------------------------------
  // EQUIPMENT & MAINTENANCE
  // ----------------------------------------------------
  const addEquipment = (eq: Omit<Equipment, 'id'>) => db.addEquipment(eq, defaultActor);
  const updateEquipment = (id: string, updates: Partial<Equipment>) => db.updateEquipment(id, updates, defaultActor);
  const logMaintenance = (maint: Omit<MaintenanceRecord, 'id'>) => db.logMaintenance(maint, defaultActor);

  // ----------------------------------------------------
  // COUPONS & OFFERS PROMOTIONS
  // ----------------------------------------------------
  const addCoupon = (coupon: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'totalDiscountGiven' | 'totalRevenueGenerated'>) =>
    db.addCoupon(coupon, defaultActor);
  const updateCoupon = (id: string, updates: Partial<Coupon>) =>
    db.updateCoupon(id, updates, defaultActor);
  const toggleCouponStatus = (id: string) =>
    db.toggleCouponStatus(id, defaultActor);
  const deleteCoupon = (id: string) =>
    db.deleteCoupon(id, defaultActor);
  const recordCouponUsage = (couponId: string, discountAmount: number, grandTotal: number) =>
    db.recordCouponUsage(couponId, discountAmount, grandTotal);

  // ----------------------------------------------------
  // SETTINGS & HELPERS
  // ----------------------------------------------------
  const updateSettings = (settings: Partial<RestaurantSettings>) => db.updateSettings(settings, defaultActor);

  // Keep settings synced with active organization branding
  useEffect(() => {
    if (activeOrganization) {
      updateSettings({
        name: activeOrganization.name,
        logoUrl: activeOrganization.logo || '',
        gstNumber: activeOrganization.gstNumber || undefined,
        fssaiLicense: activeOrganization.fssaiLicense || undefined,
        tagline: activeOrganization.tagline || undefined,
        receiptHeader: activeOrganization.customReceiptHeader || undefined,
        receiptFooter: activeOrganization.customReceiptFooter || undefined,
      });
    }
  }, [
    activeOrganization?.id,
    activeOrganization?.name,
    activeOrganization?.logo,
    activeOrganization?.gstNumber,
    activeOrganization?.customReceiptHeader,
    activeOrganization?.customReceiptFooter,
  ]);
  const markNotificationRead = (id: string) => db.markNotificationRead(id);
  const clearAllNotifications = () => db.clearAllNotifications();
  const resetDatabase = () => db.resetToDefault();

  // Offline controls
  const toggleSimulatedOffline = (force?: boolean) => {
    const nextVal = force !== undefined ? force : !syncStats.isSimulatedOffline;
    offlineSyncService.setSimulatedOffline(nextVal);
  };

  const syncNow = async () => {
    await offlineSyncService.processQueue();
  };

  const retryTransaction = async (id: string) => {
    await offlineSyncService.retryTransaction(id);
  };

  const deleteOfflineTransaction = async (id: string) => {
    await offlineSyncService.deleteTransaction(id);
  };

  const clearSyncedTransactions = async () => {
    return await offlineSyncService.clearSynced();
  };

  const effectiveOnline = syncStats.isSimulatedOffline ? false : syncStats.isOnline;

  return (
    <RestaurantContext.Provider
      value={{
        state,
        settings: state?.settings || {} as any,
        orders: state?.orders || [],
        tables: state?.tables || [],
        customers: state?.customers || [],
        menuItems: state?.menuItems || [],
        categories: state?.categories || [],
        modifiers: state?.modifiers || [],
        recipes: state?.recipes || [],
        ingredients: state?.ingredients || [],
        suppliers: state?.suppliers || [],
        purchases: state?.purchases || [],
        wastage: state?.wastage || [],
        stockCounts: state?.stockCounts || [],
        coupons: state?.coupons || [],
        riders: state?.riders || [],
        shifts: state?.shifts || [],
        sopTasks: state?.sopTasks || [],
        sopMasters: state?.sopMasters || [],
        equipment: state?.equipment || [],
        maintenanceRecords: state?.maintenanceRecords || [],
        expenses: state?.expenses || [],
        auditLogs: state?.auditLogs || [],
        notifications: state?.notifications || [],

        receiptModalOrder,
        setReceiptModalOrder,
        kotModalOrder,
        setKOTModalOrder,
        isShiftModalOpen,
        setIsShiftModalOpen,
        isSearchModalOpen,
        setIsSearchModalOpen,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isHamburgerOpen,
        setIsHamburgerOpen,
        adminSubTab,
        setAdminSubTab,

        isOnline: effectiveOnline,
        isSimulatedOffline: syncStats.isSimulatedOffline,
        toggleSimulatedOffline,
        syncStats,
        offlineQueue,
        syncNow,
        retryTransaction,
        deleteOfflineTransaction,
        clearSyncedTransactions,

        catalogManifest,
        hasCatalogUpdate,
        isCatalogSyncing,
        lastCatalogSyncResult,
        syncCatalogFromAdmin,
        isCatalogSyncModalOpen,
        setIsCatalogSyncModalOpen,
        exportCatalogPackage,
        importCatalogPackage,
        applyCatalogImport,

        createOrder,
        addItemsToOrder,
        updateOrderStatus,
        updateOrderItemKitchenStatus,
        processPayment,
        cancelOrder,
        processRefund,

        linkOrderCustomer,
        applyLoyaltyDiscountToOrder,
        removeOrderLoyaltyDiscount,
        addCustomer,
        updateCustomer,
        adjustCustomerPoints,

        addCategory,
        updateCategory,
        deleteCategory,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addModifier,
        updateModifier,
        deleteModifier,
        saveRecipe,
        deleteRecipe,

        addIngredient,
        updateIngredient,
        deleteIngredient,
        bulkImportIngredients,
        addSupplier,
        updateSupplier,
        addPurchaseOrder,
        receivePurchaseOrder,
        recordWastage,
        submitStockCount,
        approveStockCount,

        addTable,
        updateTable,
        clearTableStatus,
        deleteTable,

        addExpense,

        openShift,
        closeShift,
        executeDailyClosing,

        assignRider,
        updateDeliveryStatus,

        generateDailySOPTasks,
        publishSOPTaskForToday,
        submitSOPTask,
        reviewSOPTask,
        addSOPMaster,
        updateSOPMaster,

        addEquipment,
        updateEquipment,
        logMaintenance,

        addCoupon,
        updateCoupon,
        toggleCouponStatus,
        deleteCoupon,
        recordCouponUsage,

        updateSettings,
        markNotificationRead,
        clearAllNotifications,
        resetDatabase,

        // Multi-Store, Multi-Brand & Multi-Franchise Multi-Tenancy
        organizations,
        activeOrganizationId,
        activeOrganization,
        setActiveOrganizationId,
        addOrganization,
        updateOrganization,
        outlets,
        activeOutletId,
        activeOutlet,
        accessibleOutlets,
        setActiveOutletId,
        updateOutlet,
        addOutlet,
        franchiseGroups,
        addFranchiseGroup,
        updateFranchiseGroup,
        interStoreTransfers,
        createInterStoreTransfer,
        updateTransferStatus,
        isConsolidatedStoreView,
        setIsConsolidatedStoreView,
        isSuperAdmin,
        isFranchiseOwner,
        isBrandAdmin,
        isPlatformStaff,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
