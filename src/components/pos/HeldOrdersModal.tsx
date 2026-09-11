import { Clock, Play, Trash2, X } from 'lucide-react';
import React from 'react';
import { Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface HeldOrdersModalProps {
  heldOrders: Order[];
  onResumeOrder: (order: Order) => void;
  onDeleteHeldOrder: (orderId: string) => void;
  onClose: () => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({
  heldOrders,
  onResumeOrder,
  onDeleteHeldOrder,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Held Orders Queue ({heldOrders.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          {heldOrders.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No held orders currently in queue.
            </div>
          ) : (
            heldOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Order #{order.orderNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {order.orderType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {order.customerName} • {order.tableName || 'Takeaway'} • {order.items.length} item(s)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Held At: {formatDateTime(order.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(order.grandTotal)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onResumeOrder(order);
                      onClose();
                    }}
                    className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume</span>
                  </button>
                  <button
                    onClick={() => onDeleteHeldOrder(order.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    title="Discard Held Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
