import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface RefundModalProps {
  order: Order;
  onClose: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ order, onClose }) => {
  const { processRefund, settings } = useRestaurant();
  const { currentUser } = useAuth();

  const [amount, setAmount] = useState<string>(String(order.grandTotal));
  const [reason, setReason] = useState<string>('Customer Request / Dish Quality');
  const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod || 'cash');

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refundAmt = parseFloat(amount) || 0;
    if (refundAmt <= 0 || refundAmt > order.grandTotal) {
      alert(`Refund amount must be between ₹1 and ₹${order.grandTotal}`);
      return;
    }

    processRefund(order.id, refundAmt, reason, method);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-8">
        <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-base">
              Issue Refund: Order #{order.orderNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRefundSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Original Order Total:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(order.grandTotal, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid Via:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                {order.paymentMethod || 'CASH'}
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              step="any"
              max={order.grandTotal}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Refund Payout Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold focus:outline-hidden"
            >
              <option value="cash">Cash (From Cash Drawer)</option>
              <option value="upi">UPI / Bank Reversal</option>
              <option value="credit_card">Card Chargeback</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Refund
            </label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Order delayed / item cold / customer dissatisfaction"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Confirm & Process Refund</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
