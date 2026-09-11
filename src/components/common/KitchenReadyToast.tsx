import React, { useEffect, useState } from 'react';
import {
  ChefHat,
  CheckCircle2,
  DollarSign,
  Receipt,
  UtensilsCrossed,
  X,
  Volume2,
  Bell,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { playKitchenReadyChime } from '../../utils/soundUtils';

export interface ReadyToastItem {
  id: string;
  order: Order;
  timestamp: number;
  message?: string;
}

interface KitchenReadyToastProps {
  toasts: ReadyToastItem[];
  currencySymbol?: string;
  onDismiss: (id: string) => void;
  onSettleOrder?: (order: Order) => void;
  onMarkServed?: (order: Order) => void;
  onPrintReceipt?: (order: Order) => void;
  onPrintKOT?: (order: Order) => void;
  onViewOrder?: (order: Order) => void;
}

export const KitchenReadyToast: React.FC<KitchenReadyToastProps> = ({
  toasts,
  currencySymbol = '₹',
  onDismiss,
  onSettleOrder,
  onMarkServed,
  onPrintReceipt,
  onPrintKOT,
  onViewOrder,
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      id="kitchen-ready-toasts-container"
      aria-label="Kitchen Ready Notifications"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          currencySymbol={currencySymbol}
          onDismiss={() => onDismiss(toast.id)}
          onSettleOrder={onSettleOrder}
          onMarkServed={onMarkServed}
          onPrintReceipt={onPrintReceipt}
          onPrintKOT={onPrintKOT}
          onViewOrder={onViewOrder}
        />
      ))}
    </aside>
  );
};

interface ToastCardProps {
  toast: ReadyToastItem;
  currencySymbol: string;
  onDismiss: () => void;
  onSettleOrder?: (order: Order) => void;
  onMarkServed?: (order: Order) => void;
  onPrintReceipt?: (order: Order) => void;
  onPrintKOT?: (order: Order) => void;
  onViewOrder?: (order: Order) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  toast,
  currencySymbol,
  onDismiss,
  onSettleOrder,
  onMarkServed,
  onPrintReceipt,
  onPrintKOT,
  onViewOrder,
}) => {
  const { order } = toast;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  const DURATION_MS = 8000;

  // Auto-dismiss countdown timer with pause on mouse hover
  useEffect(() => {
    if (isPaused) return;

    const interval = 50;
    const step = (interval / DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onDismiss]);

  const itemCount = (order.items || []).reduce((sum, it) => sum + it.quantity, 0);
  const dishNames = (order.items || [])
    .map((it) => `${it.quantity}x ${it.name}`)
    .slice(0, 3)
    .join(', ');
  const moreCount = (order.items || []).length > 3 ? (order.items || []).length - 3 : 0;

  return (
    <div
      id={`ready-toast-${order.id}`}
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="pointer-events-auto bg-slate-900/95 dark:bg-slate-900/98 backdrop-blur-md text-white border-2 border-emerald-500/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 animate-in slide-in-from-top-4 fade-in hover:shadow-emerald-500/20"
    >
      {/* Top Banner Header */}
      <div className="bg-emerald-600/20 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Kitchen Ready!
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                {order.tableName || order.orderType.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Order #{order.orderNumber} • Just now</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            id={`btn-toast-sound-${order.id}`}
            onClick={() => playKitchenReadyChime()}
            title="Replay Alert Chime"
            className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id={`btn-toast-dismiss-${order.id}`}
            onClick={onDismiss}
            title="Dismiss Toast"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              {dishNames}
              {moreCount > 0 && <span className="text-slate-400"> +{moreCount} more</span>}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {itemCount} total item{itemCount > 1 ? 's' : ''} prepared & plated by kitchen
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono font-black text-sm text-emerald-400">
              {formatCurrency(order.grandTotal, currencySymbol)}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {order.paymentStatus === 'paid' ? 'Paid' : 'Unsettled'}
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {order.paymentStatus !== 'paid' && onSettleOrder && (
            <button
              type="button"
              id={`btn-toast-settle-${order.id}`}
              onClick={() => {
                onSettleOrder(order);
                onDismiss();
              }}
              className="flex-1 min-w-[120px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Settle Bill</span>
            </button>
          )}

          {onMarkServed && order.status === 'ready' && (
            <button
              type="button"
              id={`btn-toast-served-${order.id}`}
              onClick={() => {
                onMarkServed(order);
                onDismiss();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1 transition-all"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Mark Served</span>
            </button>
          )}

          {onPrintReceipt && (
            <button
              type="button"
              id={`btn-toast-print-${order.id}`}
              onClick={() => onPrintReceipt(order)}
              title="Print Receipt / Bill"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
            </button>
          )}

          {onViewOrder && (
            <button
              type="button"
              id={`btn-toast-view-${order.id}`}
              onClick={() => {
                onViewOrder(order);
                onDismiss();
              }}
              title="View Details"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Auto Dismiss Progress Bar */}
      <div className="h-1 w-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
