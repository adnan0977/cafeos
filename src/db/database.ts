import {
  AuditLog,
  CashierShift,
  Category,
  Coupon,
  Customer,
  DailyClosing,
  DeliveryZone,
  Equipment,
  Expense,
  Ingredient,
  InventoryBatch,
  InventoryTransaction,
  LoyaltyRewardOption,
  LoyaltyTier,
  LoyaltyTransaction,
  MaintenanceRecord,
  MenuItem,
  MenuModifier,
  NotificationItem,
  Order,
  OrderItem,
  PaymentAllocation,
  PaymentMethod,
  PurchaseOrder,
  Recipe,
  RefundRecord,
  RestaurantSettings,
  RestaurantTable,
  Rider,
  SOPMaster,
  SOPTask,
  StockCount,
  Supplier,
  UnitType,
  User,
  WastageRecord,
} from '../types';

import { calculatePointsToEarn, getCustomerTierInfo } from '../utils/loyaltyUtils';
import { catalogSyncService } from '../services/catalogSyncService';

import {
  INITIAL_SETTINGS,
  SEED_CATEGORIES,
  SEED_COUPONS,
  SEED_CUSTOMERS,
  SEED_EQUIPMENT,
  SEED_INGREDIENTS,
  SEED_MENU_ITEMS,
  SEED_MODIFIERS,
  SEED_ORDERS,
  SEED_PURCHASES,
  SEED_RECIPES,
  SEED_RIDERS,
  SEED_SOP_MASTERS,
  SEED_SOP_TASKS,
  SEED_SUPPLIERS,
  SEED_TABLES,
  SEED_USERS,
  SEED_WASTAGE,
} from './seedData';

const STORAGE_KEY = 'zorko_pos_v2';

export interface DatabaseState {
  settings: RestaurantSettings;
  users: User[];
  categories: Category[];
  menuItems: MenuItem[];
  modifiers: MenuModifier[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  batches: InventoryBatch[];
  transactions: InventoryTransaction[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  wastage: WastageRecord[];
  stockCounts: StockCount[];
  tables: RestaurantTable[];
  customers: Customer[];
  riders: Rider[];
  orders: Order[];
  refunds: RefundRecord[];
  shifts: CashierShift[];
  dailyClosings: DailyClosing[];
  expenses: Expense[];
  deliveryZones: DeliveryZone[];
  sopMasters: SOPMaster[];
  sopTasks: SOPTask[];
  equipment: Equipment[];
  maintenanceRecords: MaintenanceRecord[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  coupons: Coupon[];
}

type Listener = (state: DatabaseState) => void;

class RestaurantDatabase {
  private state: DatabaseState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadState();
    this.ensureInitialShift();
  }

  private loadState(): DatabaseState {
    const initial = this.getInitialState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Merge ingredients
          const parsedIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients.filter(Boolean) : [];
          const existingIngIds = new Set(parsedIngredients.map((i: any) => i.id));
          const mergedIngredients = [
            ...parsedIngredients,
            ...(initial.ingredients || []).filter((i) => !existingIngIds.has(i.id)),
          ];

          // Merge suppliers
          const parsedSuppliers = Array.isArray(parsed.suppliers) ? parsed.suppliers.filter(Boolean) : [];
          const existingSupIds = new Set(parsedSuppliers.map((s: any) => s.id));
          const mergedSuppliers = [
            ...parsedSuppliers,
            ...(initial.suppliers || []).filter((s) => !existingSupIds.has(s.id)),
          ];

          // Merge recipes
          const parsedRecipes = Array.isArray(parsed.recipes) ? parsed.recipes.filter(Boolean) : [];
          const existingRecIds = new Set(parsedRecipes.map((r: any) => r.id));
          const mergedRecipes = [
            ...parsedRecipes,
            ...(initial.recipes || []).filter((r) => !existingRecIds.has(r.id)),
          ];

          // Merge users
          const parsedUsers = Array.isArray(parsed.users) ? parsed.users.filter(Boolean) : [];
          const existingUserIds = new Set(parsedUsers.map((u: any) => u.id));
          const mergedUsers = [
            ...parsedUsers.map((pu: any) => {
              const seedMatch = initial.users.find((su) => su.id === pu.id || su.email.toLowerCase() === (pu.email || '').toLowerCase());
              return {
                ...pu,
                password: pu.password || seedMatch?.password || 'password123',
                allowedPortals: pu.allowedPortals || seedMatch?.allowedPortals || ['sop'],
                allowedAppLogons: pu.allowedAppLogons || seedMatch?.allowedAppLogons || ['android_app', 'windows_app'],
                appLoginCode: pu.appLoginCode || seedMatch?.appLoginCode || ('AND-' + Math.floor(1000 + Math.random() * 9000)),
                windowsStationId: pu.windowsStationId || seedMatch?.windowsStationId || 'POS-WIN-01',
                devicePairingToken: pu.devicePairingToken || seedMatch?.devicePairingToken || ('ZORKO-PAIR-' + (pu.id || 'USR')),
                createdAt: pu.createdAt || seedMatch?.createdAt || new Date().toISOString(),
              };
            }),
            ...(initial.users || []).filter((u) => !existingUserIds.has(u.id) && !parsedUsers.some((pu: any) => pu.email.toLowerCase() === u.email.toLowerCase())),
          ];

          return {
            settings: { ...initial.settings, ...(parsed.settings || {}) },
            users: mergedUsers.length > 0 ? mergedUsers : initial.users,
            categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : initial.categories,
            menuItems: (Array.isArray(parsed.menuItems) && parsed.menuItems.length > 0 ? parsed.menuItems : (initial.menuItems || [])).filter(Boolean).map((m: any) => ({
              ...m,
              modifierIds: Array.isArray(m?.modifierIds) ? m.modifierIds : [],
              variants: Array.isArray(m?.variants) ? m.variants : [],
            })),
            modifiers: Array.isArray(parsed.modifiers) && parsed.modifiers.length > 0 ? parsed.modifiers : initial.modifiers,
            recipes: mergedRecipes.length > 0 ? mergedRecipes : initial.recipes,
            ingredients: mergedIngredients.length > 0 ? mergedIngredients : initial.ingredients,
            batches: Array.isArray(parsed.batches) ? parsed.batches : initial.batches,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : initial.transactions,
            suppliers: mergedSuppliers.length > 0 ? mergedSuppliers : initial.suppliers,
            purchases: Array.isArray(parsed.purchases) ? parsed.purchases : initial.purchases,
            wastage: Array.isArray(parsed.wastage) ? parsed.wastage : initial.wastage,
            stockCounts: Array.isArray(parsed.stockCounts) ? parsed.stockCounts : initial.stockCounts,
            tables: Array.isArray(parsed.tables) && parsed.tables.length > 0 ? parsed.tables : initial.tables,
            customers: Array.isArray(parsed.customers) ? parsed.customers : initial.customers,
            riders: Array.isArray(parsed.riders) ? parsed.riders : initial.riders,
            orders: (Array.isArray(parsed.orders) ? parsed.orders : (initial.orders || [])).filter(Boolean).map((o: any) => ({
              ...o,
              items: (Array.isArray(o?.items) ? o.items : []).filter(Boolean).map((item: any) => ({
                ...item,
                modifiers: Array.isArray(item?.modifiers) ? item.modifiers : [],
              })),
              payments: Array.isArray(o?.payments) ? o.payments : [],
            })),
            refunds: Array.isArray(parsed.refunds) ? parsed.refunds : initial.refunds,
            shifts: Array.isArray(parsed.shifts) ? parsed.shifts : initial.shifts,
            dailyClosings: Array.isArray(parsed.dailyClosings) ? parsed.dailyClosings : initial.dailyClosings,
            expenses: Array.isArray(parsed.expenses) ? parsed.expenses : initial.expenses,
            deliveryZones: Array.isArray(parsed.deliveryZones) ? parsed.deliveryZones : initial.deliveryZones,
            sopMasters: Array.isArray(parsed.sopMasters) && parsed.sopMasters.length > 0 ? parsed.sopMasters : initial.sopMasters,
            sopTasks: (Array.isArray(parsed.sopTasks) ? parsed.sopTasks : (initial.sopTasks || [])).filter(Boolean).map((t: any) => ({
              ...t,
              results: Array.isArray(t?.results) ? t.results : [],
            })),
            equipment: Array.isArray(parsed.equipment) && parsed.equipment.length > 0 ? parsed.equipment : initial.equipment,
            maintenanceRecords: Array.isArray(parsed.maintenanceRecords) ? parsed.maintenanceRecords : initial.maintenanceRecords,
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : initial.auditLogs,
            notifications: Array.isArray(parsed.notifications) ? parsed.notifications : initial.notifications,
            coupons: Array.isArray(parsed.coupons) && parsed.coupons.length > 0 ? parsed.coupons : initial.coupons,
          };
        }
      }
    } catch (e) {
      console.error('Error loading DB from localStorage:', e);
    }
    return initial;
  }

  private getInitialState(): DatabaseState {
    return {
      settings: INITIAL_SETTINGS,
      users: SEED_USERS,
      categories: SEED_CATEGORIES,
      menuItems: SEED_MENU_ITEMS,
      modifiers: SEED_MODIFIERS,
      recipes: SEED_RECIPES,
      ingredients: SEED_INGREDIENTS,
      batches: [
        {
          id: 'bat-1',
          ingredientId: 'ing-burger-buns',
          batchNumber: 'BAT-BUN-2608-01',
          purchaseDate: '2026-08-22',
          expiryDate: '2026-09-22',
          supplierId: 'SUP-0003',
          initialQuantity: 200,
          remainingQuantity: 180,
          unitCost: 6,
        },
        {
          id: 'bat-2',
          ingredientId: 'ing-french-fries-batons',
          batchNumber: 'BAT-FRY-2608-02',
          purchaseDate: '2026-08-23',
          expiryDate: '2026-11-23',
          supplierId: 'SUP-0001',
          initialQuantity: 25000,
          remainingQuantity: 22400,
          unitCost: 0.09,
        },
      ],
      transactions: [
        {
          id: 'txn-init-1',
          date: '2026-08-22T09:00:00',
          ingredientId: 'ing-burger-buns',
          type: 'purchase',
          quantity: 200,
          unit: 'piece',
          unitCost: 6,
          totalCost: 1200,
          referenceId: 'PO-2026-0001',
          notes: 'Received fresh ZORKO burger buns batch',
          userId: 'usr-1',
          userName: 'Adnan Khan (Owner & Admin)',
        },
      ],
      suppliers: SEED_SUPPLIERS,
      purchases: SEED_PURCHASES,
      wastage: SEED_WASTAGE,
      stockCounts: [],
      tables: SEED_TABLES,
      customers: SEED_CUSTOMERS,
      riders: SEED_RIDERS,
      orders: SEED_ORDERS,
      refunds: [],
      shifts: [
        {
          id: 'shift-today-1',
          userId: 'usr-3',
          userName: 'Pooja Verma (Cashier)',
          startTime: '2026-08-24T08:00:00',
          openingCash: 5000,
          cashSales: 221,
          cashRefunds: 0,
          totalTransactions: 1,
          status: 'open',
        },
      ],
      dailyClosings: [],
      expenses: [
        {
          id: 'exp-1',
          date: '2026-08-23',
          category: 'gas',
          amount: 2400,
          paymentMethod: 'cash',
          description: 'Commercial LPG Cylinder refill (19kg)',
          enteredBy: 'Rohit Sharma (Manager)',
        },
        {
          id: 'exp-2',
          date: '2026-08-24',
          category: 'packaging',
          amount: 1850,
          paymentMethod: 'upi',
          description: 'Emergency brown paper bags & cups purchase',
          enteredBy: 'Pooja Verma',
        },
      ],
      deliveryZones: INITIAL_SETTINGS.deliveryZones,
      sopMasters: SEED_SOP_MASTERS,
      sopTasks: SEED_SOP_TASKS,
      equipment: SEED_EQUIPMENT,
      maintenanceRecords: [
        {
          id: 'maint-1',
          equipmentId: 'eq-1',
          equipmentName: 'La Marzocco Linea PB 2-Group Commercial Espresso Machine',
          date: '2026-08-01',
          type: 'routine',
          cost: 1500,
          performedBy: 'Espresso Care Services',
          notes: 'Group head gaskets replaced, shower screens cleaned, pump pressure calibrated to 9.2 bar',
          status: 'completed',
        },
      ],
      auditLogs: [
        {
          id: 'log-1',
          timestamp: '2026-08-24T08:00:00',
          userId: 'usr-3',
          userName: 'Pooja Verma',
          role: 'cashier',
          action: 'OPEN_SHIFT',
          module: 'Cash Drawer',
          newValue: 'Opened shift with float ₹5,000',
        },
      ],
      notifications: [
        {
          id: 'notif-1',
          title: 'Morning Shift Open',
          message: 'Register counter opened with ₹5,000 float by Pooja Verma.',
          type: 'info',
          timestamp: '2026-08-24T08:00:00',
          isRead: false,
        },
      ],
      coupons: SEED_COUPONS,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error persisting DB to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public resetToDefault(): void {
    this.state = this.getInitialState();
    this.saveState();
  }

  private ensureInitialShift(): void {
    const hasOpenShift = this.state.shifts.some((s) => s.status === 'open');
    if (!hasOpenShift) {
      this.state.shifts.push({
        id: `shift-${Date.now()}`,
        userId: 'usr-3',
        userName: 'Pooja Verma (Cashier)',
        startTime: new Date().toISOString(),
        openingCash: 5000,
        cashSales: 0,
        cashRefunds: 0,
        totalTransactions: 0,
        status: 'open',
      });
      this.saveState();
    }
  }

  // AUDIT LOGGING
  public addAuditLog(
    user: { id: string; name: string; role: string },
    action: string,
    module: string,
    recordId?: string,
    previousValue?: string,
    newValue?: string
  ): void {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      module,
      recordId,
      previousValue,
      newValue,
    };
    this.state.auditLogs.unshift(log);
    // Keep max 500 logs in memory
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.pop();
    }
    this.saveState();
  }

  // NOTIFICATIONS
  public addNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    linkTo?: string
  ): void {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      linkTo,
    };
    this.state.notifications.unshift(notif);
    this.saveState();
  }

  public markNotificationRead(id: string): void {
    this.state.notifications = this.state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.saveState();
  }

  public clearAllNotifications(): void {
    this.state.notifications = [];
    this.saveState();
  }

  // RESTAURANT SETTINGS
  public updateSettings(settings: Partial<RestaurantSettings>, actor: User): void {
    this.state.settings = { ...this.state.settings, ...settings };
    this.addAuditLog(actor, 'UPDATE_SETTINGS', 'Settings', undefined, undefined, 'Updated restaurant configurations');
    this.saveState();
  }

  // MENU & CATEGORIES
  public addCategory(category: Omit<Category, 'id'>, actor: User): Category {
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    this.state.categories.push(newCat);
    this.addAuditLog(actor, 'CREATE_CATEGORY', 'Menu', newCat.id, undefined, newCat.name);
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'category',
        action: 'created',
        title: `Category Created: ${newCat.name}`,
        details: `Icon: ${newCat.icon || '🍽️'}`,
      },
      this.state
    );
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>, actor: User): void {
    this.state.categories = this.state.categories.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    this.addAuditLog(actor, 'UPDATE_CATEGORY', 'Menu', id, undefined, JSON.stringify(updates));
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'category',
        action: 'updated',
        title: `Category Updated`,
        details: JSON.stringify(updates),
      },
      this.state
    );
  }

  public deleteCategory(id: string, actor: User): void {
    const cat = this.state.categories.find((c) => c.id === id);
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    this.addAuditLog(actor, 'DELETE_CATEGORY', 'Menu', id, cat?.name, undefined);
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'category',
        action: 'deleted',
        title: `Category Deleted: ${cat?.name || id}`,
      },
      this.state
    );
  }

  public addMenuItem(item: Omit<MenuItem, 'id'>, actor: User): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    this.state.menuItems.push(newItem);
    this.addAuditLog(actor, 'CREATE_MENU_ITEM', 'Menu', newItem.id, undefined, newItem.name);
    this.saveState();
    const variantCount = newItem.variants?.length || 0;
    const modifierCount = newItem.modifierIds?.length || 0;
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'item',
        action: 'created',
        title: `Menu Item Added: ${newItem.name}`,
        details: `Base Price ₹${newItem.basePrice}, ${variantCount} variants, ${modifierCount} add-on groups`,
      },
      this.state
    );
    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>, actor: User): void {
    const prev = this.state.menuItems.find((i) => i.id === id);
    this.state.menuItems = this.state.menuItems.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    this.addAuditLog(actor, 'UPDATE_MENU_ITEM', 'Menu', id, prev?.name, JSON.stringify(updates));
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'item',
        action: 'updated',
        title: `Menu Item Updated: ${prev?.name || id}`,
        details: JSON.stringify(updates),
      },
      this.state
    );
  }

  public deleteMenuItem(id: string, actor: User): void {
    const item = this.state.menuItems.find((i) => i.id === id);
    this.state.menuItems = this.state.menuItems.filter((i) => i.id !== id);
    this.addAuditLog(actor, 'DELETE_MENU_ITEM', 'Menu', id, item?.name, undefined);
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'item',
        action: 'deleted',
        title: `Menu Item Deleted: ${item?.name || id}`,
      },
      this.state
    );
  }

  public addModifier(modifier: Omit<MenuModifier, 'id'>, actor: User): MenuModifier {
    const newMod: MenuModifier = {
      ...modifier,
      id: `mod-${Date.now()}`,
    };
    this.state.modifiers.push(newMod);
    this.addAuditLog(actor, 'CREATE_MODIFIER', 'Menu', newMod.id, undefined, newMod.name);
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'modifier',
        action: 'created',
        title: `Add-on / Modifier Created: ${newMod.name}`,
        details: `Price: +₹${newMod.price}`,
      },
      this.state
    );
    return newMod;
  }

  public updateModifier(id: string, updates: Partial<MenuModifier>, actor: User): void {
    this.state.modifiers = this.state.modifiers.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    this.addAuditLog(actor, 'UPDATE_MODIFIER', 'Menu', id, undefined, JSON.stringify(updates));
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'modifier',
        action: 'updated',
        title: `Add-on / Modifier Updated`,
        details: JSON.stringify(updates),
      },
      this.state
    );
  }

  public deleteModifier(id: string, actor: User): void {
    this.state.modifiers = this.state.modifiers.filter((m) => m.id !== id);
    this.addAuditLog(actor, 'DELETE_MODIFIER', 'Menu', id);
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'modifier',
        action: 'deleted',
        title: `Add-on / Modifier Removed: ${id}`,
      },
      this.state
    );
  }

  // RECIPES
  public saveRecipe(recipeData: Omit<Recipe, 'id'> & { id?: string }, actor: User): Recipe {
    let recipe: Recipe;
    if (recipeData.id) {
      recipe = { ...recipeData, id: recipeData.id };
      this.state.recipes = this.state.recipes.map((r) => (r.id === recipe.id ? recipe : r));
      this.addAuditLog(actor, 'UPDATE_RECIPE', 'Recipes', recipe.id);
    } else {
      recipe = { ...recipeData, id: `rec-${Date.now()}` };
      this.state.recipes.push(recipe);
      this.addAuditLog(actor, 'CREATE_RECIPE', 'Recipes', recipe.id);
    }
    // Link recipe to menu item
    this.state.menuItems = this.state.menuItems.map((m) =>
      m.id === recipe.menuItemId ? { ...m, recipeId: recipe.id } : m
    );
    this.saveState();
    return recipe;
  }

  public deleteRecipe(id: string, actor: User): void {
    const rec = this.state.recipes.find((r) => r.id === id);
    this.state.recipes = this.state.recipes.filter((r) => r.id !== id);
    if (rec) {
      this.state.menuItems = this.state.menuItems.map((m) =>
        m.id === rec.menuItemId ? { ...m, recipeId: undefined } : m
      );
    }
    this.addAuditLog(actor, 'DELETE_RECIPE', 'Recipes', id);
    this.saveState();
  }

  // INVENTORY & STOCK TRANSACTIONS
  public addIngredient(ingredient: Omit<Ingredient, 'id'>, actor: User): Ingredient {
    const newIng: Ingredient = {
      ...ingredient,
      id: `ing-${Date.now()}`,
    };
    this.state.ingredients.push(newIng);

    // If opening stock > 0, log opening stock transaction
    if (newIng.openingStock > 0) {
      const txn: InventoryTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date().toISOString(),
        ingredientId: newIng.id,
        type: 'opening_stock',
        quantity: newIng.openingStock,
        unit: newIng.unit,
        unitCost: newIng.costPerUnit,
        totalCost: newIng.openingStock * newIng.costPerUnit,
        notes: 'Initial opening stock',
        userId: actor.id,
        userName: actor.name,
      };
      this.state.transactions.unshift(txn);
    }

    this.addAuditLog(actor, 'CREATE_INGREDIENT', 'Inventory', newIng.id, undefined, newIng.name);
    this.saveState();
    return newIng;
  }

  public updateIngredient(id: string, updates: Partial<Ingredient>, actor: User): void {
    this.state.ingredients = this.state.ingredients.map((ing) =>
      ing.id === id ? { ...ing, ...updates } : ing
    );
    this.addAuditLog(actor, 'UPDATE_INGREDIENT', 'Inventory', id, undefined, JSON.stringify(updates));
    this.saveState();
  }

  public deleteIngredient(id: string, actor: User): void {
    this.state.ingredients = this.state.ingredients.filter((i) => i.id !== id);
    this.addAuditLog(actor, 'DELETE_INGREDIENT', 'Inventory', id);
    this.saveState();
  }

  public bulkImportIngredients(
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
    mode: 'add_to_existing' | 'overwrite_stock' | 'create_only',
    actor: User
  ): { addedCount: number; updatedCount: number } {
    let addedCount = 0;
    let updatedCount = 0;

    items.forEach((item) => {
      const cleanName = item.name.trim();
      if (!cleanName) return;

      const existing = this.state.ingredients.find(
        (i) => i.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existing && mode !== 'create_only') {
        const prevStock = existing.currentStock;
        const newStock =
          mode === 'add_to_existing'
            ? prevStock + item.quantity
            : item.quantity;

        const diff = newStock - prevStock;

        existing.currentStock = newStock;
        if (item.costPerUnit > 0) existing.costPerUnit = item.costPerUnit;
        if (item.minStock !== undefined) existing.minStock = item.minStock;
        if (item.storageLocation) existing.storageLocation = item.storageLocation;
        if (item.category) existing.category = item.category;

        if (Math.abs(diff) > 0.0001) {
          const txn: InventoryTransaction = {
            id: `txn-bulk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString(),
            ingredientId: existing.id,
            type: diff > 0 ? 'adjustment_add' : 'adjustment_remove',
            quantity: diff,
            unit: existing.unit,
            unitCost: existing.costPerUnit,
            totalCost: Math.abs(diff) * existing.costPerUnit,
            notes: `Bulk import update (${mode === 'add_to_existing' ? 'Added to stock' : 'Stock level overwritten'})`,
            userId: actor.id,
            userName: actor.name,
          };
          this.state.transactions.unshift(txn);
        }

        updatedCount++;
      } else if (!existing || mode === 'create_only') {
        const newId = `ing-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const defaultUnit = item.unit || 'kg';
        const newIng: Ingredient = {
          id: newId,
          name: cleanName,
          category: item.category || 'General Raw',
          unit: defaultUnit,
          purchaseUnit: item.purchaseUnit || defaultUnit,
          conversionFactor: item.conversionFactor || 1,
          supplierId: item.supplierId || this.state.suppliers[0]?.id || 'SUP-0001',
          costPerUnit: item.costPerUnit || 0,
          openingStock: item.quantity || 0,
          currentStock: item.quantity || 0,
          minStock: item.minStock || 5,
          reorderLevel: item.reorderLevel || 10,
          maxStock: item.maxStock || 100,
          storageLocation: item.storageLocation || 'Dry Pantry',
          hasExpiry: false,
          isActive: true,
        };

        this.state.ingredients.push(newIng);

        if (newIng.openingStock > 0) {
          const txn: InventoryTransaction = {
            id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString(),
            ingredientId: newIng.id,
            type: 'opening_stock',
            quantity: newIng.openingStock,
            unit: newIng.unit,
            unitCost: newIng.costPerUnit,
            totalCost: newIng.openingStock * newIng.costPerUnit,
            notes: 'Bulk import new ingredient opening stock',
            userId: actor.id,
            userName: actor.name,
          };
          this.state.transactions.unshift(txn);
        }

        addedCount++;
      }
    });

    this.addAuditLog(
      actor,
      'BULK_IMPORT_INGREDIENTS',
      'Inventory',
      undefined,
      undefined,
      `Imported ${addedCount} new ingredients, updated ${updatedCount} existing items`
    );

    this.addNotification(
      'Bulk Stock Import Complete',
      `Successfully processed ${addedCount + updatedCount} ingredients (${addedCount} added, ${updatedCount} updated).`,
      'success'
    );

    this.saveState();
    return { addedCount, updatedCount };
  }

  // INVENTORY CONSUMPTION LOGIC (Triggered on order completed/paid)
  public consumeInventoryForOrder(order: Order, actor: User): void {
    order.items.forEach((item) => {
      // Find menu item and recipe
      const menuItem = this.state.menuItems.find((m) => m.id === item.menuItemId);
      if (!menuItem || !menuItem.recipeId) return;

      const recipe = this.state.recipes.find((r) => r.id === menuItem.recipeId);
      if (!recipe || !recipe.items) return;

      recipe.items.forEach((recItem) => {
        const ing = this.state.ingredients.find((i) => i.id === recItem.ingredientId);
        if (!ing) return;

        const totalLossMult = 1 + (recItem.prepLossPercent || 0) / 100;
        const totalQtyToDeduct = recItem.quantity * item.quantity * totalLossMult;

        // Deduct from currentStock
        const newStock = Math.max(0, ing.currentStock - totalQtyToDeduct);
        ing.currentStock = newStock;

        // Log transaction
        const txn: InventoryTransaction = {
          id: `txn-ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString(),
          ingredientId: ing.id,
          type: 'consumption',
          quantity: -totalQtyToDeduct,
          unit: ing.unit,
          unitCost: ing.costPerUnit,
          totalCost: totalQtyToDeduct * ing.costPerUnit,
          referenceId: order.id,
          notes: `Consumed for Order #${order.orderNumber} (${item.quantity}x ${item.name})`,
          userId: actor.id,
          userName: actor.name,
        };
        this.state.transactions.unshift(txn);

        // Check low stock alert
        if (newStock <= ing.reorderLevel) {
          this.addNotification(
            `Low Stock Alert: ${ing.name}`,
            `Current stock is ${newStock.toFixed(1)} ${ing.unit} (Reorder level is ${ing.reorderLevel} ${ing.unit}). Suggested PO: ${(ing.maxStock - newStock).toFixed(1)} ${ing.unit}`,
            'warning',
            '/inventory'
          );
        }
      });
    });

    this.saveState();
  }

  // PURCHASES & RECEIVING
  public addPurchaseOrder(poData: Omit<PurchaseOrder, 'id'>, actor: User): PurchaseOrder {
    const poNumber = `PO-2026-${String(this.state.purchases.length + 1).padStart(4, '0')}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: poNumber,
    };
    this.state.purchases.unshift(newPO);

    // If marked received, immediately increase inventory stock and create transactions
    if (newPO.status === 'received') {
      this.receivePurchaseOrder(newPO.id, actor, newPO.invoiceNumber);
    } else {
      this.addAuditLog(actor, 'CREATE_PURCHASE_ORDER', 'Purchases', newPO.id, undefined, `Total: ₹${newPO.grandTotal}`);
    }

    this.saveState();
    return newPO;
  }

  public receivePurchaseOrder(poId: string, actor: User, invoiceNumber?: string): void {
    const po = this.state.purchases.find((p) => p.id === poId);
    if (!po || po.status === 'received') return;

    po.status = 'received';
    po.receivedDate = new Date().toISOString();
    po.receivedBy = actor.name;
    if (invoiceNumber) po.invoiceNumber = invoiceNumber;

    po.items.forEach((item) => {
      const ing = this.state.ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return;

      const rawQty = item.quantity ?? (item as any).orderedQuantity ?? 0;
      const conv = ing.conversionFactor || 1;
      const itemUnitNorm = (item.unit || '').toLowerCase().trim();
      const purchaseUnitNorm = (ing.purchaseUnit || '').toLowerCase().trim();
      const stockUnitNorm = (ing.unit || '').toLowerCase().trim();

      // Handle unit conversion if purchase unit is used
      let addedQuantity = rawQty;
      if (itemUnitNorm === purchaseUnitNorm && conv > 1) {
        addedQuantity = rawQty * conv;
      } else if (itemUnitNorm !== stockUnitNorm && conv > 1) {
        addedQuantity = rawQty * conv;
      }

      ing.currentStock += addedQuantity;

      // Create inventory batch if batch info provided
      if (item.batchNumber || item.expiryDate) {
        const batch: InventoryBatch = {
          id: `bat-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          ingredientId: ing.id,
          batchNumber: item.batchNumber || `BAT-${Date.now().toString().slice(-6)}`,
          purchaseDate: new Date().toISOString().split('T')[0],
          expiryDate: item.expiryDate,
          supplierId: po.supplierId,
          initialQuantity: addedQuantity,
          remainingQuantity: addedQuantity,
          unitCost: item.unitCost,
        };
        this.state.batches.unshift(batch);
      }

      // Log transaction
      const txn: InventoryTransaction = {
        id: `txn-po-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        date: new Date().toISOString(),
        ingredientId: ing.id,
        type: 'purchase',
        quantity: addedQuantity,
        unit: ing.unit,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        referenceId: po.id,
        notes: `Received PO #${po.id} from ${po.supplierName} (${rawQty} ${item.unit || ing.purchaseUnit} = ${addedQuantity} ${ing.unit}) (Inv: ${po.invoiceNumber || 'N/A'})`,
        userId: actor.id,
        userName: actor.name,
      };
      this.state.transactions.unshift(txn);
    });

    this.addAuditLog(actor, 'RECEIVE_PURCHASE_ORDER', 'Purchases', po.id, undefined, `Received inventory for PO #${po.id}`);
    this.addNotification('Stock Received', `Purchase order #${po.id} received from ${po.supplierName}. Stock updated.`, 'success');
    this.saveState();
  }

  // WASTAGE RECORDING
  public recordWastage(wastageData: Omit<WastageRecord, 'id' | 'date'>, actor: User): WastageRecord {
    const ing = this.state.ingredients.find((i) => i.id === wastageData.ingredientId);
    const newWaste: WastageRecord = {
      ...wastageData,
      id: `wst-${Date.now()}`,
      date: new Date().toISOString(),
    };
    this.state.wastage.unshift(newWaste);

    // Deduct from stock
    if (ing) {
      ing.currentStock = Math.max(0, ing.currentStock - newWaste.quantity);

      // Log transaction
      const txn: InventoryTransaction = {
        id: `txn-wst-${Date.now()}`,
        date: new Date().toISOString(),
        ingredientId: ing.id,
        type: 'waste',
        quantity: -newWaste.quantity,
        unit: newWaste.unit,
        unitCost: newWaste.unitCost,
        totalCost: newWaste.totalCost,
        referenceId: newWaste.id,
        notes: `Wastage logged: ${newWaste.reason} - ${newWaste.notes || ''}`,
        userId: actor.id,
        userName: actor.name,
      };
      this.state.transactions.unshift(txn);
    }

    this.addAuditLog(actor, 'LOG_WASTAGE', 'Inventory', newWaste.id, undefined, `${newWaste.quantity} ${newWaste.unit} of ${newWaste.ingredientName} (${newWaste.reason})`);
    this.saveState();
    return newWaste;
  }

  // STOCK AUDIT & COUNT WITH VARIANCE APPROVAL
  public submitStockCount(countData: Omit<StockCount, 'id' | 'date'>, actor: User): StockCount {
    const hasLargeVariance = countData.items.some((item) => item.requiresManagerApproval);
    const newCount: StockCount = {
      ...countData,
      id: `audit-${Date.now()}`,
      date: new Date().toISOString(),
      status: hasLargeVariance ? 'submitted' : 'approved',
    };

    if (!hasLargeVariance) {
      // Auto-approve and apply adjustments
      this.applyStockCountAdjustments(newCount, actor);
    } else {
      this.addNotification(
        'Stock Audit Requires Manager Approval',
        `Stock audit submitted by ${actor.name} contains variances exceeding ${this.state.settings.varianceThresholdPercent}%. Manager review required.`,
        'warning',
        '/inventory'
      );
    }

    this.state.stockCounts.unshift(newCount);
    this.addAuditLog(actor, 'SUBMIT_STOCK_COUNT', 'Inventory', newCount.id, undefined, `Status: ${newCount.status}`);
    this.saveState();
    return newCount;
  }

  public approveStockCount(countId: string, actor: User): void {
    const count = this.state.stockCounts.find((c) => c.id === countId);
    if (!count || count.status === 'approved' || count.status === 'completed') return;

    count.status = 'approved';
    count.approvedBy = actor.name;
    count.approvalDate = new Date().toISOString();

    this.applyStockCountAdjustments(count, actor);
    this.addAuditLog(actor, 'APPROVE_STOCK_VARIANCE', 'Inventory', count.id, 'submitted', 'approved');
    this.addNotification('Stock Variance Approved', `Stock Count #${count.id} approved by ${actor.name}. Inventory balances updated.`, 'success');
    this.saveState();
  }

  private applyStockCountAdjustments(count: StockCount, actor: User): void {
    count.items.forEach((item) => {
      const ing = this.state.ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return;

      const diff = item.physicalQuantity - ing.currentStock;
      if (Math.abs(diff) > 0.0001) {
        ing.currentStock = item.physicalQuantity;

        const txn: InventoryTransaction = {
          id: `txn-adj-${Date.now()}-${Math.floor(Math.random() * 100)}`,
          date: new Date().toISOString(),
          ingredientId: ing.id,
          type: diff > 0 ? 'adjustment_add' : 'adjustment_remove',
          quantity: diff,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: Math.abs(diff) * item.unitCost,
          referenceId: count.id,
          notes: `Stock count audit #${count.id} adjustment. Reason: ${item.reason || 'Physical count variance'}`,
          userId: actor.id,
          userName: actor.name,
        };
        this.state.transactions.unshift(txn);
      }
    });
    count.status = 'completed';
  }

  // SUPPLIERS
  public addSupplier(supplier: Omit<Supplier, 'id'>, actor: User): Supplier {
    const supId = `SUP-${String(this.state.suppliers.length + 1).padStart(4, '0')}`;
    const newSup: Supplier = { ...supplier, id: supId };
    this.state.suppliers.push(newSup);
    this.addAuditLog(actor, 'CREATE_SUPPLIER', 'Suppliers', newSup.id, undefined, newSup.name);
    this.saveState();
    return newSup;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>, actor: User): void {
    this.state.suppliers = this.state.suppliers.map((s) => (s.id === id ? { ...s, ...updates } : s));
    this.addAuditLog(actor, 'UPDATE_SUPPLIER', 'Suppliers', id);
    this.saveState();
  }

  // TABLES
  public addTable(table: Omit<RestaurantTable, 'id'>, actor: User): RestaurantTable {
    const newTable: RestaurantTable = {
      ...table,
      id: `tbl-${Date.now()}`,
    };
    this.state.tables.push(newTable);
    this.addAuditLog(actor, 'CREATE_TABLE', 'Tables', newTable.id, undefined, newTable.name);
    this.saveState();
    return newTable;
  }

  public updateTable(id: string, updates: Partial<RestaurantTable>, actor: User): void {
    this.state.tables = this.state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.saveState();
  }

  public clearTableStatus(tableId: string, actor: User): void {
    this.state.tables = this.state.tables.map((t) =>
      t.id === tableId ? { ...t, status: 'available', currentOrderId: undefined } : t
    );
    this.addAuditLog(actor, 'CLEAR_TABLE', 'Tables', tableId, undefined, 'Table cleared and marked available');
    this.saveState();
  }

  public deleteTable(id: string, actor: User): void {
    const table = this.state.tables.find((t) => t.id === id);
    this.state.tables = this.state.tables.filter((t) => t.id !== id);
    this.addAuditLog(actor, 'DELETE_TABLE', 'Tables', id, table?.name);
    this.saveState();
  }

  // ORDERS & POS LIFECYCLE
  public createOrder(orderData: Partial<Order>, actor: User): Order {
    const orderNumber = 100 + this.state.orders.length + 1;
    const kotNumber = orderNumber;
    const orderId = `ORD-2026-${String(orderNumber).padStart(4, '0')}`;

    // Estimate loyalty points to earn
    let estimatedPointsToEarn = 0;
    if (orderData.customerPhone) {
      const cust = this.state.customers.find((c) => c.phone === orderData.customerPhone);
      const tier = cust?.tier || 'bronze';
      estimatedPointsToEarn = calculatePointsToEarn(orderData.grandTotal || 0, tier);
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      kotNumber,
      orderType: orderData.orderType || 'dine_in',
      status: orderData.status || 'kot_generated',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tableId: orderData.tableId,
      tableName: orderData.tableName,
      guestCount: orderData.guestCount,
      waiterId: actor.id,
      waiterName: actor.name,
      customerId: orderData.customerId,
      customerName: orderData.customerName || 'Walk-in Guest',
      customerPhone: orderData.customerPhone || '',
      customerEmail: orderData.customerEmail,
      deliveryAddress: orderData.deliveryAddress,
      deliveryLandmark: orderData.deliveryLandmark,
      deliveryInstructions: orderData.deliveryInstructions,
      deliveryCharge: orderData.deliveryCharge || 0,
      deliveryZoneId: orderData.deliveryZoneId,
      deliveryStatus: orderData.orderType === 'delivery' ? 'pending_assignment' : undefined,
      pointsEarned: orderData.pointsEarned ?? estimatedPointsToEarn,
      pointsRedeemed: orderData.pointsRedeemed || 0,
      loyaltyRewardId: orderData.loyaltyRewardId,
      loyaltyDiscountAmount: orderData.loyaltyDiscountAmount || 0,
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      discountAmount: orderData.discountAmount || 0,
      discountReason: orderData.discountReason,
      discountPercent: orderData.discountPercent || 0,
      couponId: orderData.couponId,
      couponCode: orderData.couponCode,
      taxAmount: orderData.taxAmount || 0,
      roundOff: orderData.roundOff || 0,
      grandTotal: orderData.grandTotal || 0,
      paymentStatus: orderData.paymentStatus || 'pending',
      payments: orderData.payments || [],
      paymentMethod: orderData.paymentMethod,
      cashierId: orderData.cashierId || actor.id,
      cashierName: orderData.cashierName || actor.name,
      billerId: orderData.billerId || orderData.cashierId || actor.id,
      billerName: orderData.billerName || orderData.cashierName || actor.name,
      billerUsername: orderData.billerUsername,
      billedBy: orderData.billedBy || `${orderData.billerName || actor.name}`,
      supervisorAdminId: orderData.supervisorAdminId,
      supervisorAdminName: orderData.supervisorAdminName,
      notes: orderData.notes,
      isKOTPrinted: true,
    };

    this.state.orders.unshift(newOrder);

    // If dine in, mark table as occupied and link order
    if (newOrder.tableId) {
      this.state.tables = this.state.tables.map((tbl) =>
        tbl.id === newOrder.tableId ? { ...tbl, status: 'occupied', currentOrderId: newOrder.id } : tbl
      );
    }

    // Ensure customer profile is registered/updated
    if (newOrder.customerPhone) {
      let cust = this.state.customers.find((c) => c.phone === newOrder.customerPhone);
      if (!cust) {
        cust = {
          id: newOrder.customerId || `cust-${Date.now()}`,
          name: newOrder.customerName || 'Guest',
          phone: newOrder.customerPhone,
          email: newOrder.customerEmail,
          totalOrders: 0,
          totalSpend: 0,
          lastOrderDate: new Date().toISOString().split('T')[0],
          loyaltyPoints: 50, // 50 welcome bonus points for new members!
          tier: 'bronze',
          loyaltyHistory: [
            {
              id: `ltxn-welcome-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'bonus',
              points: 50,
              description: 'Welcome Member Registration Bonus',
              balanceAfter: 50,
            },
          ],
          isActive: true,
        };
        this.state.customers.push(cust);
      }
    }

    this.addAuditLog(actor, 'CREATE_ORDER', 'POS', newOrder.id, undefined, `Order #${newOrder.orderNumber} Total: ₹${newOrder.grandTotal}`);
    this.addNotification(
      `New Order #${newOrder.orderNumber}`,
      `${newOrder.orderType.toUpperCase()} Order with ${newOrder.items.length} items (₹${newOrder.grandTotal}) received.`,
      'info',
      '/kitchen'
    );

    // If order was created pre-paid (e.g. takeaway immediate cash), process inventory consumption & cashier shift immediately
    if (newOrder.paymentStatus === 'paid') {
      this.consumeInventoryForOrder(newOrder, actor);
      this.recordOrderCashInShift(newOrder);

      // Award loyalty points & track order visit for customer
      if (newOrder.customerPhone) {
        const cust = this.state.customers.find(
          (c) => c.phone === newOrder.customerPhone || (newOrder.customerId && c.id === newOrder.customerId)
        );
        if (cust) {
          cust.totalOrders = (cust.totalOrders || 0) + 1;
          cust.totalSpend = (cust.totalSpend || 0) + newOrder.grandTotal;
          cust.lastOrderDate = new Date().toISOString().split('T')[0];
          if (newOrder.customerName && newOrder.customerName !== 'Walk-in Guest') {
            cust.name = newOrder.customerName;
          }

          if (!cust.loyaltyHistory) cust.loyaltyHistory = [];

          const tierInfo = getCustomerTierInfo(cust.loyaltyPoints || 0);
          const earned = newOrder.pointsEarned || calculatePointsToEarn(newOrder.grandTotal, tierInfo.tier);
          newOrder.pointsEarned = earned;

          if (earned > 0) {
            cust.loyaltyPoints = (cust.loyaltyPoints || 0) + earned;
            const earnTxn: LoyaltyTransaction = {
              id: `ltxn-${Date.now()}-earn`,
              date: new Date().toISOString(),
              type: 'earned',
              points: earned,
              orderId: newOrder.id,
              orderNumber: newOrder.orderNumber,
              description: `Earned ${earned} pts from Order #${newOrder.orderNumber} (${tierInfo.label})`,
              balanceAfter: cust.loyaltyPoints,
            };
            cust.loyaltyHistory.unshift(earnTxn);
          }

          cust.tier = getCustomerTierInfo(cust.loyaltyPoints || 0).tier;
        }
      }
    }

    this.saveState();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], actor: User): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const prevStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // Update timestamps and item-level kitchen statuses
    const nowIso = new Date().toISOString();
    if (status === 'preparing' || status === 'in_prep' || status === 'kitchen_accepted') {
      if (!order.kitchenStartedAt) order.kitchenStartedAt = nowIso;
      order.items = (order.items || []).map((it) => ({
        ...it,
        kitchenStatus: it.kitchenStatus === 'ready' || it.kitchenStatus === 'served' ? it.kitchenStatus : 'preparing',
        prepStartedAt: it.prepStartedAt || nowIso,
      }));
    } else if (status === 'ready') {
      order.kitchenReadyAt = nowIso;
      order.items = (order.items || []).map((it) => ({
        ...it,
        kitchenStatus: it.kitchenStatus === 'served' ? 'served' : 'ready',
        readyAt: it.readyAt || nowIso,
      }));
    } else if (status === 'served') {
      order.kitchenServedAt = nowIso;
      order.items = (order.items || []).map((it) => ({
        ...it,
        kitchenStatus: 'served',
        servedAt: it.servedAt || nowIso,
      }));
    }

    // Table state updates: Keep table active as long as payment is not completed!
    if (order.tableId) {
      if (status === 'cancelled') {
        this.state.tables = this.state.tables.map((tbl) =>
          tbl.id === order.tableId ? { ...tbl, status: 'available', currentOrderId: undefined } : tbl
        );
      } else if (status === 'completed') {
        // Table is only freed to cleaning if payment is paid; otherwise keeps table active in payment_pending!
        if (order.paymentStatus === 'paid') {
          this.state.tables = this.state.tables.map((tbl) =>
            tbl.id === order.tableId ? { ...tbl, status: 'cleaning', currentOrderId: undefined } : tbl
          );
        } else {
          this.state.tables = this.state.tables.map((tbl) =>
            tbl.id === order.tableId ? { ...tbl, status: 'payment_pending', currentOrderId: order.id } : tbl
          );
        }
      } else if (status === 'ready') {
        this.state.tables = this.state.tables.map((tbl) =>
          tbl.id === order.tableId ? { ...tbl, status: 'ready', currentOrderId: order.id } : tbl
        );
      } else if (status === 'bill_generated' || status === 'served') {
        this.state.tables = this.state.tables.map((tbl) =>
          tbl.id === order.tableId ? { ...tbl, status: 'payment_pending', currentOrderId: order.id } : tbl
        );
      } else if (
        status === 'in_prep' ||
        status === 'kot_generated' ||
        status === 'new' ||
        status === 'kitchen_accepted' ||
        status === 'preparing' ||
        status === 'confirmed'
      ) {
        this.state.tables = this.state.tables.map((tbl) =>
          tbl.id === order.tableId ? { ...tbl, status: 'occupied', currentOrderId: order.id } : tbl
        );
      }
    }

    this.addAuditLog(actor, 'UPDATE_ORDER_STATUS', 'Orders', order.id, prevStatus, status);

    if (status === 'ready') {
      this.addNotification(
        `Order #${order.orderNumber} is Ready!`,
        `Kitchen completed preparation for ${order.tableName || order.orderType}. Ready for service / packing.`,
        'success'
      );
    }

    this.saveState();
  }

  public updateOrderItemKitchenStatus(
    orderId: string,
    itemId: string,
    itemKitchenStatus: 'pending' | 'preparing' | 'ready' | 'served',
    actor: User
  ): Order | undefined {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const nowIso = new Date().toISOString();
    order.items = (order.items || []).map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          kitchenStatus: itemKitchenStatus,
          prepStartedAt: itemKitchenStatus === 'preparing' ? it.prepStartedAt || nowIso : it.prepStartedAt,
          readyAt: itemKitchenStatus === 'ready' ? nowIso : it.readyAt,
          servedAt: itemKitchenStatus === 'served' ? nowIso : it.servedAt,
        };
      }
      return it;
    });

    // Check if all items have reached ready or served
    const nonCancelledItems = order.items.filter((i) => i.kitchenStatus !== 'cancelled');
    const allReady = nonCancelledItems.length > 0 && nonCancelledItems.every((i) => i.kitchenStatus === 'ready' || i.kitchenStatus === 'served');
    const allServed = nonCancelledItems.length > 0 && nonCancelledItems.every((i) => i.kitchenStatus === 'served');
    const anyPreparing = nonCancelledItems.some((i) => i.kitchenStatus === 'preparing');

    if (allServed && order.status !== 'completed' && order.status !== 'bill_generated') {
      order.status = 'served';
      order.kitchenServedAt = nowIso;
      if (order.tableId) {
        this.state.tables = this.state.tables.map((tbl) =>
          tbl.id === order.tableId ? { ...tbl, status: 'payment_pending', currentOrderId: order.id } : tbl
        );
      }
    } else if (allReady && order.status !== 'ready' && order.status !== 'served' && order.status !== 'completed') {
      order.status = 'ready';
      order.kitchenReadyAt = nowIso;
      if (order.tableId) {
        this.state.tables = this.state.tables.map((tbl) =>
          tbl.id === order.tableId ? { ...tbl, status: 'ready', currentOrderId: order.id } : tbl
        );
      }
      this.addNotification(
        `Order #${order.orderNumber} is Ready!`,
        `All items for ${order.tableName || order.orderType} are cooked and ready for service.`,
        'success'
      );
    } else if (anyPreparing && (order.status === 'kot_generated' || order.status === 'new' || order.status === 'confirmed')) {
      order.status = 'preparing';
      if (!order.kitchenStartedAt) order.kitchenStartedAt = nowIso;
    }

    order.updatedAt = nowIso;
    this.addAuditLog(actor, 'UPDATE_ITEM_KITCHEN_STATUS', 'Orders', order.id, undefined, `Item ${itemId} -> ${itemKitchenStatus}`);
    this.saveState();
    return order;
  }

  public addItemsToOrder(orderId: string, newItems: OrderItem[], actor: User): Order | undefined {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.items = [...order.items, ...newItems];
    const addedSubtotal = newItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const addedTax = newItems.reduce((sum, it) => sum + it.taxAmount, 0);
    order.subtotal += addedSubtotal;
    order.taxAmount += addedTax;
    const rawTotal = Math.max(0, order.subtotal - (order.discountAmount || 0)) + order.taxAmount + (order.deliveryCharge || 0);
    order.roundOff = Math.round(rawTotal) - rawTotal;
    order.grandTotal = Math.round(rawTotal);
    order.status = 'kot_generated';
    order.updatedAt = new Date().toISOString();

    if (order.tableId) {
      this.state.tables = this.state.tables.map((tbl) =>
        tbl.id === order.tableId ? { ...tbl, status: 'occupied', currentOrderId: order.id } : tbl
      );
    }

    this.addAuditLog(actor, 'ADD_ITEMS_TO_ORDER', 'Orders', order.id, undefined, `Added ${newItems.length} items to Order #${order.orderNumber}`);
    this.addNotification(
      `Order #${order.orderNumber} Running Tab Updated`,
      `Added ${newItems.length} items to ${order.tableName || order.orderType}. New Total: ₹${order.grandTotal}`,
      'info',
      '/kitchen'
    );
    this.saveState();
    return order;
  }

  public processOrderPayment(
    orderId: string,
    payments: PaymentAllocation[],
    actor: User,
    discountAmount: number = 0,
    discountReason?: string
  ): Order | undefined {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    if (discountAmount > 0) {
      order.discountAmount = discountAmount;
      order.discountReason = discountReason;
      order.grandTotal = Math.max(0, order.subtotal + order.taxAmount + order.deliveryCharge - discountAmount);
    }

    order.payments = payments;
    order.paymentStatus = 'paid';
    order.status = 'completed';
    order.paymentMethod = payments[0]?.method || 'cash';
    order.updatedAt = new Date().toISOString();

    // Table freed
    if (order.tableId) {
      this.state.tables = this.state.tables.map((t) =>
        t.id === order.tableId ? { ...t, status: 'cleaning', currentOrderId: undefined } : t
      );
    }

    // Record in cashier shift
    this.recordOrderCashInShift(order);

    // Consume inventory based on recipe
    this.consumeInventoryForOrder(order, actor);

    // Track coupon redemption stats if coupon was applied
    if (order.couponId || order.discountReason) {
      const matchCoupon = this.state.coupons.find(
        (c) => c.id === order.couponId || c.code.toLowerCase() === (order.couponCode || '').toLowerCase()
      );
      if (matchCoupon) {
        matchCoupon.usageCount += 1;
        matchCoupon.totalDiscountGiven += order.discountAmount || 0;
        matchCoupon.totalRevenueGenerated += order.grandTotal || 0;
        matchCoupon.updatedAt = new Date().toISOString();
      }
    }

    // Update customer loyalty points, spending and tier
    if (order.customerPhone) {
      let cust = this.state.customers.find(
        (c) => c.phone === order.customerPhone || (order.customerId && c.id === order.customerId)
      );

      if (!cust) {
        cust = {
          id: order.customerId || `cust-${Date.now()}`,
          name: order.customerName || 'Guest',
          phone: order.customerPhone,
          email: order.customerEmail,
          totalOrders: 1,
          totalSpend: order.grandTotal,
          lastOrderDate: new Date().toISOString().split('T')[0],
          loyaltyPoints: 0,
          tier: 'bronze',
          loyaltyHistory: [],
          isActive: true,
        };
        this.state.customers.push(cust);
      } else {
        cust.totalOrders += 1;
        cust.totalSpend += order.grandTotal;
        cust.lastOrderDate = new Date().toISOString().split('T')[0];
        if (order.customerName && order.customerName !== 'Walk-in Guest') {
          cust.name = order.customerName;
        }
      }

      if (!cust.loyaltyHistory) cust.loyaltyHistory = [];

      // 1. Process point deduction if points were redeemed on this order
      if (order.pointsRedeemed && order.pointsRedeemed > 0) {
        cust.loyaltyPoints = Math.max(0, cust.loyaltyPoints - order.pointsRedeemed);
        const redeemTxn: LoyaltyTransaction = {
          id: `ltxn-${Date.now()}-red`,
          date: new Date().toISOString(),
          type: 'redeemed',
          points: -order.pointsRedeemed,
          orderId: order.id,
          orderNumber: order.orderNumber,
          description: order.discountReason || `Redeemed ${order.pointsRedeemed} pts (₹${order.discountAmount} Off)`,
          balanceAfter: cust.loyaltyPoints,
        };
        cust.loyaltyHistory.unshift(redeemTxn);
      }

      // 2. Award earned points from paid order amount
      const tierInfo = getCustomerTierInfo(cust.loyaltyPoints);
      const earned = order.pointsEarned || calculatePointsToEarn(order.grandTotal, tierInfo.tier);
      order.pointsEarned = earned;

      if (earned > 0) {
        cust.loyaltyPoints += earned;
        const earnTxn: LoyaltyTransaction = {
          id: `ltxn-${Date.now()}-earn`,
          date: new Date().toISOString(),
          type: 'earned',
          points: earned,
          orderId: order.id,
          orderNumber: order.orderNumber,
          description: `Earned ${earned} pts from Order #${order.orderNumber} (${tierInfo.label})`,
          balanceAfter: cust.loyaltyPoints,
        };
        cust.loyaltyHistory.unshift(earnTxn);
      }

      // Update tier
      cust.tier = getCustomerTierInfo(cust.loyaltyPoints).tier;
    }

    this.addAuditLog(actor, 'PROCESS_PAYMENT', 'Billing', order.id, 'pending', `Paid ₹${order.grandTotal} via ${payments.map((p) => p.method).join('+')}`);
    this.addNotification('Bill Settled', `Order #${order.orderNumber} settled successfully. Total: ₹${order.grandTotal}`, 'success');

    this.saveState();
    return order;
  }

  // ----------------------------------------------------
  // CUSTOMER LOYALTY & REWARD ACTIONS
  // ----------------------------------------------------

  public linkOrderCustomer(
    orderId: string,
    customerData: {
      customerId?: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
    },
    actor: User
  ): Order | undefined {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    let cust = this.state.customers.find(
      (c) => (customerData.phone && c.phone === customerData.phone) || (customerData.customerId && c.id === customerData.customerId)
    );

    if (!cust && customerData.phone) {
      // Auto-register new customer profile
      cust = {
        id: customerData.customerId || `cust-${Date.now()}`,
        name: customerData.name || 'Valued Guest',
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        totalOrders: 0,
        totalSpend: 0,
        lastOrderDate: new Date().toISOString().split('T')[0],
        loyaltyPoints: 50, // Welcome points
        tier: 'bronze',
        loyaltyHistory: [
          {
            id: `ltxn-init-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'bonus',
            points: 50,
            description: 'New Customer Welcome Bonus Points',
            balanceAfter: 50,
          },
        ],
        isActive: true,
      };
      this.state.customers.push(cust);
      this.addNotification('New Member Registered', `${cust.name} (${cust.phone}) enrolled with 50 bonus loyalty points.`, 'success');
    } else if (cust) {
      if (customerData.name && customerData.name !== 'Walk-in Guest') cust.name = customerData.name;
      if (customerData.email) cust.email = customerData.email;
      if (customerData.address) cust.address = customerData.address;
    }

    order.customerId = cust?.id;
    order.customerName = cust?.name || customerData.name;
    order.customerPhone = cust?.phone || customerData.phone;
    order.customerEmail = cust?.email || customerData.email;
    order.updatedAt = new Date().toISOString();

    // Re-estimate points to earn with customer tier
    const tier = cust?.tier || 'bronze';
    order.pointsEarned = calculatePointsToEarn(order.grandTotal, tier);

    this.addAuditLog(actor, 'LINK_CUSTOMER_ORDER', 'Billing', order.id, undefined, `Linked to ${order.customerName} (${order.customerPhone})`);
    this.saveState();
    return order;
  }

  public applyLoyaltyDiscountToOrder(
    orderId: string,
    pointsToRedeem: number,
    discountAmount: number,
    couponCode: string,
    rewardTitle: string,
    actor: User
  ): Order | undefined {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    // Apply loyalty discount
    order.discountAmount = discountAmount;
    order.discountReason = rewardTitle || `Loyalty Reward (${couponCode})`;
    order.couponCode = couponCode;
    order.pointsRedeemed = pointsToRedeem;
    order.loyaltyDiscountAmount = discountAmount;

    // Recalculate Grand Total
    const sub = order.subtotal || 0;
    const tax = order.taxAmount || 0;
    const delivery = order.deliveryCharge || 0;
    order.grandTotal = Math.max(0, sub + tax + delivery - discountAmount);
    order.updatedAt = new Date().toISOString();

    // Recalculate points to earn on net payable
    const cust = this.state.customers.find((c) => c.phone === order.customerPhone);
    const tier = cust?.tier || 'bronze';
    order.pointsEarned = calculatePointsToEarn(order.grandTotal, tier);

    this.addAuditLog(actor, 'APPLY_LOYALTY_DISCOUNT', 'Billing', order.id, undefined, `Redeemed ${pointsToRedeem} pts for ₹${discountAmount} off`);
    this.addNotification('Loyalty Reward Applied', `Applied ${couponCode} (-₹${discountAmount}) to Order #${order.orderNumber}`, 'success');

    this.saveState();
    return order;
  }

  public removeOrderLoyaltyDiscount(orderId: string, actor: User): Order | undefined {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.discountAmount = 0;
    order.discountReason = undefined;
    order.couponCode = undefined;
    order.couponId = undefined;
    order.pointsRedeemed = 0;
    order.loyaltyRewardId = undefined;
    order.loyaltyDiscountAmount = 0;

    const sub = order.subtotal || 0;
    const tax = order.taxAmount || 0;
    const delivery = order.deliveryCharge || 0;
    order.grandTotal = sub + tax + delivery;
    order.updatedAt = new Date().toISOString();

    const cust = this.state.customers.find((c) => c.phone === order.customerPhone);
    const tier = cust?.tier || 'bronze';
    order.pointsEarned = calculatePointsToEarn(order.grandTotal, tier);

    this.addAuditLog(actor, 'REMOVE_LOYALTY_DISCOUNT', 'Billing', order.id);
    this.saveState();
    return order;
  }

  public addCustomer(
    customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend'> & { initialPoints?: number },
    actor: User
  ): Customer {
    const initPts = customerData.initialPoints ?? 50;
    const newCust: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpend: 0,
      lastOrderDate: new Date().toISOString().split('T')[0],
      loyaltyPoints: initPts,
      tier: getCustomerTierInfo(initPts).tier,
      loyaltyHistory: [
        {
          id: `ltxn-new-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'bonus',
          points: initPts,
          description: 'Member Registration Welcome Points',
          balanceAfter: initPts,
        },
      ],
      isActive: true,
    };

    this.state.customers.push(newCust);
    this.addAuditLog(actor, 'CREATE_CUSTOMER', 'Loyalty', newCust.id, undefined, `${newCust.name} (${newCust.phone})`);
    this.addNotification('Customer Added', `Registered loyalty profile for ${newCust.name} (${initPts} points).`, 'success');
    this.saveState();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>, actor: User): void {
    this.state.customers = this.state.customers.map((c) => {
      if (c.id === id) {
        const updated = { ...c, ...updates };
        if (updates.loyaltyPoints !== undefined) {
          updated.tier = getCustomerTierInfo(updated.loyaltyPoints).tier;
        }
        return updated;
      }
      return c;
    });
    this.addAuditLog(actor, 'UPDATE_CUSTOMER', 'Loyalty', id, undefined, JSON.stringify(updates));
    this.saveState();
  }

  public adjustCustomerPoints(
    customerId: string,
    pointsDelta: number,
    reason: string,
    actor: User
  ): Customer | undefined {
    const cust = this.state.customers.find((c) => c.id === customerId);
    if (!cust) return;

    cust.loyaltyPoints = Math.max(0, cust.loyaltyPoints + pointsDelta);
    cust.tier = getCustomerTierInfo(cust.loyaltyPoints).tier;

    if (!cust.loyaltyHistory) cust.loyaltyHistory = [];
    const txn: LoyaltyTransaction = {
      id: `ltxn-adj-${Date.now()}`,
      date: new Date().toISOString(),
      type: pointsDelta >= 0 ? 'adjustment' : 'redeemed',
      points: pointsDelta,
      description: `${reason} (by ${actor.name})`,
      balanceAfter: cust.loyaltyPoints,
    };
    cust.loyaltyHistory.unshift(txn);

    this.addAuditLog(
      actor,
      'ADJUST_LOYALTY_POINTS',
      'Loyalty',
      customerId,
      undefined,
      `${pointsDelta > 0 ? '+' : ''}${pointsDelta} pts (${reason})`
    );
    this.addNotification(
      'Points Adjusted',
      `Adjusted ${pointsDelta > 0 ? '+' : ''}${pointsDelta} loyalty points for ${cust.name}. New Balance: ${cust.loyaltyPoints} pts.`,
      'info'
    );

    this.saveState();
    return cust;
  }

  private recordOrderCashInShift(order: Order): void {
    const activeShift = this.state.shifts.find((s) => s.status === 'open');
    if (!activeShift) return;

    const cashAlloc = order.payments.find((p) => p.method === 'cash');
    if (cashAlloc) {
      activeShift.cashSales += cashAlloc.amount;
    }
    activeShift.totalTransactions += 1;
  }

  public cancelOrder(orderId: string, reason: string, actor: User): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.cancelledBy = actor.name;
    order.cancelledAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    if (order.tableId) {
      this.state.tables = this.state.tables.map((tbl) =>
        tbl.id === order.tableId ? { ...tbl, status: 'available', currentOrderId: undefined } : tbl
      );
    }

    this.addAuditLog(actor, 'CANCEL_ORDER', 'Orders', order.id, undefined, `Reason: ${reason}`);
    this.addNotification(`Order #${order.orderNumber} Cancelled`, `Cancelled by ${actor.name}. Reason: ${reason}`, 'warning');
    this.saveState();
  }

  // REFUNDS
  public processRefund(orderId: string, amount: number, reason: string, method: PaymentMethod, actor: User): RefundRecord {
    const order = this.state.orders.find((o) => o.id === orderId);
    const refund: RefundRecord = {
      id: `ref-${Date.now()}`,
      orderId,
      orderNumber: order?.orderNumber || 0,
      amount,
      reason,
      paymentMethod: method,
      processedBy: actor.name,
      approvedBy: actor.name,
      timestamp: new Date().toISOString(),
    };

    this.state.refunds.unshift(refund);

    if (order) {
      order.paymentStatus = 'refunded';
    }

    // Adjust in shift if cash
    if (method === 'cash') {
      const activeShift = this.state.shifts.find((s) => s.status === 'open');
      if (activeShift) {
        activeShift.cashRefunds += amount;
      }
    }

    this.addAuditLog(actor, 'PROCESS_REFUND', 'Billing', orderId, undefined, `Refunded ₹${amount} (${reason})`);
    this.addNotification('Refund Processed', `Refund of ₹${amount} issued for Order #${order?.orderNumber}`, 'warning');
    this.saveState();
    return refund;
  }

  // SHIFT MANAGEMENT
  public openShift(userId: string, userName: string, openingCash: number, actor: User): CashierShift {
    // Close any previous open shift
    this.state.shifts = this.state.shifts.map((s) =>
      s.status === 'open' ? { ...s, status: 'closed', endTime: new Date().toISOString() } : s
    );

    const shift: CashierShift = {
      id: `shift-${Date.now()}`,
      userId,
      userName,
      startTime: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      cashRefunds: 0,
      totalTransactions: 0,
      status: 'open',
    };

    this.state.shifts.unshift(shift);
    this.addAuditLog(actor, 'OPEN_SHIFT', 'Cash Drawer', shift.id, undefined, `Float: ₹${openingCash}`);
    this.saveState();
    return shift;
  }

  public closeShift(shiftId: string, actualCash: number, closingNotes: string, actor: User): CashierShift | undefined {
    const shift = this.state.shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    const expectedCash = shift.openingCash + shift.cashSales - shift.cashRefunds;
    const variance = actualCash - expectedCash;

    shift.status = 'closed';
    shift.endTime = new Date().toISOString();
    shift.expectedCash = expectedCash;
    shift.actualCash = actualCash;
    shift.variance = variance;
    shift.closingNotes = closingNotes;

    this.addAuditLog(
      actor,
      'CLOSE_SHIFT',
      'Cash Drawer',
      shift.id,
      undefined,
      `Expected: ₹${expectedCash}, Actual: ₹${actualCash}, Variance: ${variance >= 0 ? `+₹${variance}` : `-₹${Math.abs(variance)}`}`
    );
    this.saveState();
    return shift;
  }

  // DAILY CLOSING
  public executeDailyClosing(date: string, actualCash: number, notes: string, actor: User): DailyClosing {
    const dayOrders = this.state.orders.filter((o) => o.createdAt.startsWith(date) && o.paymentStatus === 'paid');
    const dayExpenses = this.state.expenses.filter((e) => e.date.startsWith(date));
    const dayRefunds = this.state.refunds.filter((r) => r.timestamp.startsWith(date));

    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let onlineSales = 0;
    let totalSales = 0;
    let totalDiscounts = 0;
    let totalTaxes = 0;

    dayOrders.forEach((o) => {
      totalSales += o.grandTotal;
      totalDiscounts += o.discountAmount;
      totalTaxes += o.taxAmount;
      o.payments.forEach((p) => {
        if (p.method === 'cash') cashSales += p.amount;
        else if (p.method === 'upi') upiSales += p.amount;
        else if (p.method === 'credit_card' || p.method === 'debit_card') cardSales += p.amount;
        else onlineSales += p.amount;
      });
    });

    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRefundsAmount = dayRefunds.reduce((sum, r) => sum + r.amount, 0);
    const netRevenue = totalSales - totalExpenses - totalRefundsAmount;
    const expectedCash = cashSales - totalRefundsAmount;
    const cashVariance = actualCash - expectedCash;

    const closing: DailyClosing = {
      id: `close-${date}`,
      date,
      totalSales,
      cashSales,
      upiSales,
      cardSales,
      onlineSales,
      totalOrders: dayOrders.length,
      totalDiscounts,
      totalTaxes,
      totalExpenses,
      totalRefunds: totalRefundsAmount,
      netRevenue,
      expectedCash,
      actualCash,
      cashVariance,
      closedBy: actor.name,
      closedAt: new Date().toISOString(),
      notes,
    };

    this.state.dailyClosings.unshift(closing);
    this.addAuditLog(actor, 'DAILY_CLOSING', 'Finance', closing.id, undefined, `Total Revenue: ₹${totalSales}, Net: ₹${netRevenue}`);
    this.addNotification('Daily Closing Completed', `Business day ${date} closed by ${actor.name}. Total sales: ₹${totalSales}`, 'info');

    this.saveState();
    return closing;
  }

  // EXPENSES
  public addExpense(expenseData: Omit<Expense, 'id'>, actor: User): Expense {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    this.state.expenses.unshift(newExp);
    this.addAuditLog(actor, 'ADD_EXPENSE', 'Finance', newExp.id, undefined, `₹${newExp.amount} for ${newExp.category}`);
    this.saveState();
    return newExp;
  }

  public deleteExpense(id: string, actor: User): void {
    this.state.expenses = this.state.expenses.filter((e) => e.id !== id);
    this.addAuditLog(actor, 'DELETE_EXPENSE', 'Finance', id);
    this.saveState();
  }

  // DELIVERY & RIDER WORKFLOW
  public assignRider(orderId: string, riderId: string, actor: User): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    const rider = this.state.riders.find((r) => r.id === riderId);
    if (!order || !rider) return;

    order.riderId = rider.id;
    order.riderName = rider.name;
    order.riderPhone = rider.phone;
    order.deliveryStatus = 'assigned';

    rider.activeDeliveriesCount += 1;
    rider.currentStatus = 'on_delivery';

    this.addAuditLog(actor, 'ASSIGN_RIDER', 'Delivery', order.id, undefined, `Assigned to ${rider.name}`);
    this.addNotification(
      `New Delivery Assigned`,
      `Delivery for Order #${order.orderNumber} assigned to ${rider.name}.`,
      'info',
      '/rider'
    );
    this.saveState();
  }

  public updateDeliveryStatus(orderId: string, status: Order['deliveryStatus'], actor: User): void {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.deliveryStatus = status;
    if (status === 'delivered') {
      order.status = 'completed';
      order.paymentStatus = 'paid';
      const rider = this.state.riders.find((r) => r.id === order.riderId);
      if (rider) {
        rider.activeDeliveriesCount = Math.max(0, rider.activeDeliveriesCount - 1);
        rider.completedToday += 1;
        if (rider.activeDeliveriesCount === 0) {
          rider.currentStatus = 'available';
        }
      }
    }

    this.addAuditLog(actor, 'UPDATE_DELIVERY_STATUS', 'Delivery', order.id, undefined, status);
    this.saveState();
  }

  // SOP MASTERS & TASKS
  public addSOPMaster(sopData: Omit<SOPMaster, 'id' | 'createdAt'>, actor: User): SOPMaster {
    const newSOP: SOPMaster = {
      ...sopData,
      id: `sop-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.state.sopMasters.push(newSOP);
    this.addAuditLog(actor, 'CREATE_SOP_MASTER', 'SOP', newSOP.id, undefined, newSOP.title);
    this.saveState();
    return newSOP;
  }

  public updateSOPMaster(id: string, updates: Partial<SOPMaster>, actor: User): void {
    this.state.sopMasters = this.state.sopMasters.map((s) => (s.id === id ? { ...s, ...updates } : s));
    this.addAuditLog(actor, 'UPDATE_SOP_MASTER', 'SOP', id);
    this.saveState();
  }

  public generateDailySOPTasks(outletId?: string): void {
    const today = new Date().toISOString().split('T')[0];
    const existingTasksToday = this.state.sopTasks.filter((t) => t.date === today && (!outletId || !t.outletId || t.outletId === outletId));

    this.state.sopMasters.forEach((sop) => {
      if (sop.status !== 'active') return;
      if (outletId && sop.outletId && sop.outletId !== outletId) return;
      const alreadyExists = existingTasksToday.some((t) => (t.sopId === sop.id || t.sopMasterId === sop.id));
      if (alreadyExists) return;

      const task: SOPTask = {
        id: `task-${sop.id}-${today}-${Math.floor(1000 + Math.random() * 9000)}`,
        sopId: sop.id,
        sopMasterId: sop.id,
        sopTitle: sop.title,
        title: sop.title,
        category: sop.category,
        assignedRole: sop.responsibleRole,
        assignedToName: `${sop.responsibleRole.replace('_', ' ').toUpperCase()} Team`,
        shift: 'morning',
        date: today,
        dueDate: today,
        dueTime: '10:00',
        status: 'pending',
        compliancePercent: 0,
        outletId: sop.outletId || outletId,
        outletName: sop.outletName,
        results: sop.steps.map((s) => ({
          stepId: s.id,
          instruction: s.instruction,
          evidenceType: s.evidenceType,
          status: 'pending',
          isCompleted: false,
        })),
      };
      this.state.sopTasks.unshift(task);
    });

    this.saveState();
  }

  public publishSOPTaskForToday(sopMasterId: string, actor: User, targetOutletId?: string): SOPTask | undefined {
    const sop = this.state.sopMasters.find((s) => s.id === sopMasterId);
    if (!sop) return undefined;

    const today = new Date().toISOString().split('T')[0];
    const task: SOPTask = {
      id: `task-${sop.id}-${today}-${Date.now().toString().slice(-4)}`,
      sopId: sop.id,
      sopMasterId: sop.id,
      sopTitle: sop.title,
      title: sop.title,
      category: sop.category,
      assignedRole: sop.responsibleRole,
      assignedToName: `${sop.responsibleRole.replace('_', ' ').toUpperCase()} Team`,
      shift: 'morning',
      date: today,
      dueDate: today,
      dueTime: '10:00',
      status: 'pending',
      compliancePercent: 0,
      outletId: targetOutletId || sop.outletId,
      outletName: sop.outletName,
      results: sop.steps.map((s) => ({
        stepId: s.id,
        instruction: s.instruction,
        evidenceType: s.evidenceType,
        status: 'pending',
        isCompleted: false,
      })),
    };
    this.state.sopTasks.unshift(task);
    this.addAuditLog(actor, 'PUBLISH_SOP_TASK', 'SOP', task.id, undefined, `Published "${sop.title}" for today`);
    this.saveState();
    return task;
  }

  public submitSOPTask(
    taskId: string,
    results: SOPTask['results'],
    actor: User
  ): void {
    const task = this.state.sopTasks.find((t) => t.id === taskId);
    if (!task) return;

    const totalSteps = results.length;
    const passedSteps = results.filter((r) => r.status === 'pass').length;
    const failedSteps = results.filter((r) => r.status === 'fail').length;
    const compliance = totalSteps > 0 ? Math.round((passedSteps / totalSteps) * 100) : 100;

    task.results = results;
    task.compliancePercent = compliance;
    task.status = failedSteps > 0 ? 'failed' : 'completed';
    task.completedAt = new Date().toISOString();
    task.completedBy = actor.name;
    task.assignedUserId = actor.id;
    task.assignedUserName = actor.name;
    task.managerReviewStatus = 'pending';

    this.addAuditLog(actor, 'COMPLETE_SOP_TASK', 'SOP', task.id, undefined, `Compliance: ${compliance}% (${passedSteps}/${totalSteps} steps)`);
    if (failedSteps > 0) {
      this.addNotification(`SOP Checklist Issue: ${task.sopTitle}`, `${failedSteps} check(s) flagged out-of-range/failed by ${actor.name}. Manager review required.`, 'warning', '/sop');
    }

    this.saveState();
  }

  public reviewSOPTask(taskId: string, reviewStatus: 'approved' | 'rejected', notes: string, actor: User): void {
    const task = this.state.sopTasks.find((t) => t.id === taskId);
    if (!task) return;

    task.managerReviewStatus = reviewStatus;
    task.managerReviewNotes = notes;
    task.reviewedBy = actor.name;

    this.addAuditLog(actor, 'REVIEW_SOP_TASK', 'SOP', task.id, undefined, `${reviewStatus.toUpperCase()} - ${notes}`);
    this.saveState();
  }

  // EQUIPMENT & MAINTENANCE
  public addEquipment(eqData: Omit<Equipment, 'id'>, actor: User): Equipment {
    const newEq: Equipment = { ...eqData, id: `eq-${Date.now()}` };
    this.state.equipment.push(newEq);
    this.addAuditLog(actor, 'CREATE_EQUIPMENT', 'Equipment', newEq.id, undefined, newEq.name);
    this.saveState();
    return newEq;
  }

  public updateEquipment(id: string, updates: Partial<Equipment>, actor: User): void {
    this.state.equipment = this.state.equipment.map((e) => (e.id === id ? { ...e, ...updates } : e));
    this.saveState();
  }

  public logMaintenance(maintData: Omit<MaintenanceRecord, 'id'>, actor: User): MaintenanceRecord {
    const newMaint: MaintenanceRecord = { ...maintData, id: `maint-${Date.now()}` };
    this.state.maintenanceRecords.unshift(newMaint);

    // Update equipment last maintenance date
    const eq = this.state.equipment.find((e) => e.id === newMaint.equipmentId);
    if (eq) {
      eq.lastMaintenanceDate = newMaint.date;
      eq.status = 'operational';
    }

    this.addAuditLog(actor, 'LOG_MAINTENANCE', 'Equipment', newMaint.id, undefined, `Serviced ${newMaint.equipmentName}`);
    this.saveState();
    return newMaint;
  }

  // USERS
  public addUser(userData: Omit<User, 'id'>, actor: User): User {
    const newUser: User = { ...userData, id: `usr-${Date.now()}` };
    this.state.users.push(newUser);
    this.addAuditLog(actor, 'CREATE_USER', 'Users', newUser.id, undefined, `${newUser.name} (${newUser.role})`);
    this.saveState();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>, actor: User): void {
    this.state.users = this.state.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
    this.addAuditLog(actor, 'UPDATE_USER', 'Users', id);
    this.saveState();
  }

  public deleteUser(id: string, actor: User): void {
    this.state.users = this.state.users.filter((u) => u.id !== id);
    this.addAuditLog(actor, 'DELETE_USER', 'Users', id);
    this.saveState();
  }

  // COUPONS & OFFERS PROMOTIONS
  public addCoupon(
    couponData: Omit<Coupon, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'totalDiscountGiven' | 'totalRevenueGenerated'>,
    actor: User
  ): Coupon {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: couponData.code.trim().toUpperCase(),
      usageCount: 0,
      totalDiscountGiven: 0,
      totalRevenueGenerated: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.state.coupons.unshift(newCoupon);
    this.addAuditLog(actor, 'CREATE_COUPON', 'Offers & Promotions', newCoupon.id, undefined, `${newCoupon.code} - ${newCoupon.title}`);
    this.addNotification('New Promotion Created', `Coupon code "${newCoupon.code}" (${newCoupon.title}) is now live.`, 'success');
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'offer',
        action: 'created',
        title: `Offer / Coupon Created: ${newCoupon.code}`,
        details: `${newCoupon.title} (${newCoupon.discountType === 'percentage' ? newCoupon.discountValue + '%' : '₹' + newCoupon.discountValue} Off)`,
      },
      this.state
    );
    return newCoupon;
  }

  public updateCoupon(id: string, updates: Partial<Coupon>, actor: User): void {
    const prev = this.state.coupons.find((c) => c.id === id);
    this.state.coupons = this.state.coupons.map((c) =>
      c.id === id
        ? {
            ...c,
            ...updates,
            code: updates.code ? updates.code.trim().toUpperCase() : c.code,
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    this.addAuditLog(actor, 'UPDATE_COUPON', 'Offers & Promotions', id, prev?.code, JSON.stringify(updates));
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'offer',
        action: 'updated',
        title: `Offer / Coupon Updated: ${updates.code || prev?.code || id}`,
        details: JSON.stringify(updates),
      },
      this.state
    );
  }

  public toggleCouponStatus(id: string, actor: User): void {
    const coupon = this.state.coupons.find((c) => c.id === id);
    if (!coupon) return;
    coupon.isActive = !coupon.isActive;
    coupon.updatedAt = new Date().toISOString();
    this.addAuditLog(
      actor,
      'TOGGLE_COUPON_STATUS',
      'Offers & Promotions',
      id,
      coupon.isActive ? 'Inactive' : 'Active',
      coupon.isActive ? 'Active' : 'Inactive'
    );
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'offer',
        action: 'updated',
        title: `Offer Status Toggled: ${coupon.code}`,
        details: `Now ${coupon.isActive ? 'Active' : 'Inactive'}`,
      },
      this.state
    );
  }

  public deleteCoupon(id: string, actor: User): void {
    const coupon = this.state.coupons.find((c) => c.id === id);
    this.state.coupons = this.state.coupons.filter((c) => c.id !== id);
    this.addAuditLog(actor, 'DELETE_COUPON', 'Offers & Promotions', id, coupon?.code, undefined);
    this.addNotification('Coupon Removed', `Promotional offer "${coupon?.code || id}" was deleted.`, 'info');
    this.saveState();
    catalogSyncService.recordAdminCatalogChange(
      {
        actor: actor.name,
        type: 'offer',
        action: 'deleted',
        title: `Offer Removed: ${coupon?.code || id}`,
      },
      this.state
    );
  }

  public applyCatalogImport(catalogData: any, actor: User): void {
    if (Array.isArray(catalogData.categories)) {
      this.state.categories = catalogData.categories;
    }
    if (Array.isArray(catalogData.menuItems)) {
      this.state.menuItems = catalogData.menuItems;
    }
    if (Array.isArray(catalogData.modifiers)) {
      this.state.modifiers = catalogData.modifiers;
    }
    if (Array.isArray(catalogData.coupons)) {
      this.state.coupons = catalogData.coupons;
    }
    if (catalogData.settings) {
      this.state.settings = { ...this.state.settings, ...catalogData.settings };
    }
    this.addAuditLog(actor, 'IMPORT_CATALOG', 'Menu', 'all', undefined, 'Applied imported offline catalog package');
    this.saveState();
  }

  public recordCouponUsage(couponId: string, discountAmount: number, orderTotal: number): void {
    const coupon = this.state.coupons.find((c) => c.id === couponId);
    if (!coupon) return;
    coupon.usageCount += 1;
    coupon.totalDiscountGiven += discountAmount;
    coupon.totalRevenueGenerated += orderTotal;
    coupon.updatedAt = new Date().toISOString();
    this.saveState();
  }
}

export const db = new RestaurantDatabase();
