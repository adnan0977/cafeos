import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit2,
  FileSpreadsheet,
  Layers,
  PackageCheck,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  UtensilsCrossed,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Ingredient, PurchaseOrder, Recipe } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { AlertInventoryTab } from './AlertInventoryTab';
import { BulkInventoryImportModal } from './BulkInventoryImportModal';
import { IngredientModal } from './IngredientModal';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { RecipeModal } from './RecipeModal';
import { StockCountModal } from './StockCountModal';
import { WastageModal } from './WastageModal';
import { SupplierManagement } from './SupplierManagement';

interface InventoryPortalProps {
  initialSubTab?: 'alert' | 'stock' | 'recipes' | 'purchases' | 'suppliers' | 'wastage' | 'counts';
}

export const InventoryPortal: React.FC<InventoryPortalProps> = ({ initialSubTab }) => {
  const {
    ingredients,
    recipes,
    suppliers,
    purchases,
    wastage,
    stockCounts,
    deleteIngredient,
    deleteRecipe,
    addSupplier,
    updateSupplier,
    receivePurchaseOrder,
    approveStockCount,
    bulkImportIngredients,
    addPurchaseOrder,
    addExpense,
    settings,
  } = useRestaurant();
  const { hasPermission } = useAuth();

  const alertThreshold = settings.lowStockThreshold !== undefined ? settings.lowStockThreshold : 10;
  const alertItemsCount = ingredients.filter((i) => i.currentStock < alertThreshold).length;

  const [activeTab, setActiveTab] = useState<'alert' | 'stock' | 'recipes' | 'purchases' | 'suppliers' | 'wastage' | 'counts'>(
    initialSubTab || (alertItemsCount > 0 ? 'alert' : 'stock')
  );

  useEffect(() => {
    const handleOpenAlertTab = () => setActiveTab('alert');
    window.addEventListener('open-inventory-alert-tab', handleOpenAlertTab);
    return () => window.removeEventListener('open-inventory-alert-tab', handleOpenAlertTab);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals state
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    if (categoryFilter !== 'all' && ing.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ing.name.toLowerCase().includes(q) ||
        ing.category.toLowerCase().includes(q) ||
        ing.storageLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minStock).length;
  const totalStockValue = ingredients.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);

  const handleExportIngredients = () => {
    const data = filteredIngredients.map((i) => ({
      Name: i.name,
      Category: i.category,
      CurrentStock: i.currentStock,
      Unit: i.unit,
      MinThreshold: i.minStock,
      CostPerUnit: i.costPerUnit,
      TotalValuation: i.currentStock * i.costPerUnit,
      Supplier: i.supplierName,
      Location: i.storageLocation,
    }));
    exportToCSV('Inventory_Valuation_Report', data);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 space-y-6">
      {/* Top Inventory Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-slate-500">Total Stock Valuation</div>
            <Boxes className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalStockValue, settings.currencySymbol)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {ingredients.length} active raw items</div>
        </div>

        {/* Low Stock Alert Metric Box - Clickable to open Alert tab */}
        <div
          onClick={() => setActiveTab('alert')}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
              Low Stock Alerts (&lt; {alertThreshold})
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {alertItemsCount} Items
          </div>
          <div className="text-[11px] text-rose-600/80 font-semibold mt-1 flex items-center justify-between">
            <span>Click to view Alert Inventory</span>
            <span>&rarr;</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-indigo-500">Engineered Recipes</div>
            <UtensilsCrossed className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {recipes.length} Formulas
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Auto-deducted upon billing</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-emerald-500">Active PO Shipments</div>
            <Truck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {purchases.filter((p) => p.status === 'pending').length} In Transit
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting receiving dock check</div>
        </div>
      </div>

      {/* Navigation Subtabs & Action Buttons */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'alert', label: 'Alert Inventory', count: alertItemsCount, isAlert: true },
            { id: 'stock', label: 'Raw Materials & Stock', count: ingredients.length },
            { id: 'recipes', label: 'Recipe Engineering & BOM', count: recipes.length },
            { id: 'purchases', label: 'Purchase Orders (PO)', count: purchases.length },
            { id: 'suppliers', label: 'Vendors & Suppliers', count: suppliers.length },
            { id: 'wastage', label: 'Wastage & Spoilage', count: wastage.length },
            { id: 'counts', label: 'Physical Audits', count: stockCounts.length },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? tab.isAlert
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                      : 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : tab.isAlert && tab.count > 0
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.isAlert && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : tab.isAlert && tab.count > 0
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'opacity-80'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action button corresponding to active tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'stock' && (
            <>
              <button
                onClick={handleExportIngredients}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsBulkImportModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Bulk CSV / Receipt AI Scan</span>
              </button>
              <button
                onClick={() => {
                  setEditingIngredient(null);
                  setIsIngredientModalOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Raw Ingredient</span>
              </button>
            </>
          )}

          {activeTab === 'recipes' && (
            <button
              onClick={() => {
                setEditingRecipe(null);
                setIsRecipeModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Recipe / BOM</span>
            </button>
          )}

          {activeTab === 'purchases' && (
            <button
              onClick={() => setIsPOModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          )}

          {activeTab === 'wastage' && (
            <button
              onClick={() => setIsWastageModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Spoilage / Wastage</span>
            </button>
          )}

          {activeTab === 'counts' && (
            <button
              onClick={() => setIsCountModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Perform Stock Count</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 0: Alert Inventory */}
      {activeTab === 'alert' && (
        <AlertInventoryTab
          onOpenEditIngredient={(ing) => {
            setEditingIngredient(ing);
            setIsIngredientModalOpen(true);
          }}
          onOpenAddPO={() => setIsPOModalOpen(true)}
        />
      )}

      {/* TAB 1: Stock & Raw Materials */}
      {activeTab === 'stock' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search raw materials, beans, milk, packaging..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="all">All Categories ({ingredients.length})</option>
                {Array.from(new Set(ingredients.map((i) => i.category).filter(Boolean))).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({ingredients.filter((i) => i.category === cat).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Ingredient Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Min Reorder Level</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4">Total Value</th>
                  <th className="py-3 px-4">Primary Supplier</th>
                  <th className="py-3 px-4">Storage Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredIngredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minStock;
                  return (
                    <tr
                      key={ing.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{ing.name}</span>
                          {isLow && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                              Reorder
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{ing.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-black text-sm ${
                            isLow ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {ing.currentStock.toFixed(2)} {ing.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {ing.minStock} {ing.unit}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {formatCurrency(ing.costPerUnit)} / {ing.unit}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(ing.currentStock * ing.costPerUnit)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {ing.supplierName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{ing.storageLocation}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingIngredient(ing);
                              setIsIngredientModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${ing.name}?`)) deleteIngredient(ing.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Recipes & BOM */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {r.menuItemName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Prep time: {r.prepTimeMinutes} mins • Yield: {r.servingSize} portion(s)
                    </p>
                  </div>
                  <div className="text-right font-black text-emerald-600 text-sm">
                    Cost: {formatCurrency(r.totalCost)}
                  </div>
                </div>

                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Formula Raw Materials:
                  </div>
                  {r.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>
                        {ing.quantity} {ing.unit} {ing.ingredientName}
                      </span>
                      <span className="font-semibold text-slate-500">
                        {formatCurrency(ing.cost)}
                      </span>
                    </div>
                  ))}
                </div>

                {r.instructions && r.instructions.length > 0 && (
                  <div className="mt-3 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Steps: </span>
                    {r.instructions.join(' → ')}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingRecipe(r);
                    setIsRecipeModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Edit BOM
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete recipe formula?')) deleteRecipe(r.id);
                  }}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Purchase Orders */}
      {activeTab === 'purchases' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Ordered Items</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {po.supplierName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {po.items.map((i) => `${i.orderedQuantity} ${i.unit} ${i.ingredientName}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(po.orderDate)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status === 'pending' && (
                        <button
                          onClick={() => {
                            const invoice = prompt('Enter Supplier Tax Invoice #', 'INV-' + Date.now().toString().slice(-4));
                            if (invoice) receivePurchaseOrder(po.id, invoice);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                        >
                          Receive & Stock In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Vendors & Suppliers */}
      {activeTab === 'suppliers' && (
        <SupplierManagement
          suppliers={suppliers}
          ingredients={ingredients}
          onAddSupplier={addSupplier}
          onUpdateSupplier={updateSupplier}
        />
      )}

      {/* TAB 4: Wastage */}
      {activeTab === 'wastage' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Quantity Wasted</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wastage.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(w.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {w.ingredientName}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-rose-600">
                      -{w.quantity} {w.unit}
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                      {w.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{w.reportedBy}</td>
                    <td className="py-3 px-4 text-slate-500 italic">{w.notes || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Stock Counts & Audits */}
      {activeTab === 'counts' && (
        <div className="space-y-4">
          {stockCounts.map((sc) => (
            <div
              key={sc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {sc.type.toUpperCase()} AUDIT #{sc.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sc.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {sc.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Audited by {sc.performedBy} on {formatDateTime(sc.date)}
                  </div>
                </div>

                {sc.status === 'submitted' && hasPermission('approve_stock_variance') && (
                  <button
                    onClick={() => approveStockCount(sc.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Sync Book Balance</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {sc.items.slice(0, 8).map((item) => (
                  <div
                    key={item.ingredientId}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.ingredientName}
                    </div>
                    <div className="flex justify-between mt-1 text-[11px]">
                      <span className="text-slate-400">Sys: {item.systemStock}</span>
                      <span
                        className={`font-bold ${
                          Math.abs(item.variance) < 0.01 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        Var: {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sub-modals */}
      {isIngredientModalOpen && (
        <IngredientModal
          ingredient={editingIngredient}
          onClose={() => setIsIngredientModalOpen(false)}
        />
      )}

      {isRecipeModalOpen && (
        <RecipeModal
          recipe={editingRecipe}
          onClose={() => setIsRecipeModalOpen(false)}
        />
      )}

      {isPOModalOpen && <PurchaseOrderModal onClose={() => setIsPOModalOpen(false)} />}
      {isWastageModalOpen && <WastageModal onClose={() => setIsWastageModalOpen(false)} />}
      {isCountModalOpen && <StockCountModal onClose={() => setIsCountModalOpen(false)} />}

      {isBulkImportModalOpen && (
        <BulkInventoryImportModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
          ingredients={ingredients}
          suppliers={suppliers}
          currencySymbol={settings.currencySymbol}
          onBulkImport={bulkImportIngredients}
          onAddPurchaseOrder={addPurchaseOrder}
          onAddExpense={addExpense}
        />
      )}
    </div>
  );
};
