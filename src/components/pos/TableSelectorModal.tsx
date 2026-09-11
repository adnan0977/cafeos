import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  Plus,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, RestaurantTable } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TableSelectorModalProps {
  selectedTableId?: string;
  guestCount: number;
  onSelectTable: (table: RestaurantTable, guestCount: number) => void;
  onSelectOrderToAppend?: (order: Order) => void;
  onSelectOrderToSettle?: (order: Order) => void;
  onClose: () => void;
}

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  selectedTableId,
  guestCount: initialGuests,
  onSelectTable,
  onSelectOrderToAppend,
  onSelectOrderToSettle,
  onClose,
}) => {
  const { tables, orders, clearTableStatus, settings } = useRestaurant();
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [guests, setGuests] = useState<number>(initialGuests || 2);
  const [activeOccupiedTable, setActiveOccupiedTable] = useState<{
    table: RestaurantTable;
    order: Order;
  } | null>(null);

  const sections = ['all', ...Array.from(new Set(tables.map((t) => t.section)))];

  const filteredTables =
    selectedSection === 'all'
      ? tables
      : tables.filter((t) => t.section === selectedSection);

  const getTableMeta = (table: RestaurantTable) => {
    const activeOrder = orders.find(
      (o) => o.id === table.currentOrderId && o.paymentStatus !== 'paid' && o.status !== 'cancelled'
    );

    let statusLabel = 'Available';
    let statusBg = 'bg-emerald-50/80 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300';
    let badgeBg = 'bg-emerald-500 text-white';

    if (table.status === 'cleaning') {
      statusLabel = 'Cleaning';
      statusBg = 'bg-blue-50/80 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300';
      badgeBg = 'bg-blue-500 text-white';
    } else if (activeOrder) {
      if (activeOrder.status === 'ready' || table.status === 'ready') {
        statusLabel = 'Food Ready!';
        statusBg = 'bg-teal-50 border-teal-400 text-teal-900 dark:bg-teal-950/40 dark:border-teal-700 dark:text-teal-200 shadow-sm ring-1 ring-teal-400/40';
        badgeBg = 'bg-teal-500 text-white animate-pulse';
      } else if (
        activeOrder.status === 'bill_generated' ||
        activeOrder.status === 'served' ||
        table.status === 'payment_pending'
      ) {
        statusLabel = 'Bill Pending';
        statusBg = 'bg-purple-50 border-purple-300 text-purple-900 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-200';
        badgeBg = 'bg-purple-600 text-white';
      } else {
        statusLabel = 'In Prep';
        statusBg = 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200';
        badgeBg = 'bg-amber-500 text-white';
      }
    }

    return { activeOrder, statusLabel, statusBg, badgeBg };
  };

  const handleTableClick = (table: RestaurantTable) => {
    const { activeOrder } = getTableMeta(table);

    // If cleaning, mark ready and select immediately
    if (table.status === 'cleaning') {
      clearTableStatus(table.id);
      onSelectTable({ ...table, status: 'available', currentOrderId: undefined }, guests);
      onClose();
      return;
    }

    // If occupied with an active order, show options
    if (activeOrder) {
      setActiveOccupiedTable({ table, order: activeOrder });
      return;
    }

    // Available table: select directly
    onSelectTable(table, guests);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Dine-In Floor & Table Selector
              </h3>
              <p className="text-xs text-slate-500">
                Select table and guest count for Dine-in orders or seat new customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest count & Section Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Users className="w-4 h-4 text-amber-500" />
              Party Size / Guests:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {[1, 2, 3, 4, 6, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGuests(num)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    guests === num
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Floor Section Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {sections.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  selectedSection === sec
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {sec === 'all' ? 'All Sections' : sec}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Visual Grid */}
        <div className="p-6 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredTables.map((table) => {
              const { activeOrder, statusLabel, statusBg, badgeBg } = getTableMeta(table);
              const isSelected = selectedTableId === table.id;

              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200 relative ${statusBg} ${
                    isSelected ? 'ring-3 ring-amber-500 scale-[1.02]' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {table.number}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeBg} shadow-2xs`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {table.name}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Seats {table.capacity} guests</span>
                  </div>

                  {activeOrder && (
                    <div className="mt-3 pt-2 border-t border-current/20 text-[10px] text-slate-800 dark:text-slate-200">
                      <div className="font-bold flex justify-between">
                        <span>#{activeOrder.orderNumber}</span>
                        <span>{formatCurrency(activeOrder.grandTotal, settings.currencySymbol)}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 capitalize">
                        {activeOrder.status.replace('_', ' ')} • Tap to manage
                      </div>
                    </div>
                  )}

                  {table.status === 'cleaning' && (
                    <div className="mt-2.5 pt-1.5 border-t border-current/20 text-[10px] font-bold text-blue-700 dark:text-blue-300 text-center">
                      Tap to Ready & Seat
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              In Prep
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              Food Ready
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              Bill Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Cleaning
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* POPUP PROMPT FOR OCCUPIED TABLE SELECTION */}
      {activeOccupiedTable && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{activeOccupiedTable.table.number}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({activeOccupiedTable.table.name})
                  </span>
                </h4>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Running Order #{activeOccupiedTable.order.orderNumber} •{' '}
                  {formatCurrency(activeOccupiedTable.order.grandTotal, settings.currencySymbol)}
                </p>
              </div>
              <button
                onClick={() => setActiveOccupiedTable(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              What would you like to do with this table?
            </p>

            <div className="space-y-2">
              {/* Option 1: Seat New Customer */}
              <button
                type="button"
                onClick={() => {
                  onSelectTable(activeOccupiedTable.table, guests);
                  setActiveOccupiedTable(null);
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Seat New Customer (Start New Tab)</span>
              </button>

              {/* Option 2: Add Items to Running Order */}
              {onSelectOrderToAppend && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectOrderToAppend(activeOccupiedTable.order);
                    setActiveOccupiedTable(null);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Items to Tab #{activeOccupiedTable.order.orderNumber}</span>
                </button>
              )}

              {/* Option 3: Settle Bill */}
              {onSelectOrderToSettle && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectOrderToSettle(activeOccupiedTable.order);
                    setActiveOccupiedTable(null);
                    onClose();
                  }}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Settle Bill ({formatCurrency(activeOccupiedTable.order.grandTotal, settings.currencySymbol)})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

