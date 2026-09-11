import {
  AlertCircle,
  Award,
  Banknote,
  BellRing,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Download,
  Filter,
  Flame,
  Gift,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  UserCheck,
  UserPlus,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderType } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDateTime, getOrderStatusBadge } from '../../utils/formatters';
import { getCustomerTierInfo } from '../../utils/loyaltyUtils';
import { PaymentModal } from '../pos/PaymentModal';
import { CustomerLoyaltyDirectory } from './CustomerLoyaltyDirectory';
import { OrderLoyaltyModal } from './OrderLoyaltyModal';
import { RefundModal } from './RefundModal';
import { LiveKitchenTrackerModal } from './LiveKitchenTrackerModal';
import { KitchenReadyToast, ReadyToastItem } from '../common/KitchenReadyToast';
import { playKitchenReadyChime } from '../../utils/soundUtils';

export const BillerPortal: React.FC = () => {
  const { orders, customers, setReceiptModalOrder, setKOTModalOrder, updateOrderStatus, settings } = useRestaurant();
  const { hasPermission } = useAuth();

  const [activeMainTab, setActiveMainTab] = useState<'billing' | 'loyalty'>('billing');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_kitchen' | 'ready' | 'served' | 'completed'>('pending');
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeRefundOrder, setActiveRefundOrder] = useState<Order | null>(null);
  const [activeLoyaltyOrder, setActiveLoyaltyOrder] = useState<Order | null>(null);
  const [activeKitchenTrackerOrder, setActiveKitchenTrackerOrder] = useState<Order | null>(null);

  // Real-time Kitchen Ready Toast state for Billing Counter
  const [readyToasts, setReadyToasts] = useState<ReadyToastItem[]>([]);
  const prevOrderStatusesRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    const prevMap = prevOrderStatusesRef.current;
    const newMap: Record<string, string> = {};

    orders.forEach((ord) => {
      newMap[ord.id] = ord.status;
      const prevStatus = prevMap[ord.id];

      // Detect status change to 'ready'
      if (prevStatus && prevStatus !== 'ready' && ord.status === 'ready') {
        playKitchenReadyChime();
        setReadyToasts((prev) => [
          {
            id: `biller-toast-${ord.id}-${Date.now()}`,
            order: ord,
            timestamp: Date.now(),
            message: `${ord.tableName || (ord.orderType === 'takeaway' ? 'Takeaway' : 'Delivery')} (Order #${ord.orderNumber}) is cooked & ready for billing/settlement!`,
          },
          ...prev.filter((t) => t.order.id !== ord.id),
        ]);
      }
    });

    prevOrderStatusesRef.current = newMap;
  }, [orders]);

  // Helper to check kitchen state
  const isKitchenActive = (status: Order['status']) =>
    ['kot_generated', 'new', 'in_prep', 'preparing', 'kitchen_accepted', 'confirmed'].includes(status);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (selectedOrderType !== 'all' && o.orderType !== selectedOrderType) return false;
    
    if (statusFilter === 'pending' && (o.paymentStatus === 'paid' || o.status === 'cancelled')) return false;
    if (statusFilter === 'in_kitchen' && !isKitchenActive(o.status)) return false;
    if (statusFilter === 'ready' && o.status !== 'ready') return false;
    if (statusFilter === 'served' && o.status !== 'served') return false;
    if (statusFilter === 'completed' && o.paymentStatus !== 'paid') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        String(o.orderNumber).includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.customerPhone?.includes(q) ||
        o.tableName?.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate live billing & kitchen metrics for today
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today) && o.paymentStatus === 'paid');
  const totalBilledToday = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  let cashCollected = 0;
  let digitalCollected = 0;
  todayOrders.forEach((o) => {
    (o.payments || []).forEach((p) => {
      if (p.method === 'cash') cashCollected += p.amount;
      else digitalCollected += p.amount;
    });
  });

  const pendingBillsCount = orders.filter((o) => o.paymentStatus === 'pending' && o.status !== 'cancelled').length;
  const inKitchenCount = orders.filter((o) => isKitchenActive(o.status) && o.paymentStatus !== 'paid').length;
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const readyCount = readyOrders.length;
  const servedCount = orders.filter((o) => o.status === 'served' && o.paymentStatus !== 'paid').length;

  const handleExportBills = () => {
    const rows = filteredOrders.map((o) => ({
      OrderNumber: o.orderNumber,
      Type: o.orderType,
      TableOrCustomer: o.tableName || o.customerName,
      ItemsCount: (o.items || []).length,
      KitchenStatus: o.status,
      Subtotal: o.subtotal,
      Tax: o.taxAmount,
      Discount: o.discountAmount,
      GrandTotal: o.grandTotal,
      PaymentStatus: o.paymentStatus,
      PaymentMethod: o.paymentMethod || 'N/A',
      Date: formatDateTime(o.createdAt),
    }));
    exportToCSV('Billing_Kitchen_Report', rows);
  };

  const getKitchenStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Food Ready!',
          bg: 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200 border-teal-400',
          dot: 'bg-teal-500 animate-ping',
          icon: <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />,
        };
      case 'in_prep':
      case 'preparing':
      case 'kitchen_accepted':
      case 'kot_generated':
      case 'new':
      case 'confirmed':
        return {
          label: 'Cooking / In Prep',
          bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border-amber-400',
          dot: 'bg-amber-500 animate-pulse',
          icon: <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
        };
      case 'served':
        return {
          label: 'Food Served',
          bg: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 border-blue-400',
          dot: 'bg-blue-500',
          icon: <UtensilsCrossed className="w-3 h-3 text-blue-600 dark:text-blue-400" />,
        };
      case 'bill_generated':
        return {
          label: 'Bill Presented',
          bg: 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border-purple-400',
          dot: 'bg-purple-500',
          icon: <Receipt className="w-3 h-3 text-purple-600 dark:text-purple-400" />,
        };
      case 'completed':
        return {
          label: 'Order Fulfilled',
          bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
          dot: 'bg-slate-400',
          icon: <CheckCircle2 className="w-3 h-3 text-slate-500" />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border-rose-400',
          dot: 'bg-rose-500',
          icon: <AlertCircle className="w-3 h-3 text-rose-500" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-400',
          icon: <Clock className="w-3 h-3 text-slate-500" />,
        };
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Top Biller Header & Tab Switcher */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600 rounded-xl text-white shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Biller Portal & Cash Counter</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                Live Kitchen Sync Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time Kitchen Order Tracking, Table Billing & Loyalty Redemption
            </p>
          </div>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveMainTab('billing')}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeMainTab === 'billing'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Active Billing & Kitchen ({pendingBillsCount})</span>
          </button>
          <button
            onClick={() => setActiveMainTab('loyalty')}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeMainTab === 'loyalty'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Loyalty Directory ({customers.length})</span>
          </button>
        </div>
      </div>

      {/* READY FOOD BANNER NOTIFICATION */}
      {readyCount > 0 && activeMainTab === 'billing' && (
        <div className="bg-teal-600 text-white px-4 py-2.5 flex items-center justify-between shadow-md animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold">
            <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>
              KITCHEN ALERT: {readyCount} order{readyCount > 1 ? 's are' : ' is'} READY for Table Service / Handover!
            </span>
            <span className="opacity-90 font-normal hidden sm:inline">
              (Order: {readyOrders.map((o) => `#${o.orderNumber} ${o.tableName ? `[${o.tableName}]` : ''}`).join(', ')})
            </span>
          </div>
          <button
            onClick={() => setStatusFilter('ready')}
            className="px-3 py-1 bg-white text-teal-900 font-extrabold text-[11px] rounded-lg shadow-xs hover:bg-teal-50 transition-colors"
          >
            View Ready Orders
          </button>
        </div>
      )}

      {activeMainTab === 'loyalty' ? (
        <div className="flex-1 p-4 overflow-y-auto">
          <CustomerLoyaltyDirectory
            onSelectOrderForCustomer={(cust) => {
              setActiveMainTab('billing');
            }}
          />
        </div>
      ) : (
        <>
          {/* Top Biller & Kitchen KPI Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Revenue */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Today's Billed
                </div>
                <div className="text-lg font-extrabold text-amber-950 dark:text-amber-100 mt-0.5">
                  {formatCurrency(totalBilledToday, settings.currencySymbol)}
                </div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400">
                  {todayOrders.length} Paid Bills
                </div>
              </div>

              {/* Cash In Till */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50">
                <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Cash in Till
                </div>
                <div className="text-lg font-extrabold text-emerald-950 dark:text-emerald-100 mt-0.5">
                  {formatCurrency(cashCollected, settings.currencySymbol)}
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                  Physical Cash
                </div>
              </div>

              {/* UPI & Digital */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase">
                  UPI & Cards
                </div>
                <div className="text-lg font-extrabold text-blue-950 dark:text-blue-100 mt-0.5">
                  {formatCurrency(digitalCollected, settings.currencySymbol)}
                </div>
                <div className="text-[10px] text-blue-700/80 dark:text-blue-400">
                  Bank Digital
                </div>
              </div>

              {/* In Kitchen Prep */}
              <div
                onClick={() => setStatusFilter('in_kitchen')}
                className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-900/50 cursor-pointer hover:shadow-xs transition-shadow"
              >
                <div className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase flex items-center justify-between">
                  <span>In Kitchen</span>
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="text-lg font-extrabold text-orange-950 dark:text-orange-100 mt-0.5">
                  {inKitchenCount} Orders
                </div>
                <div className="text-[10px] text-orange-700/80 dark:text-orange-400">
                  Cooking / In Prep
                </div>
              </div>

              {/* Ready Orders */}
              <div
                onClick={() => setStatusFilter('ready')}
                className={`p-3 rounded-2xl border cursor-pointer hover:shadow-xs transition-shadow ${
                  readyCount > 0
                    ? 'bg-teal-100 dark:bg-teal-950/50 border-teal-400 text-teal-950 dark:text-teal-100 shadow-sm ring-1 ring-teal-400'
                    : 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50 text-teal-900 dark:text-teal-300'
                }`}
              >
                <div className="text-[10px] font-bold uppercase flex items-center justify-between">
                  <span>Food Ready</span>
                  <ChefHat className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <div className="text-lg font-extrabold mt-0.5">
                  {readyCount} Orders
                </div>
                <div className="text-[10px] opacity-80">
                  Ready to Serve / Hand
                </div>
              </div>

              {/* Pending Bills */}
              <div
                onClick={() => setStatusFilter('pending')}
                className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50 cursor-pointer hover:shadow-xs transition-shadow"
              >
                <div className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase flex items-center justify-between">
                  <span>Unpaid Tabs</span>
                  <Receipt className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-lg font-extrabold text-purple-950 dark:text-purple-100 mt-0.5">
                  {pendingBillsCount} Orders
                </div>
                <div className="text-[10px] text-purple-700/80 dark:text-purple-400">
                  Awaiting Settlement
                </div>
              </div>
            </div>
          </div>

          {/* Control Bar: Search + Filters + CSV Export */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by order #, table, customer name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Comprehensive Filter Tabs */}
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Pending Bills ({pendingBillsCount})
                </button>
                <button
                  onClick={() => setStatusFilter('in_kitchen')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    statusFilter === 'in_kitchen'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span>Cooking ({inKitchenCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('ready')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    statusFilter === 'ready'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  <span>Ready ({readyCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('served')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    statusFilter === 'served'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <UtensilsCrossed className="w-3 h-3 text-blue-400" />
                  <span>Served ({servedCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Paid Invoices
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All ({orders.length})
                </button>
              </div>

              {/* Order Type Dropdown */}
              <select
                value={selectedOrderType}
                onChange={(e) => setSelectedOrderType(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="all">All Order Types</option>
                <option value="dine_in">Dine-In</option>
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
                <option value="online">Online</option>
              </select>

              {/* Export CSV */}
              <button
                onClick={handleExportBills}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Table Container */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Order / Invoice</th>
                      <th className="py-3 px-4">Type & Table</th>
                      <th className="py-3 px-4">Customer & Loyalty</th>
                      <th className="py-3 px-4">Items Summary</th>
                      <th className="py-3 px-4">Kitchen Status</th>
                      <th className="py-3 px-4">Subtotal / Tax</th>
                      <th className="py-3 px-4">Grand Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                          No orders matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const statusBadge = getOrderStatusBadge(order.status);
                        const kitchenBadge = getKitchenStatusBadge(order.status);
                        const isPaid = order.paymentStatus === 'paid';

                        // Lookup customer record if present
                        const matchedCustomer = customers.find(
                          (c) =>
                            (order.customerId && c.id === order.customerId) ||
                            (order.customerPhone && c.phone === order.customerPhone)
                        );
                        const custTier = matchedCustomer
                          ? getCustomerTierInfo(matchedCustomer.loyaltyPoints)
                          : null;

                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              order.status === 'ready'
                                ? 'bg-teal-50/50 dark:bg-teal-950/20'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>#{order.orderNumber}</span>
                                {order.status === 'ready' && (
                                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal font-mono">
                                {formatDateTime(order.createdAt)}
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px]">
                                {order.orderType.replace('_', ' ')}
                              </span>
                              {order.tableName && (
                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                                  <UtensilsCrossed className="w-3 h-3" />
                                  <span>{order.tableName}</span>
                                </div>
                              )}
                            </td>

                            {/* Customer & Loyalty Tracking Column */}
                            <td className="py-3 px-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{order.customerName || 'Walk-in Guest'}</span>
                                    {custTier && (
                                      <span
                                        className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase border ${custTier.borderColor} ${custTier.badgeBg} ${custTier.badgeText}`}
                                      >
                                        {custTier.label}
                                      </span>
                                    )}
                                  </div>

                                  {order.customerPhone ? (
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                      {order.customerPhone}
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400 italic">No phone linked</div>
                                  )}

                                  {matchedCustomer && (
                                    <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                      ⭐ {matchedCustomer.loyaltyPoints} pts available
                                    </div>
                                  )}
                                </div>

                                {/* Loyalty & Coupon Action Button */}
                                <button
                                  type="button"
                                  onClick={() => setActiveLoyaltyOrder(order)}
                                  className={`p-1.5 rounded-xl border flex items-center gap-1 text-[11px] font-bold transition-all ${
                                    order.discountAmount > 0 || order.couponCode
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20'
                                      : matchedCustomer
                                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                                  }`}
                                  title="Customer Loyalty Profile & Coupons"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>
                                    {order.couponCode
                                      ? order.couponCode
                                      : matchedCustomer
                                      ? 'Redeem'
                                      : '+ Link'}
                                  </span>
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-4 max-w-[180px]">
                              <div className="text-slate-800 dark:text-slate-200 font-medium truncate">
                                {(order.items || []).map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                              </div>
                              <div className="text-[10px] text-slate-400">{(order.items || []).length} unique line items</div>
                            </td>

                            {/* DEDICATED REAL-TIME KITCHEN STATUS COLUMN */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={() => setActiveKitchenTrackerOrder(order)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all hover:scale-105 ${kitchenBadge.bg}`}
                                  title="Click to open Live Kitchen Tracker & Item Details"
                                >
                                  <span className={`w-2 h-2 rounded-full ${kitchenBadge.dot}`} />
                                  {kitchenBadge.icon}
                                  <span>{kitchenBadge.label}</span>
                                </button>

                                {/* Quick Kitchen status advance buttons for biller / runner coordination */}
                                {order.status === 'ready' && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => updateOrderStatus(order.id, 'served')}
                                      className="text-[10px] font-bold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Mark Food Served</span>
                                    </button>
                                  </div>
                                )}
                                {isKitchenActive(order.status) && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => updateOrderStatus(order.id, 'ready')}
                                      className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
                                    >
                                      <ChefHat className="w-3 h-3" />
                                      <span>Mark Ready in Kitchen</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              <div>Sub: {formatCurrency(order.subtotal, settings.currencySymbol)}</div>
                              <div className="text-[10px] text-slate-400">GST: {formatCurrency(order.taxAmount, settings.currencySymbol)}</div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {formatCurrency(order.grandTotal, settings.currencySymbol)}
                              </div>
                              {order.discountAmount > 0 && (
                                <div className="text-[10px] text-rose-500 font-semibold">
                                  Disc: -{formatCurrency(order.discountAmount, settings.currencySymbol)}
                                  {order.couponCode ? ` (${order.couponCode})` : ''}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {isPaid ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>PAID</span>
                                  </span>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                    Via {order.paymentMethod}
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>UNPAID</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Live Kitchen Tracker Button */}
                                <button
                                  type="button"
                                  onClick={() => setActiveKitchenTrackerOrder(order)}
                                  className="p-1.5 rounded-lg border border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                                  title="Live Kitchen Status & Prep Tracker"
                                >
                                  <ChefHat className="w-3.5 h-3.5" />
                                </button>

                                {/* Loyalty Modal Trigger Button */}
                                <button
                                  onClick={() => setActiveLoyaltyOrder(order)}
                                  className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                  title="Customer Loyalty & Earned Coupons"
                                >
                                  <Gift className="w-3.5 h-3.5" />
                                </button>

                                {/* Receipt Print */}
                                <button
                                  onClick={() => setReceiptModalOrder(order)}
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Print Thermal Receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                {/* Settle Bill Button */}
                                {!isPaid ? (
                                  <button
                                    onClick={() => setActivePaymentOrder(order)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>Settle</span>
                                  </button>
                                ) : (
                                  /* Refund Trigger for authorized users */
                                  hasPermission('process_refund') && (
                                    <button
                                      onClick={() => setActiveRefundOrder(order)}
                                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                      title="Process Authorized Refund"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )
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
            </div>
          </div>
        </>
      )}

      {/* Sub-modals */}
      {activeKitchenTrackerOrder && (
        <LiveKitchenTrackerModal
          order={activeKitchenTrackerOrder}
          onClose={() => setActiveKitchenTrackerOrder(null)}
          onOpenPayment={(o) => {
            setActiveKitchenTrackerOrder(null);
            setActivePaymentOrder(o);
          }}
        />
      )}

      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentComplete={() => setActivePaymentOrder(null)}
        />
      )}

      {activeRefundOrder && (
        <RefundModal
          order={activeRefundOrder}
          onClose={() => setActiveRefundOrder(null)}
        />
      )}

      {activeLoyaltyOrder && (
        <OrderLoyaltyModal
          order={activeLoyaltyOrder}
          onClose={() => setActiveLoyaltyOrder(null)}
        />
      )}

      {/* Floating Kitchen Ready Instant Feedback Toasts */}
      <KitchenReadyToast
        toasts={readyToasts}
        currencySymbol={settings.currencySymbol}
        onDismiss={(id) => setReadyToasts((prev) => prev.filter((t) => t.id !== id))}
        onSettleOrder={(order) => {
          setActivePaymentOrder(order);
        }}
        onMarkServed={(order) => {
          updateOrderStatus(order.id, 'served');
        }}
        onPrintReceipt={(order) => {
          setReceiptModalOrder(order);
        }}
        onPrintKOT={(order) => {
          setKOTModalOrder(order);
        }}
        onViewOrder={(order) => {
          setActiveKitchenTrackerOrder(order);
        }}
      />
    </div>
  );
};


