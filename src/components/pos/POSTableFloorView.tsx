import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  DollarSign,
  Flame,
  Plus,
  Receipt,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, RestaurantTable } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface POSTableFloorViewProps {
  selectedTableId?: string;
  onSelectTableForCart: (table: RestaurantTable) => void;
  onSelectOrderToPay: (order: Order) => void;
  onAddItemsToTableOrder: (order: Order) => void;
}

export const POSTableFloorView: React.FC<POSTableFloorViewProps> = ({
  selectedTableId,
  onSelectTableForCart,
  onSelectOrderToPay,
  onAddItemsToTableOrder,
}) => {
  const {
    tables,
    orders,
    settings,
    clearTableStatus,
    setReceiptModalOrder,
    setKOTModalOrder,
    updateOrderStatus,
  } = useRestaurant();

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [activeTableModal, setActiveTableModal] = useState<{
    table: RestaurantTable;
    order?: Order;
  } | null>(null);

  const sections = ['all', ...Array.from(new Set(tables.map((t) => t.section)))];

  const filteredTables =
    selectedSection === 'all'
      ? tables
      : tables.filter((t) => t.section === selectedSection);

  // Status counters
  const totalTables = tables.length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const inPrepCount = tables.filter((t) => {
    if (t.status === 'occupied' || t.status === 'in_prep') {
      const order = orders.find((o) => o.id === t.currentOrderId);
      return (
        order &&
        ['in_prep', 'kot_generated', 'new', 'confirmed', 'kitchen_accepted', 'preparing'].includes(order.status) &&
        order.paymentStatus !== 'paid'
      );
    }
    return false;
  }).length;

  const readyCount = tables.filter((t) => {
    if (t.status === 'ready') return true;
    const order = orders.find((o) => o.id === t.currentOrderId);
    return order && order.status === 'ready';
  }).length;

  const billPendingCount = tables.filter((t) => {
    if (t.status === 'payment_pending') return true;
    const order = orders.find((o) => o.id === t.currentOrderId);
    return order && (order.status === 'bill_generated' || order.status === 'served') && order.paymentStatus !== 'paid';
  }).length;

  const getTableMeta = (table: RestaurantTable) => {
    const activeOrder = orders.find((o) => o.id === table.currentOrderId && o.paymentStatus !== 'paid');

    // Dynamic status determination based on active order
    let statusLabel = 'Available';
    let statusColor = 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300';
    let badgeColor = 'bg-emerald-500 text-white';
    let statusKey: 'available' | 'in_prep' | 'ready' | 'bill_pending' | 'cleaning' = 'available';

    if (table.status === 'cleaning') {
      statusLabel = 'Cleaning';
      statusColor = 'border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300';
      badgeColor = 'bg-blue-500 text-white';
      statusKey = 'cleaning';
    } else if (activeOrder) {
      if (activeOrder.status === 'ready' || table.status === 'ready') {
        statusLabel = 'Food Ready!';
        statusColor = 'border-teal-400 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 shadow-md ring-2 ring-teal-400/40';
        badgeColor = 'bg-teal-500 text-white animate-pulse';
        statusKey = 'ready';
      } else if (activeOrder.status === 'bill_generated' || activeOrder.status === 'served' || table.status === 'payment_pending') {
        statusLabel = 'Bill Pending';
        statusColor = 'border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300';
        badgeColor = 'bg-purple-600 text-white';
        statusKey = 'bill_pending';
      } else {
        statusLabel = 'In Prep';
        statusColor = 'border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 shadow-xs';
        badgeColor = 'bg-amber-500 text-white';
        statusKey = 'in_prep';
      }
    }

    return {
      activeOrder,
      statusLabel,
      statusColor,
      badgeColor,
      statusKey,
    };
  };

  const getElapsed = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    return `${mins}m ago`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* SECTION TABS & STATUS BAR */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Section Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                selectedSection === sec
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {sec === 'all' ? 'All Sections' : sec}
            </button>
          ))}
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {availableCount} Available
          </span>
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {inPrepCount} In Prep
          </span>
          <span className="px-2.5 py-1 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            {readyCount} Ready
          </span>
          <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-lg flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            {billPendingCount} Bill Pending
          </span>
        </div>
      </div>

      {/* TABLES GRID */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const { activeOrder, statusLabel, statusColor, badgeColor, statusKey } =
              getTableMeta(table);
            const isSelected = selectedTableId === table.id;

            return (
              <div
                key={table.id}
                onClick={() => {
                  if (activeOrder) {
                    setActiveTableModal({ table, order: activeOrder });
                  } else if (table.status === 'cleaning') {
                    clearTableStatus(table.id);
                  } else {
                    onSelectTableForCart(table);
                  }
                }}
                className={`rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${statusColor} ${
                  isSelected ? 'ring-3 ring-amber-500 scale-[1.02]' : 'hover:shadow-lg'
                }`}
              >
                {/* Table Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4 opacity-70" />
                      <span className="font-black text-lg tracking-tight">
                        {table.number}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs ${badgeColor}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="font-bold text-xs line-clamp-1">{table.name}</div>
                  <div className="text-[11px] opacity-75 mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Seats {table.capacity}</span>
                    <span className="capitalize">• {table.section}</span>
                  </div>
                </div>

                {/* Active Order Preview */}
                {activeOrder ? (
                  <div className="mt-3 pt-2.5 border-t border-current/20 text-xs space-y-1">
                    <div className="flex items-center justify-between font-extrabold">
                      <span>Order #{activeOrder.orderNumber}</span>
                      <span className="text-amber-800 dark:text-amber-300">
                        {formatCurrency(activeOrder.grandTotal, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] opacity-80">
                      <span>{activeOrder.items.length} items</span>
                      <span className="flex items-center gap-0.5 font-medium">
                        <Clock className="w-3 h-3" /> {getElapsed(activeOrder.createdAt)}
                      </span>
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddItemsToTableOrder(activeOrder);
                        }}
                        className="py-1 px-2 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white font-bold text-[11px] hover:bg-white shadow-2xs flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> +Items
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrderToPay(activeOrder);
                        }}
                        className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs flex items-center justify-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" /> Settle
                      </button>
                    </div>
                  </div>
                ) : table.status === 'cleaning' ? (
                  <div className="mt-3 pt-2.5 border-t border-current/20 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTableStatus(table.id);
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Ready
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-2 border-t border-current/20 text-[11px] opacity-75 flex items-center justify-between">
                    <span>Tap to place order</span>
                    <span className="font-bold">Ready →</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE TABLE DETAIL MODAL */}
      {activeTableModal && activeTableModal.order && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <span>{activeTableModal.table.number}</span>
                  <span className="text-xs font-normal text-slate-300">
                    • {activeTableModal.table.name}
                  </span>
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  Order #{activeTableModal.order.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveTableModal(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-slate-500 font-semibold">Current Kitchen Status:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 capitalize">
                  {activeTableModal.order.status.replace('_', ' ')}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {activeTableModal.order.items.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {it.quantity}x {it.name}
                      </span>
                      {it.variantName && (
                        <span className="text-slate-500 text-[11px] ml-1">
                          ({it.variantName})
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(it.unitPrice * it.quantity, settings.currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center font-black text-sm">
                <span>Grand Total</span>
                <span className="text-amber-600 dark:text-amber-400 text-base">
                  {formatCurrency(activeTableModal.order.grandTotal, settings.currencySymbol)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setKOTModalOrder(activeTableModal.order!);
                    setActiveTableModal(null);
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center justify-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Print KOT
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReceiptModalOrder(activeTableModal.order!);
                    setActiveTableModal(null);
                  }}
                  className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center justify-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5" /> Print Bill
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAddItemsToTableOrder(activeTableModal.order!);
                    setActiveTableModal(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-extrabold hover:bg-amber-100 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add More Items
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectOrderToPay(activeTableModal.order!);
                    setActiveTableModal(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-1"
                >
                  <DollarSign className="w-4 h-4" /> Settle & Pay
                </button>
              </div>

              {/* Start new ticket for other customer */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTableForCart(activeTableModal.table);
                    setActiveTableModal(null);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Seat New Customer (Start New Tab)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
