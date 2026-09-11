import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Flame,
  History as HistoryIcon,
  Package,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Send,
  ShoppingBag,
  Truck,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderType } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface OrdersManagerModalProps {
  isOpen?: boolean;
  initialTab?: 'in_prep' | 'ready' | 'history';
  onClose: () => void;
  onSelectOrderToPay?: (order: Order) => void;
  onSelectOrderForPayment?: (order: Order) => void;
  onAddItemsToOrder?: (order: Order) => void;
}

export const OrdersManagerModal: React.FC<OrdersManagerModalProps> = ({
  isOpen = true,
  initialTab = 'in_prep',
  onClose,
  onSelectOrderToPay,
  onSelectOrderForPayment,
  onAddItemsToOrder,
}) => {
  const handlePaymentSelect = onSelectOrderToPay || onSelectOrderForPayment;

  if (isOpen === false) return null;
  const {
    orders,
    tables,
    settings,
    updateOrderStatus,
    setReceiptModalOrder,
    setKOTModalOrder,
    cancelOrder,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'in_prep' | 'ready' | 'history'>(initialTab);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | OrderType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Group and count orders
  const inPrepOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        ['in_prep', 'kot_generated', 'new', 'confirmed', 'kitchen_accepted', 'preparing'].includes(o.status) &&
        o.status !== 'cancelled' &&
        o.paymentStatus !== 'paid'
    );
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        (o.status === 'ready' || o.status === 'bill_generated' || o.status === 'served') &&
        o.paymentStatus !== 'paid' &&
        o.status !== 'cancelled'
    );
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter(
      (o) => o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'cancelled'
    );
  }, [orders]);

  // Current tab orders
  const currentTabOrders = useMemo(() => {
    let list: Order[] = [];
    if (activeTab === 'in_prep') list = inPrepOrders;
    else if (activeTab === 'ready') list = readyOrders;
    else list = historyOrders;

    // Apply Order Type filter
    if (selectedTypeFilter !== 'all') {
      list = list.filter((o) => o.orderType === selectedTypeFilter);
    }

    // Apply Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.orderNumber).toLowerCase().includes(q) ||
          (o.tableName && o.tableName.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerPhone && o.customerPhone.includes(q)) ||
          (o.items || []).some((it) => it.name.toLowerCase().includes(q))
      );
    }

    // Sort by latest updated or created
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activeTab, inPrepOrders, readyOrders, historyOrders, selectedTypeFilter, searchQuery]);

  const getElapsedMinutes = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
  };

  const getOrderTypeBadge = (type: OrderType) => {
    switch (type) {
      case 'dine_in':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
            <UtensilsCrossed className="w-3 h-3" /> Dine-In
          </span>
        );
      case 'takeaway':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
            <ShoppingBag className="w-3 h-3" /> Takeaway
          </span>
        );
      case 'delivery':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            <Truck className="w-3 h-3" /> Delivery
          </span>
        );
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
            <Flame className="w-3 h-3" /> Online Order
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>Orders & Kitchen Queue</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-800 text-amber-400 rounded-full border border-slate-700">
                  {inPrepOrders.length + readyOrders.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage In-Preparation, Ready to Serve, and Completed Order History
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRIMARY STATUS TABS (In Prep, Ready, History) */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Main Status Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('in_prep')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'in_prep'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>In Prep ({inPrepOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ready')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'ready'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Ready ({readyOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, table, guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* SUB-FILTER PILLS: all, dine in, takeaway, delivery */}
        <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {(
              [
                { id: 'all', label: 'All Orders' },
                { id: 'dine_in', label: 'Dine In' },
                { id: 'takeaway', label: 'Takeaway' },
                { id: 'delivery', label: 'Delivery' },
                { id: 'online', label: 'Online' },
              ] as { id: 'all' | OrderType; label: string }[]
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedTypeFilter(filter.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedTypeFilter === filter.id
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-semibold shrink-0">
            Showing {currentTabOrders.length} orders
          </span>
        </div>

        {/* ORDERS CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-950/40">
          {currentTabOrders.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                {activeTab === 'in_prep' ? (
                  <Flame className="w-8 h-8 text-amber-500" />
                ) : activeTab === 'ready' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No {activeTab.replace('_', ' ')} orders found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {activeTab === 'in_prep'
                  ? 'All kitchen tickets are cleared or ready to be served.'
                  : activeTab === 'ready'
                  ? 'No orders are currently waiting to be served or picked up.'
                  : 'No past completed orders match your current filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentTabOrders.map((order) => {
                const isPaid = order.paymentStatus === 'paid';
                const isDineIn = order.orderType === 'dine_in';
                const table = tables.find((t) => t.id === order.tableId);

                return (
                  <div
                    key={order.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden ${
                      activeTab === 'in_prep'
                        ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                        : activeTab === 'ready'
                        ? 'border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900 dark:text-white">
                            #{order.orderNumber}
                          </span>
                          {getOrderTypeBadge(order.orderType)}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {getElapsedMinutes(order.createdAt)}
                          </span>
                          {order.kotNumber && (
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                              KOT #{order.kotNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900 dark:text-white">
                          {formatCurrency(order.grandTotal, settings.currencySymbol)}
                        </div>
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isPaid
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isPaid ? 'PAID' : 'PAYMENT PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Table / Customer Details */}
                    <div className="px-3.5 py-2 bg-amber-50/40 dark:bg-amber-950/20 border-b border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        {isDineIn ? (
                          <>
                            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                            <span>{order.tableName || table?.name || 'Table'}</span>
                            {order.guestCount && (
                              <span className="text-slate-400 font-normal">
                                ({order.guestCount} guests)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <span>{order.customerName || 'Walk-in Guest'}</span>
                            {order.customerPhone && (
                              <span className="text-slate-400 font-normal">
                                • {order.customerPhone}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {order.deliveryAddress && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {order.deliveryAddress}
                        </span>
                      )}
                    </div>

                    {/* Ordered Items Preview */}
                    <div className="p-3.5 flex-1 overflow-y-auto max-h-36 divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="py-1 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {it.quantity}x {it.name}
                            </span>
                            {it.variantName && (
                              <span className="text-[10px] text-slate-500 ml-1">
                                ({it.variantName})
                              </span>
                            )}
                            {it.modifiers && it.modifiers.length > 0 && (
                              <div className="text-[10px] text-slate-400">
                                {it.modifiers.map((m) => `+ ${m.name}`).join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="text-slate-600 dark:text-slate-400 font-medium shrink-0">
                            {formatCurrency(it.unitPrice * it.quantity, settings.currencySymbol)}
                          </span>
                        </div>
                      ))}

                      {order.notes && (
                        <div className="pt-1.5 text-[11px] italic text-amber-700 dark:text-amber-400">
                          Note: {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKOTModalOrder(order)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-xs font-bold"
                          title="Print KOT"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReceiptModalOrder(order)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-xs font-bold"
                          title="Print Bill / Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* Add items to running order */}
                        {!isPaid && onAddItemsToOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              onAddItemsToOrder(order);
                              onClose();
                            }}
                            className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-1"
                            title="Add items to this table"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Tab-specific primary actions */}
                        {activeTab === 'in_prep' && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {activeTab === 'ready' && (
                          <button
                            type="button"
                            onClick={() => updateOrderStatus(order.id, 'served')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Served</span>
                          </button>
                        )}

                        {/* Payment / Settle Button if not paid */}
                        {!isPaid && handlePaymentSelect && (
                          <button
                            type="button"
                            onClick={() => {
                              handlePaymentSelect(order);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs shadow-emerald-600/20 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Pay & Settle</span>
                          </button>
                        )}

                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => setReceiptModalOrder(order)}
                            className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs"
                          >
                            View Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              In Kitchen ({inPrepOrders.length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Ready to Serve ({readyOrders.length})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              History ({historyOrders.length})
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
