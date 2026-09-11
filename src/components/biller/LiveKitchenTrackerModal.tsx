import React, { useState, useEffect } from 'react';
import {
  X,
  ChefHat,
  Flame,
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  Timer,
  AlertTriangle,
  Printer,
  DollarSign,
  Receipt,
  User,
  Users,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatTime, formatDateTime } from '../../utils/formatters';

interface LiveKitchenTrackerModalProps {
  order: Order;
  onClose: () => void;
  onOpenPayment?: (order: Order) => void;
}

export const LiveKitchenTrackerModal: React.FC<LiveKitchenTrackerModalProps> = ({
  order,
  onClose,
  onOpenPayment,
}) => {
  const {
    updateOrderStatus,
    updateOrderItemKitchenStatus,
    setReceiptModalOrder,
    setKOTModalOrder,
    menuItems,
    settings,
  } = useRestaurant();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timer every second for accurate elapsed kitchen time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const orderCreatedAt = new Date(order.createdAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((currentTime.getTime() - orderCreatedAt) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedSecsRem = elapsedSeconds % 60;

  // Calculate target prep time
  let maxItemPrep = 0;
  (order.items || []).forEach((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    if (menuItem?.prepTimeMinutes) {
      maxItemPrep = Math.max(maxItemPrep, menuItem.prepTimeMinutes);
    }
  });
  const targetMinutes = order.estimatedPrepTimeMinutes || (maxItemPrep > 0 ? maxItemPrep : 15);
  const isOverdue = elapsedMinutes >= targetMinutes;

  // Lifecycle steps detection
  const isOrdered = true;
  const isCooking = ['preparing', 'in_prep', 'kitchen_accepted', 'ready', 'served', 'completed'].includes(order.status) || !!order.kitchenStartedAt;
  const isReady = ['ready', 'served', 'completed'].includes(order.status) || !!order.kitchenReadyAt;
  const isServed = ['served', 'completed'].includes(order.status) || !!order.kitchenServedAt;
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600 rounded-2xl text-white shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black tracking-tight">
                  Kitchen Live Tracker: KOT #{order.kotNumber || order.orderNumber}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {order.orderType.replace('_', ' ')}
                </span>
                {order.tableName && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {order.tableName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Order #{order.orderNumber} • Punched at {formatTime(order.createdAt)} • Server: {order.waiterName || order.cashierName || 'POS'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Real-time Cooking Timers & Overdue Meter */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isOverdue && !isServed
                ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/60'
                : isReady
                ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800/60'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl font-mono font-black text-sm flex items-center gap-1.5 shadow-sm ${
                  isOverdue && !isServed
                    ? 'bg-red-600 text-white animate-pulse'
                    : isReady
                    ? 'bg-teal-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>
                  {String(elapsedMinutes).padStart(2, '0')}:{String(elapsedSecsRem).padStart(2, '0')}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isServed
                    ? 'Order Served to Guests'
                    : isReady
                    ? 'Cooking Completed • Ready for Service'
                    : isOverdue
                    ? 'Exceeded Estimated Prep Time!'
                    : 'Cooking in Progress'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Target Prep: {targetMinutes} mins • {isPaid ? 'Bill Settled' : 'Payment Awaiting Settlement'}
                </div>
              </div>
            </div>

            {/* Quick Status Bump Actions */}
            <div className="flex items-center gap-2">
              {!isReady && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark All Ready</span>
                </button>
              )}
              {isReady && !isServed && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(order.id, 'served')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Mark All Served</span>
                </button>
              )}
            </div>
          </div>

          {/* Step-by-Step Kitchen Lifecycle Visual Timeline */}
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
              Kitchen Workflow Timeline
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Step 1: KOT Sent */}
              <div
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isOrdered
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
                    ✓
                  </div>
                </div>
                <div className="text-xs font-extrabold">1. KOT Placed</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{formatTime(order.createdAt)}</div>
              </div>

              {/* Step 2: Cooking */}
              <div
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isCooking
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isCooking ? 'bg-amber-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    2
                  </div>
                </div>
                <div className="text-xs font-extrabold">2. In Cooking</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {order.kitchenStartedAt ? formatTime(order.kitchenStartedAt) : isCooking ? 'In Prep' : 'Queued'}
                </div>
              </div>

              {/* Step 3: Food Ready */}
              <div
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isReady
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isReady ? 'bg-teal-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    3
                  </div>
                </div>
                <div className="text-xs font-extrabold">3. Food Ready</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {order.kitchenReadyAt ? formatTime(order.kitchenReadyAt) : isReady ? 'Ready' : 'Pending'}
                </div>
              </div>

              {/* Step 4: Served / Completed */}
              <div
                className={`p-3 rounded-2xl border text-center transition-all ${
                  isServed
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isServed ? 'bg-blue-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    4
                  </div>
                </div>
                <div className="text-xs font-extrabold">4. Served / Bill</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {order.kitchenServedAt ? formatTime(order.kitchenServedAt) : isPaid ? 'Settled' : 'Unpaid'}
                </div>
              </div>
            </div>
          </div>

          {/* Item-by-Item Kitchen Preparation Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Item-by-Item Kitchen Status ({(order.items || []).length} items)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Tap status button to update dish state
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {(order.items || []).map((item, index) => {
                const itemStatus = item.kitchenStatus || (isReady ? 'ready' : isCooking ? 'preparing' : 'pending');

                return (
                  <div
                    key={item.id || index}
                    className="p-3.5 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {item.quantity}x
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.variantName && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">
                              [{item.variantName}]
                            </span>
                          )}
                        </div>

                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            {item.modifiers.map((m) => `+ ${m.name}`).join(', ')}
                          </div>
                        )}

                        {item.notes && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded mt-0.5">
                            Note: {item.notes}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatCurrency(item.totalAmount, settings.currencySymbol)}
                        </div>
                      </div>
                    </div>

                    {/* Dish Kitchen Status Control */}
                    <div className="flex items-center gap-1">
                      {itemStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => updateOrderItemKitchenStatus(order.id, item.id, 'preparing')}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-lg text-[11px] font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1"
                        >
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>Start Cooking</span>
                        </button>
                      )}

                      {itemStatus === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => updateOrderItemKitchenStatus(order.id, item.id, 'ready')}
                          className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100 rounded-lg text-[11px] font-bold border border-teal-300 dark:border-teal-800 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-teal-500" />
                          <span>Mark Ready</span>
                        </button>
                      )}

                      {itemStatus === 'ready' && (
                        <button
                          type="button"
                          onClick={() => updateOrderItemKitchenStatus(order.id, item.id, 'served')}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-[11px] font-bold border border-blue-300 dark:border-blue-800 flex items-center gap-1"
                        >
                          <UtensilsCrossed className="w-3 h-3 text-blue-500" />
                          <span>Mark Served</span>
                        </button>
                      )}

                      {itemStatus === 'served' && (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Served</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial & Table Status Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-500">Table & Guest:</span>{' '}
              <span className="font-extrabold text-slate-800 dark:text-white">
                {order.tableName || 'N/A'} {order.guestCount ? `(${order.guestCount} Guests)` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Subtotal:</span>{' '}
              <span className="font-bold text-slate-800 dark:text-white">
                {formatCurrency(order.subtotal, settings.currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Tax/GST:</span>{' '}
              <span className="font-bold text-slate-800 dark:text-white">
                {formatCurrency(order.taxAmount, settings.currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Grand Total:</span>{' '}
              <span className="font-black text-sm text-slate-900 dark:text-white">
                {formatCurrency(order.grandTotal, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKOTModalOrder(order)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print KOT</span>
            </button>
            <button
              type="button"
              onClick={() => setReceiptModalOrder(order)}
              className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && onOpenPayment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(order);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                <span>Settle Payment ({formatCurrency(order.grandTotal, settings.currencySymbol)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
