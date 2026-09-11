import {
  AlertCircle,
  ArrowRight,
  Boxes,
  Building2,
  CheckSquare,
  Coffee,
  Cpu,
  FileText,
  Search,
  ShoppingCart,
  Truck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface GlobalSearchModalProps {
  onNavigateTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onNavigateTab }) => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    orders,
    menuItems,
    ingredients,
    suppliers,
    sopMasters,
    sopTasks,
    setReceiptModalOrder,
    setAdminSubTab,
  } = useRestaurant();

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeSopMasters = Array.isArray(sopMasters) ? sopMasters : [];

  const [query, setQuery] = useState('');

  if (!isSearchModalOpen) return null;

  const q = query.trim().toLowerCase();

  const isModuleMatch =
    q &&
    [
      'module',
      'matrix',
      'erp',
      'hardware',
      'return',
      'refund',
      'tally',
      'quickbooks',
      'netsuite',
      'scale',
      'cfd',
      'drawer',
      'architecture',
      'crm',
      'grn',
      'front-office',
      'back-office',
      'apparel',
      'retail',
      'peripherals',
    ].some((k) => q.includes(k));

  const matchedOrders = q
    ? safeOrders.filter(
        (o) =>
          String(o.orderNumber).includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.customerPhone?.includes(q) ||
          o.tableName?.toLowerCase().includes(q)
      )
    : [];

  const matchedMenuItems = q
    ? safeMenuItems.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.sku.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      )
    : [];

  const matchedIngredients = q
    ? safeIngredients.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.storageLocation.toLowerCase().includes(q)
      )
    : [];

  const matchedSOPs = q
    ? safeSopMasters.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      )
    : [];

  const matchedSuppliers = q
    ? safeSuppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    matchedOrders.length +
    matchedMenuItems.length +
    matchedIngredients.length +
    matchedSOPs.length +
    matchedSuppliers.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-4 pt-16 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden">
        {/* Search input header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            type="text"
            placeholder="Search orders, invoices, menu items, stock ingredients, SOPs, suppliers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden text-sm sm:text-base font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Enterprise System Modules & Architecture Quick Launcher */}
          {isModuleMatch && (
            <div
              onClick={() => {
                setAdminSubTab('enterprise_matrix');
                onNavigateTab('admin');
                setIsSearchModalOpen(false);
              }}
              className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 hover:from-amber-950/80 hover:to-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-white">
                      Enterprise System Modules &amp; Architecture Matrix
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
                      16 Modules Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                    Front-office checkout, payment gateways, returns &amp; refunds, inventory, vendor GRN, CRM, apparel matrix, ERP journals &amp; hardware drivers.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs shrink-0">
                <span>Open Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {!q ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
              Type anything to search across live database entities
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No matching records found for "{query}"
            </div>
          ) : (
            <>
              {/* Orders */}
              {matchedOrders.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                    <span>Customer Orders ({matchedOrders.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedOrders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          setReceiptModalOrder(o);
                          setIsSearchModalOpen(false);
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Order #{o.orderNumber}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 uppercase">
                              {o.orderType}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600">
                              {o.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {o.customerName} • {o.tableName || 'Takeaway/Delivery'} • {formatDateTime(o.createdAt)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {formatCurrency(o.grandTotal)}
                          </div>
                          <span className="text-[10px] text-amber-600 hover:underline">View Receipt →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {matchedMenuItems.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Menu Catalog Items ({matchedMenuItems.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedMenuItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onNavigateTab('pos');
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 cursor-pointer transition-colors"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">SKU: {item.sku}</div>
                          <div className="text-xs font-semibold text-amber-600">
                            {formatCurrency(item.basePrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Ingredients */}
              {matchedIngredients.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-500" />
                    <span>Stock & Ingredients ({matchedIngredients.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedIngredients.map((ing) => (
                      <div
                        key={ing.id}
                        onClick={() => {
                          onNavigateTab('inventory');
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {ing.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Category: {ing.category} • Location: {ing.storageLocation}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {ing.currentStock.toFixed(1)} {ing.unit}
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              ing.currentStock <= ing.minStock ? 'text-rose-500' : 'text-emerald-600'
                            }`}
                          >
                            {ing.currentStock <= ing.minStock ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers */}
              {matchedSuppliers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Authorized Suppliers & Vendors ({matchedSuppliers.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedSuppliers.map((sup) => (
                      <div
                        key={sup.id}
                        onClick={() => {
                          onNavigateTab('inventory');
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {sup.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Contact: {sup.contactPerson} • {sup.phone || 'No phone'} • {sup.paymentTerms}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                          VENDOR
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SOP Masters */}
              {matchedSOPs.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-purple-500" />
                    <span>Standard Operating Procedures ({matchedSOPs.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchedSOPs.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onNavigateTab('sop');
                          setIsSearchModalOpen(false);
                        }}
                        className="p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {s.title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {s.category.toUpperCase()} • {s.department} • {s.steps.length} Checklist Steps
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                          {s.frequency.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
          <span>Press ESC to exit</span>
          <span>Showing real-time database records</span>
        </div>
      </div>
    </div>
  );
};
