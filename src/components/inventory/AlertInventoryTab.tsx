import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit2,
  FileSpreadsheet,
  Filter,
  PackageX,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Settings,
  ShoppingCart,
  Sliders,
  Sparkles,
  TrendingDown,
  Truck,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Ingredient, Supplier } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  AlertInventoryItemData,
  calculateStockStatus,
  calculateSuggestedPurchaseQty,
  mapIngredientToAlertItem,
} from '../../utils/hoinPrinterUtils';
import { HoinPrintModal } from './HoinPrintModal';
import { HoinSettingsModal } from './HoinSettingsModal';
import { QuickPurchaseListModal } from './QuickPurchaseListModal';

interface AlertInventoryTabProps {
  onOpenEditIngredient?: (ingredient: Ingredient) => void;
  onOpenAddPO?: () => void;
}

export const AlertInventoryTab: React.FC<AlertInventoryTabProps> = ({
  onOpenEditIngredient,
}) => {
  const { ingredients, suppliers, settings, updateSettings } = useRestaurant();
  const { currentUser } = useAuth();

  const threshold = settings.lowStockThreshold !== undefined ? settings.lowStockThreshold : 10;

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'OUT OF STOCK' | 'CRITICAL' | 'LOW STOCK'>('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'criticality' | 'stock' | 'name' | 'category' | 'supplier' | 'purchaseQty'>('criticality');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Manual Suggested Quantity overrides (key: ingredient id)
  const [manualSuggestedMap, setManualSuggestedMap] = useState<{ [id: string]: number }>({});

  // Selection for batch actions (Print Selected, Create PO)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalMode, setPrintModalMode] = useState<'alert_inventory' | 'purchase_list'>('alert_inventory');
  const [itemsToPrint, setItemsToPrint] = useState<AlertInventoryItemData[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isQuickPOModalOpen, setIsQuickPOModalOpen] = useState(false);

  // 1. Filter raw ingredients by threshold rule: currentStock < threshold
  const rawAlertIngredients = useMemo(() => {
    return ingredients.filter((ing) => ing.currentStock < threshold);
  }, [ingredients, threshold]);

  // 2. Map into rich AlertInventoryItemData objects
  const alertItems: AlertInventoryItemData[] = useMemo(() => {
    return rawAlertIngredients.map((ing) => {
      const overrideQty = manualSuggestedMap[ing.id];
      return mapIngredientToAlertItem(ing, suppliers, threshold, overrideQty);
    });
  }, [rawAlertIngredients, suppliers, threshold, manualSuggestedMap]);

  // 3. Category, Storage Location, and Supplier list for dynamic dropdowns
  const categoriesList = useMemo(() => {
    return Array.from(new Set(ingredients.map((i) => i.category).filter(Boolean)));
  }, [ingredients]);

  const storeLocationsList = useMemo(() => {
    return Array.from(new Set(ingredients.map((i) => i.storageLocation).filter(Boolean)));
  }, [ingredients]);

  // 4. Metric calculations for 4 Dashboard Cards
  const lowStockTotalCount = alertItems.length;
  const outOfStockCount = alertItems.filter((i) => i.status === 'OUT OF STOCK').length;
  const criticalStockCount = alertItems.filter((i) => i.status === 'CRITICAL').length;
  const standardLowStockCount = alertItems.filter((i) => i.status === 'LOW STOCK').length;
  const totalSuggestedPurchaseQty = alertItems.reduce((sum, i) => sum + i.suggestedPurchaseQty, 0);
  const totalEstimatedReplenishCost = alertItems.reduce(
    (sum, i) => sum + i.suggestedPurchaseQty * i.costPerUnit,
    0
  );

  // 5. Apply UI Filters & Sorting
  const filteredAndSortedItems = useMemo(() => {
    let result = alertItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (storeFilter !== 'all' && item.storageLocation !== storeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (supplierFilter !== 'all' && item.supplierId !== supplierFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.supplierName.toLowerCase().includes(q) ||
          item.storageLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'criticality') {
        const score = (status: string) => (status === 'OUT OF STOCK' ? 0 : status === 'CRITICAL' ? 1 : 2);
        const scoreDiff = score(a.status) - score(b.status);
        if (scoreDiff !== 0) {
          comparison = scoreDiff;
        } else {
          comparison = a.currentStock - b.currentStock;
        }
      } else if (sortBy === 'stock') {
        comparison = a.currentStock - b.currentStock;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === 'supplier') {
        comparison = a.supplierName.localeCompare(b.supplierName);
      } else if (sortBy === 'purchaseQty') {
        comparison = a.suggestedPurchaseQty - b.suggestedPurchaseQty;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [
    alertItems,
    categoryFilter,
    storeFilter,
    statusFilter,
    supplierFilter,
    searchQuery,
    sortBy,
    sortDirection,
  ]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedItems.length && filteredAndSortedItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedItems.map((i) => i.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Inline Suggested Qty edit
  const handleEditSuggestedQty = (id: string, value: number) => {
    setManualSuggestedMap((prev) => ({
      ...prev,
      [id]: Math.max(0, value),
    }));
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredAndSortedItems.length === 0) {
      alert('No alert items match the selected filter to export.');
      return;
    }

    const exportRows = filteredAndSortedItems.map((it) => ({
      SKU: it.sku,
      'Item Name': it.name,
      Category: it.category,
      Store: it.storageLocation,
      Unit: it.unit,
      'Current Stock': it.currentStock,
      'Minimum Stock': it.minStock,
      'Target Stock': it.targetStock,
      'Suggested Purchase Qty': it.suggestedPurchaseQty,
      Supplier: it.supplierName,
      'Last Purchase Date': it.lastPurchaseDate || 'Recent',
      Status: it.status,
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(`Alert_Inventory_${dateStr}`, exportRows);
  };

  // Open Print Modal for All Filtered
  const handlePrintAll = () => {
    setItemsToPrint(filteredAndSortedItems);
    setPrintModalMode('alert_inventory');
    setIsPrintModalOpen(true);
  };

  // Open Print Modal for Selected
  const handlePrintSelected = () => {
    const selected = filteredAndSortedItems.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return;
    setItemsToPrint(selected);
    setPrintModalMode('alert_inventory');
    setIsPrintModalOpen(true);
  };

  // Open Quick Purchase Modal
  const handleOpenQuickPO = () => {
    const selected =
      selectedIds.size > 0
        ? filteredAndSortedItems.filter((i) => selectedIds.has(i.id))
        : filteredAndSortedItems;
    setItemsToPrint(selected);
    setIsQuickPOModalOpen(true);
  };

  // Direct print single item
  const handlePrintSingle = (item: AlertInventoryItemData) => {
    setItemsToPrint([item]);
    setPrintModalMode('alert_inventory');
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Low Stock Items */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase text-amber-700 dark:text-amber-400">
              Low Stock Items
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {lowStockTotalCount} <span className="text-xs font-semibold text-slate-500">Items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Stock &lt; {threshold} units limit</span>
            <span className="font-bold text-amber-600">Threshold: {threshold}</span>
          </div>
        </div>

        {/* Card 2: Out of Stock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase text-rose-700 dark:text-rose-400">
              Out of Stock
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <PackageX className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {outOfStockCount} <span className="text-xs font-semibold text-slate-500">Items</span>
          </div>
          <div className="text-[11px] text-rose-600/80 font-semibold mt-1">
            Current stock is 0 or negative
          </div>
        </div>

        {/* Card 3: Critical Stock */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-orange-200 dark:border-orange-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase text-orange-700 dark:text-orange-400">
              Critical Stock
            </div>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-2">
            {criticalStockCount} <span className="text-xs font-semibold text-slate-500">Items</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Stock &le; 25% of Minimum Level
          </div>
        </div>

        {/* Card 4: Total Items Requiring Purchase */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black uppercase text-indigo-700 dark:text-indigo-400">
              Total Requiring Purchase
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
            {lowStockTotalCount} <span className="text-xs font-semibold text-slate-500">Items</span>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-300 font-bold mt-1">
            Est. PO Cost: {formatCurrency(totalEstimatedReplenishCost, settings.currencySymbol)}
          </div>
        </div>
      </div>

      {/* Main Alert Inventory Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Top Header & Actions Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Low Stock Alert Inventory
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                Rule: Stock &lt; {threshold}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live automated alerts for all raw ingredients & packaging below the threshold.
            </p>
          </div>

          {/* Action Buttons: CSV Export, Print Alert, Create Purchase List, Settings */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Threshold Quick Configure Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Change Low Stock Threshold & Printer Settings"
            >
              <Settings className="w-3.5 h-3.5 text-amber-600" />
              <span>Threshold ({threshold})</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Print Selected (Visible when items are selected) */}
            {selectedIds.size > 0 && (
              <button
                onClick={handlePrintSelected}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Selected ({selectedIds.size})</span>
              </button>
            )}

            {/* Print All Alert Inventory on HOIN Thermal */}
            <button
              onClick={handlePrintAll}
              disabled={filteredAndSortedItems.length === 0}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Alert Inventory</span>
            </button>

            {/* Create Purchase Order from Alert List */}
            <button
              onClick={handleOpenQuickPO}
              disabled={filteredAndSortedItems.length === 0}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>
                {selectedIds.size > 0
                  ? `Create PO (${selectedIds.size})`
                  : 'Create Purchase List'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar (Search, Category, Store, Status, Supplier, Sort) */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search alert items by SKU, name, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Store / Location Filter */}
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Storage Locations</option>
              {storeLocationsList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Stock Statuses</option>
              <option value="OUT OF STOCK">Out of Stock (0)</option>
              <option value="CRITICAL">Critical Stock</option>
              <option value="LOW STOCK">Low Stock (&lt; min)</option>
            </select>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-0.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden py-1"
              >
                <option value="criticality">Criticality (Urgent First)</option>
                <option value="stock">Current Stock (Lowest First)</option>
                <option value="name">Item Name (A-Z)</option>
                <option value="category">Category</option>
                <option value="supplier">Supplier</option>
                <option value="purchaseQty">Suggested Qty</option>
              </select>
              <button
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredAndSortedItems.length &&
                      filteredAndSortedItems.length > 0
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Item Code / SKU</th>
                <th className="py-3 px-3">Item Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Store Location</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Min Stock</th>
                <th className="py-3 px-3 text-right">Suggested Purchase</th>
                <th className="py-3 px-3">Primary Supplier</th>
                <th className="py-3 px-3">Last Purchase</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          ✓ Inventory Looks Good!
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          No items are currently below the configured stock threshold ({threshold} units). All inventory levels are healthy.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isOutOfStock = item.status === 'OUT OF STOCK';
                  const isCritical = item.status === 'CRITICAL';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : isOutOfStock
                          ? 'bg-rose-50/30 dark:bg-rose-950/10'
                          : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                        {item.sku}
                      </td>

                      {/* Item Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </td>

                      {/* Storage Location */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {item.storageLocation}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-3 text-slate-500 font-medium">
                        {item.unit}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-black px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-mono'
                              : isCritical
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300'
                              : 'text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                      </td>

                      {/* Min Stock */}
                      <td className="py-3 px-3 text-right font-medium text-slate-500">
                        {item.minStock} {item.unit}
                      </td>

                      {/* Suggested Purchase Qty (Editable) */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.suggestedPurchaseQty}
                            onChange={(e) =>
                              handleEditSuggestedQty(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 px-2 py-1 bg-amber-50/50 dark:bg-slate-800 border border-amber-300 dark:border-slate-700 rounded-lg text-xs font-black text-right text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <span className="text-[11px] text-slate-500 font-semibold">
                            {item.unit}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px]">
                          {item.supplierName}
                        </div>
                      </td>

                      {/* Last Purchase Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {item.lastPurchaseDate}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            isOutOfStock
                              ? 'bg-rose-600 text-white shadow-xs'
                              : isCritical
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {isOutOfStock && <PackageX className="w-3 h-3" />}
                          {isCritical && <AlertTriangle className="w-3 h-3" />}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintSingle(item)}
                            title="Print Single Item Thermal Slip"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {onOpenEditIngredient && (
                            <button
                              onClick={() => {
                                const orig = ingredients.find((i) => i.id === item.id);
                                if (orig) onOpenEditIngredient(orig);
                              }}
                              title="Edit Ingredient Details"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary / Batch Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Showing <span className="font-bold text-slate-900 dark:text-white">{filteredAndSortedItems.length}</span> low-stock items
            {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">
              Total Replenish Qty: <span className="text-indigo-600 font-black">{totalSuggestedPurchaseQty} units</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Est. PO Total: <span className="text-emerald-600 font-black">{formatCurrency(totalEstimatedReplenishCost, settings.currencySymbol)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* HOIN Thermal Print Modal */}
      <HoinPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        items={itemsToPrint}
        mode={printModalMode}
        threshold={threshold}
        onOpenSettings={() => {
          setIsPrintModalOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

      {/* HOIN Settings & Threshold Modal */}
      <HoinSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Quick Purchase List / Order Modal */}
      <QuickPurchaseListModal
        isOpen={isQuickPOModalOpen}
        onClose={() => setIsQuickPOModalOpen(false)}
        items={itemsToPrint}
        onOpenPrintPurchaseList={(selected) => {
          setItemsToPrint(selected);
          setPrintModalMode('purchase_list');
          setIsPrintModalOpen(true);
        }}
      />
    </div>
  );
};
