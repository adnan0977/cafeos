import {
  AlertCircle,
  ArrowRightLeft,
  Check,
  Clock,
  DollarSign,
  Maximize2,
  Minimize2,
  Printer,
  Receipt,
  RotateCcw,
  Sparkles,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, RestaurantTable } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface TableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTableForNewBill: (tableName: string) => void;
  onLoadActiveTableOrder: (order: Order) => void;
}

export const TableManagementModal: React.FC<TableManagementModalProps> = ({
  isOpen,
  onClose,
  onSelectTableForNewBill,
  onLoadActiveTableOrder,
}) => {
  const {
    tables,
    orders,
    settings,
    clearTableStatus,
    setReceiptModalOrder,
    setKOTModalOrder,
    updateTable,
  } = useRestaurant();

  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [transferSourceTable, setTransferSourceTable] = useState<RestaurantTable | null>(null);
  const [transferTargetTableId, setTransferTargetTableId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  const sections = ['all', ...Array.from(new Set(tables.map((t) => t.section || 'General')))];

  const filteredTables =
    selectedSection === 'all'
      ? tables
      : tables.filter((t) => (t.section || 'General') === selectedSection);

  // Status Counts
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied' || t.status === 'in_prep').length;
  const billedCount = tables.filter((t) => t.status === 'payment_pending').length;

  const handleTableClick = (table: RestaurantTable) => {
    // If we're in transfer mode
    if (transferSourceTable) {
      if (table.id === transferSourceTable.id) {
        setTransferSourceTable(null);
        return;
      }
      executeTableTransfer(transferSourceTable, table);
      return;
    }

    const activeOrder = orders.find(
      (o) => o.id === table.currentOrderId && o.paymentStatus !== 'paid'
    );

    if (activeOrder) {
      // Load active running order into cashier POS
      onLoadActiveTableOrder(activeOrder);
      onClose();
    } else {
      // Start new bill on this table
      onSelectTableForNewBill(table.name);
      onClose();
    }
  };

  const executeTableTransfer = (source: RestaurantTable, target: RestaurantTable) => {
    const activeOrder = orders.find(
      (o) => o.id === source.currentOrderId && o.paymentStatus !== 'paid'
    );

    if (!activeOrder) {
      setTransferSourceTable(null);
      return;
    }

    // Move order to target table
    updateTable(target.id, {
      status: source.status,
      currentOrderId: activeOrder.id,
    });
    updateTable(source.id, {
      status: 'available',
      currentOrderId: undefined,
    });

    setTransferSuccessMessage(`Transferred ${source.name} order to ${target.name}!`);
    setTransferSourceTable(null);
    setTimeout(() => {
      setTransferSuccessMessage('');
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Dine-In Table Floor Plan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  [F1]
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Petpooja & RoyalPOS dynamic dining occupancy & table transfer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Legend Pills */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Vacant ({availableCount})</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span>Occupied ({occupiedCount})</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Billed ({billedCount})</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transfer Alert Banner */}
        {transferSourceTable && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              <span>
                Select destination table to transfer <strong>{transferSourceTable.name}</strong>'s bill:
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTransferSourceTable(null)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 text-white text-[10px] font-bold"
            >
              Cancel Transfer
            </button>
          </div>
        )}

        {transferSuccessMessage && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{transferSuccessMessage}</span>
          </div>
        )}

        {/* Section Tabs */}
        <div className="p-3 sm:px-5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {sections.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black capitalize transition-all shrink-0 ${
                selectedSection === sec
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sec === 'all' ? 'All Sections' : sec}
            </button>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredTables.map((table) => {
              const activeOrder = orders.find(
                (o) => o.id === table.currentOrderId && o.paymentStatus !== 'paid'
              );

              const isOccupied = table.status === 'occupied' || table.status === 'in_prep' || !!activeOrder;
              const isBilled = table.status === 'payment_pending' || (activeOrder && activeOrder.status === 'bill_generated');
              const isVacant = !isOccupied && !isBilled;

              // Compute order duration
              let orderDurationMins = 0;
              if (activeOrder) {
                const diffMs = Date.now() - new Date(activeOrder.createdAt).getTime();
                orderDurationMins = Math.max(1, Math.floor(diffMs / 60000));
              }

              return (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group hover:-translate-y-0.5 shadow-md ${
                    transferSourceTable?.id === table.id
                      ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400'
                      : isBilled
                      ? 'border-amber-500/70 bg-amber-950/20 hover:bg-amber-950/40 text-amber-200'
                      : isOccupied
                      ? 'border-sky-500/70 bg-sky-950/20 hover:bg-sky-950/40 text-sky-200'
                      : 'border-slate-800 bg-slate-950/80 hover:border-emerald-500/70 hover:bg-emerald-950/20 text-slate-200'
                  }`}
                >
                  {/* Top table info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                        <span>{table.name}</span>
                        {activeOrder && (
                          <span className="text-[9px] font-mono px-1 rounded bg-sky-500/30 text-sky-300 font-bold">
                            #{activeOrder.orderNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{table.capacity || 4} Pax • {table.section || 'Hall'}</span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isBilled
                          ? 'bg-amber-500 text-slate-950'
                          : isOccupied
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isBilled ? 'Billed' : isOccupied ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>

                  {/* Middle: Active Running Bill Details */}
                  {activeOrder ? (
                    <div className="my-3 py-2 px-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 text-[10px]">Running Bill:</span>
                        <span className="font-black text-white">
                          {formatCurrency(activeOrder.grandTotal, settings.currencySymbol)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{activeOrder.items?.length || 0} items</span>
                        <span className="flex items-center gap-1 text-amber-300 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{orderDurationMins}m ago</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="my-3 py-3 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800/70 text-[11px] text-slate-500 font-medium">
                      Tap to open bill
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                    {activeOrder ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTransferSourceTable(table);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Transfer</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearTableStatus(table.id);
                          }}
                          className="text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Vacate
                        </button>
                      </>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Ready for Guests</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Click any vacant table to start a new order, or an occupied table to add items.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
