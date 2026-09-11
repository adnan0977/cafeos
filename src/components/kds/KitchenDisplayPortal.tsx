import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Bell,
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Eye,
  Filter,
  Flame,
  Printer,
  Sparkles,
  Timer,
  TrendingUp,
  Utensils,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus } from '../../types';
import { formatTime } from '../../utils/formatters';

export const KitchenDisplayPortal: React.FC = () => {
  const { orders, menuItems, updateOrderStatus, updateOrderItemKitchenStatus, setKOTModalOrder } = useRestaurant();
  const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'completed'>('active');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);
  const [sortByUrgency, setSortByUrgency] = useState<boolean>(true);
  const [highContrastMode, setHighContrastMode] = useState<boolean>(false);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update live clock every second for exact elapsed timers and animations
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate target prep time for an order
  const getOrderTargetPrepMinutes = (order: Order): number => {
    if (order.estimatedPrepTimeMinutes && order.estimatedPrepTimeMinutes > 0) {
      return order.estimatedPrepTimeMinutes;
    }

    // Lookup max prep time among the items in the order
    let maxItemPrep = 0;
    (order.items || []).forEach((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      if (menuItem?.prepTimeMinutes) {
        maxItemPrep = Math.max(maxItemPrep, menuItem.prepTimeMinutes);
      }
    });

    // Default fallback to 12 minutes if unspecified
    return maxItemPrep > 0 ? maxItemPrep : 12;
  };

  // Helper to calculate prep time metrics (elapsed, remaining, overdue, progress)
  const getPrepMetrics = (order: Order) => {
    const orderTime = new Date(order.createdAt).getTime();
    const diffMs = Math.max(0, currentTime.getTime() - orderTime);
    const elapsedSeconds = Math.floor(diffMs / 1000);
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecsRem = elapsedSeconds % 60;

    const targetMinutes = getOrderTargetPrepMinutes(order);
    const targetSeconds = targetMinutes * 60;

    const isExceeded = elapsedSeconds > targetSeconds;
    const overdueSeconds = Math.max(0, elapsedSeconds - targetSeconds);
    const overdueMins = Math.floor(overdueSeconds / 60);
    const overdueSecsRem = overdueSeconds % 60;

    // Progress percentage
    const progressPercent = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
    const isWarning = !isExceeded && progressPercent >= 75;

    return {
      elapsedMins,
      elapsedSecsRem,
      targetMinutes,
      targetSeconds,
      isExceeded,
      isWarning,
      overdueMins,
      overdueSecsRem,
      progressPercent,
    };
  };

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    const filtered = orders.filter((o) => {
      if (o.status === 'cancelled') return false;
      if (filterType !== 'all' && o.orderType !== filterType) return false;

      if (activeTab === 'active') {
        const isPrepStatus = ['new', 'confirmed', 'kot_generated', 'kitchen_accepted', 'preparing'].includes(o.status);
        if (!isPrepStatus) return false;

        if (filterOverdueOnly) {
          const metrics = getPrepMetrics(o);
          return metrics.isExceeded;
        }
        return true;
      } else if (activeTab === 'ready') {
        return o.status === 'ready';
      } else {
        return ['paid', 'completed'].includes(o.status);
      }
    });

    // Sort by urgency (overdue tickets first, then closest to deadline)
    if (sortByUrgency && activeTab === 'active') {
      return [...filtered].sort((a, b) => {
        const metricsA = getPrepMetrics(a);
        const metricsB = getPrepMetrics(b);

        if (metricsA.isExceeded && !metricsB.isExceeded) return -1;
        if (!metricsA.isExceeded && metricsB.isExceeded) return 1;

        if (metricsA.isExceeded && metricsB.isExceeded) {
          // Most overdue first
          return (metricsB.overdueMins * 60 + metricsB.overdueSecsRem) - (metricsA.overdueMins * 60 + metricsA.overdueSecsRem);
        }

        // Oldest order first
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }

    return filtered;
  }, [orders, filterType, activeTab, filterOverdueOnly, sortByUrgency, currentTime, menuItems]);

  // Overall overdue count for active orders
  const overdueActiveOrdersCount = useMemo(() => {
    return orders.filter((o) => {
      if (!['new', 'confirmed', 'kot_generated', 'kitchen_accepted', 'preparing'].includes(o.status)) return false;
      const metrics = getPrepMetrics(o);
      return metrics.isExceeded;
    }).length;
  }, [orders, currentTime, menuItems]);

  return (
    <div
      className={`h-[calc(100vh-4rem)] flex flex-col overflow-hidden transition-colors ${
        highContrastMode ? 'bg-black text-white' : 'bg-slate-900 text-white'
      }`}
    >
      {/* Top KDS Control Bar */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          highContrastMode
            ? 'bg-zinc-950 border-zinc-700'
            : 'bg-slate-950 border-slate-800'
        }`}
      >
        {/* Left Branding & Live Stats */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl border ${
              overdueActiveOrdersCount > 0
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                  highContrastMode
                    ? 'bg-zinc-800 text-amber-300 border-zinc-600'
                    : 'bg-slate-800 text-amber-400 border-slate-700'
                }`}
              >
                Live Rush Engine
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                Active tickets: <strong className="text-white">{orders.filter((o) => ['kot_generated', 'kitchen_accepted', 'preparing'].includes(o.status)).length}</strong>
              </span>
              {overdueActiveOrdersCount > 0 && (
                <span className="inline-flex items-center gap-1 font-bold text-red-400 kds-flash-overdue bg-red-950/80 px-2 py-0.5 rounded border border-red-600/60 text-[11px]">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  {overdueActiveOrdersCount} Overdue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Overdue Only Filter Toggle */}
          {activeTab === 'active' && (
            <button
              onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                filterOverdueOnly
                  ? 'bg-red-600 text-white border-red-400 ring-2 ring-red-400/50 shadow-lg shadow-red-600/40'
                  : overdueActiveOrdersCount > 0
                  ? 'bg-red-950/70 hover:bg-red-900 text-red-300 border-red-700/60'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Filter only orders that exceeded estimated prep time"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${overdueActiveOrdersCount > 0 ? 'text-red-400 animate-pulse' : ''}`} />
              <span>Overdue ({overdueActiveOrdersCount})</span>
            </button>
          )}

          {/* Sort Urgency Toggle */}
          {activeTab === 'active' && (
            <button
              onClick={() => setSortByUrgency(!sortByUrgency)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                sortByUrgency
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
              title="Toggle sorting by urgency (overdue orders first)"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Urgent First</span>
            </button>
          )}

          {/* High Contrast Mode Toggle */}
          <button
            onClick={() => setHighContrastMode(!highContrastMode)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              highContrastMode
                ? 'bg-yellow-400 text-black border-yellow-300 font-black shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Toggle High-Contrast Kitchen Mode for bright screens"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{highContrastMode ? 'High-Contrast: ON' : 'High-Contrast'}</span>
          </button>

          {/* Status Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('active');
                setFilterOverdueOnly(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In Prep (
              {orders.filter((o) => ['new', 'confirmed', 'kot_generated', 'kitchen_accepted', 'preparing'].includes(o.status)).length}
              )
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ready'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ready ({orders.filter((o) => o.status === 'ready').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'completed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              History
            </button>
          </div>

          {/* Order Type Filter */}
          <div className="hidden lg:flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'dine_in', 'takeaway', 'delivery'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[11px] transition-colors ${
                  filterType === type ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main KDS Grid Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredAndSortedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-20">
            <ChefHat className="w-16 h-16 mb-4 text-slate-700 stroke-[1.2]" />
            <p className="text-base font-bold text-slate-400">
              {filterOverdueOnly
                ? 'Great job! No overdue orders in the kitchen.'
                : 'All caught up! No active tickets in this view.'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {filterOverdueOnly
                ? 'All incoming tickets are within their estimated prep thresholds.'
                : 'New incoming orders from POS will appear here instantly.'}
            </p>
            {filterOverdueOnly && (
              <button
                onClick={() => setFilterOverdueOnly(false)}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700"
              >
                View All Active Orders
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedOrders.map((order) => {
              const metrics = getPrepMetrics(order);
              const isOverdue = metrics.isExceeded;
              const isWarning = metrics.isWarning;

              // High-contrast and animation styling definitions
              let cardBorderClass = 'border-slate-800 hover:border-slate-700';
              let timerBadgeClass = 'bg-emerald-600 text-white border-emerald-400/50';
              let cardBgClass = highContrastMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-950 border-slate-800';

              if (isOverdue) {
                // High-contrast, glowing, pulsating blinking animation for overdue tickets
                cardBorderClass = 'kds-card-overdue border-2 border-red-500 ring-2 ring-red-500/60 shadow-2xl shadow-red-950';
                timerBadgeClass = 'bg-red-600 text-white kds-flash-overdue border-2 border-red-300 font-black shadow-lg shadow-red-600/50';
                cardBgClass = highContrastMode ? 'bg-black' : 'bg-slate-950';
              } else if (isWarning) {
                // Approaching deadline warning
                cardBorderClass = 'border-2 border-amber-500 ring-1 ring-amber-500/40 shadow-lg shadow-amber-950/40';
                timerBadgeClass = 'bg-amber-500 text-black border-amber-300 font-extrabold';
              }

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden transition-all duration-200 ${cardBgClass} ${cardBorderClass}`}
                >
                  {/* Top Overdue Blinking Hazard Banner (Shown only when prep time is exceeded) */}
                  {isOverdue && (
                    <div className="kds-banner-overdue px-3.5 py-1.5 flex items-center justify-between text-xs font-black tracking-wide select-none">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                        <span className="uppercase tracking-wider">
                          EXCEEDED PREP TIME (+{metrics.overdueMins}m {metrics.overdueSecsRem}s)
                        </span>
                      </div>
                      <span className="bg-black/40 text-yellow-200 px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider">
                        EXPEDITE
                      </span>
                    </div>
                  )}

                  {/* Warning banner when approaching target time (>= 75%) */}
                  {isWarning && !isOverdue && (
                    <div className="bg-amber-500 text-slate-950 px-3.5 py-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wide">
                      <div className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 shrink-0" />
                        <span>Prep Time Approaching Limit</span>
                      </div>
                      <span className="font-mono text-[10px] font-black">
                        {metrics.targetMinutes - metrics.elapsedMins}m left
                      </span>
                    </div>
                  )}

                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 border-b flex items-start justify-between ${
                      highContrastMode
                        ? isOverdue
                          ? 'bg-zinc-900 border-red-900/60'
                          : 'bg-zinc-900 border-zinc-800'
                        : isOverdue
                        ? 'bg-slate-900/90 border-red-900/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-lg ${
                            isOverdue
                              ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]'
                              : 'text-white'
                          }`}
                        >
                          KOT #{order.kotNumber || order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                            order.orderType === 'delivery'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : order.orderType === 'takeaway'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {order.orderType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                        <span>{order.tableName || order.customerName || 'Guest'}</span>
                        {order.guestCount ? (
                          <span className="text-slate-400 font-normal">
                            • {order.guestCount} Guests
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>Ordered: {formatTime(order.createdAt)}</span>
                        <span>•</span>
                        <span>Server: {order.waiterName || order.cashierName || 'POS'}</span>
                      </div>
                    </div>

                    {/* Timer Badge & Target Info */}
                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black flex items-center gap-1 shadow-md border ${timerBadgeClass}`}
                      >
                        <Timer className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {String(metrics.elapsedMins).padStart(2, '0')}:
                          {String(metrics.elapsedSecsRem).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                        <span>Target:</span>
                        <span className={isOverdue ? 'text-red-400 font-extrabold' : 'text-slate-300'}>
                          {metrics.targetMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High-Contrast Progress Bar */}
                  <div className="w-full bg-slate-950 h-1.5 relative overflow-hidden border-b border-slate-900">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOverdue
                          ? 'bg-red-500 w-full animate-pulse'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: isOverdue ? '100%' : `${metrics.progressPercent}%`,
                      }}
                    />
                  </div>

                  {/* Order Items List */}
                  <div
                    className={`p-3.5 flex-1 divide-y overflow-y-auto max-h-64 space-y-2.5 ${
                      highContrastMode ? 'divide-zinc-800' : 'divide-slate-800/80'
                    }`}
                  >
                    {(order.items || []).map((item) => {
                      const itemMenuItem = menuItems.find((m) => m.id === item.menuItemId);
                      const itemPrepTime = itemMenuItem?.prepTimeMinutes;
                      const itemKitchenStatus = item.kitchenStatus || (order.status === 'ready' ? 'ready' : order.status === 'preparing' ? 'preparing' : 'pending');

                      return (
                        <div
                          key={item.id}
                          className={`pt-2.5 first:pt-0 p-1.5 rounded-xl transition-all ${
                            itemKitchenStatus === 'ready' || itemKitchenStatus === 'served'
                              ? 'bg-teal-950/30 border border-teal-800/40'
                              : itemKitchenStatus === 'preparing'
                              ? 'bg-amber-950/20 border border-amber-800/30'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`font-black text-sm ${
                                    itemKitchenStatus === 'ready' || itemKitchenStatus === 'served'
                                      ? 'text-teal-300 line-through opacity-80'
                                      : isOverdue
                                      ? 'text-white'
                                      : 'text-slate-100'
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {itemPrepTime && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-400 border border-slate-700">
                                    ~{itemPrepTime}m
                                  </span>
                                )}
                              </div>

                              {item.variantName && (
                                <div className="text-xs font-extrabold text-amber-400 mt-0.5">
                                  [{item.variantName}]
                                </div>
                              )}

                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-[11px] font-semibold text-slate-300 mt-0.5">
                                  {item.modifiers.map((m) => `+ ${m.name}`).join(', ')}
                                </div>
                              )}

                              {item.notes && (
                                <div className="mt-1 bg-amber-950/70 border border-amber-700/70 text-amber-200 px-2 py-0.5 text-[11px] font-black rounded-md flex items-center gap-1">
                                  <span>NOTE:</span>
                                  <span>{item.notes}</span>
                                </div>
                              )}

                              {/* Item-level status interactive button */}
                              <div className="mt-1.5 flex items-center gap-1">
                                {itemKitchenStatus === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => updateOrderItemKitchenStatus(order.id, item.id, 'preparing')}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 flex items-center gap-1"
                                  >
                                    <Flame className="w-2.5 h-2.5 text-amber-400" />
                                    <span>Prep Item</span>
                                  </button>
                                )}
                                {itemKitchenStatus === 'preparing' && (
                                  <button
                                    type="button"
                                    onClick={() => updateOrderItemKitchenStatus(order.id, item.id, 'ready')}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30 flex items-center gap-1"
                                  >
                                    <Check className="w-2.5 h-2.5 text-teal-400" />
                                    <span>Mark Done</span>
                                  </button>
                                )}
                                {(itemKitchenStatus === 'ready' || itemKitchenStatus === 'served') && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-900/60 text-teal-200 border border-teal-700/60 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-teal-400" />
                                    <span>Ready</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Badge */}
                            <div
                              className={`w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center shrink-0 shadow-md ${
                                itemKitchenStatus === 'ready' || itemKitchenStatus === 'served'
                                  ? 'bg-teal-600 text-white border border-teal-400'
                                  : isOverdue
                                  ? 'bg-red-500 text-white border-2 border-red-300 ring-2 ring-red-500/50'
                                  : highContrastMode
                                  ? 'bg-yellow-400 text-black border-2 border-yellow-200'
                                  : 'bg-amber-500 text-slate-950 border border-amber-400'
                              }`}
                            >
                              {item.quantity}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {order.notes && (
                      <div className="pt-2 text-xs bg-slate-900/90 p-2 rounded-lg border border-amber-600/40 text-amber-300 font-bold">
                        Ticket Note: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Footer Buttons */}
                  <div
                    className={`p-3 border-t flex items-center justify-between gap-2 ${
                      highContrastMode
                        ? 'bg-zinc-900 border-zinc-800'
                        : isOverdue
                        ? 'bg-slate-900/95 border-red-900/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => setKOTModalOrder(order)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                      title="Print KOT Ticket"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {order.status === 'kot_generated' || order.status === 'new' || order.status === 'confirmed' ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className={`flex-1 py-2 px-3 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border ${
                          isOverdue
                            ? 'bg-red-600 hover:bg-red-700 border-red-400 ring-2 ring-red-400/40'
                            : 'bg-amber-600 hover:bg-amber-700 border-amber-500'
                        }`}
                      >
                        <Flame className="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    ) : order.status === 'kitchen_accepted' || order.status === 'preparing' ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className={`flex-1 py-2 px-3 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border ${
                          isOverdue
                            ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-300 ring-2 ring-emerald-400/50 shadow-emerald-600/40'
                            : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-emerald-600/30'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Mark As Ready</span>
                      </button>
                    ) : order.status === 'ready' ? (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border border-blue-500"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Bump / Completed</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-black">COMPLETED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

