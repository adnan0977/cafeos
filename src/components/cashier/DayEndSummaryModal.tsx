import {
  AlertCircle,
  Banknote,
  Calculator,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Printer,
  Receipt,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface DayEndSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftClosed?: () => void;
}

export const DayEndSummaryModal: React.FC<DayEndSummaryModalProps> = ({
  isOpen,
  onClose,
  onShiftClosed,
}) => {
  const { shifts, orders, expenses, settings, closeShift } = useRestaurant();
  const { currentUser } = useAuth();

  const activeShift = shifts.find((s) => s.status === 'open');

  const [countedCash, setCountedCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  // Calculate Shift Financials
  const shiftOrders = useMemo(() => {
    if (!activeShift) return [];
    const shiftStartTime = new Date(activeShift.startTime).getTime();
    return orders.filter(
      (o) =>
        new Date(o.createdAt).getTime() >= shiftStartTime &&
        o.paymentStatus === 'paid' &&
        o.status !== 'cancelled'
    );
  }, [activeShift, orders]);

  const shiftExpenses = useMemo(() => {
    if (!activeShift) return [];
    const shiftStartTime = new Date(activeShift.startTime).getTime();
    return expenses.filter(
      (e) =>
        e.shiftId === activeShift.id ||
        new Date(e.date).getTime() >= shiftStartTime
    );
  }, [activeShift, expenses]);

  // Cash sales calculation
  const cashSales = useMemo(() => {
    return shiftOrders.reduce((sum, order) => {
      if (order.payments && order.payments.length > 0) {
        const cashPart = order.payments
          .filter((p) => p.method === 'cash')
          .reduce((acc, p) => acc + p.amount, 0);
        return sum + cashPart;
      }
      return sum;
    }, 0);
  }, [shiftOrders]);

  const upiSales = useMemo(() => {
    return shiftOrders.reduce((sum, order) => {
      if (order.payments && order.payments.length > 0) {
        const upiPart = order.payments
          .filter((p) => p.method === 'upi')
          .reduce((acc, p) => acc + p.amount, 0);
        return sum + upiPart;
      }
      return sum;
    }, 0);
  }, [shiftOrders]);

  const cardSales = useMemo(() => {
    return shiftOrders.reduce((sum, order) => {
      if (order.payments && order.payments.length > 0) {
        const cardPart = order.payments
          .filter((p) => p.method === 'credit_card' || (p.method as any) === 'debit_card')
          .reduce((acc, p) => acc + p.amount, 0);
        return sum + cardPart;
      }
      return sum;
    }, 0);
  }, [shiftOrders]);

  const totalSales = useMemo(() => {
    return shiftOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [shiftOrders]);

  const totalDiscount = useMemo(() => {
    return shiftOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  }, [shiftOrders]);

  const totalTax = useMemo(() => {
    return shiftOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  }, [shiftOrders]);

  // Petty expenses paid out of register cash
  const cashExpensesTotal = useMemo(() => {
    return shiftExpenses
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [shiftExpenses]);

  const openingFloat = activeShift ? activeShift.openingCash : 1000;
  const expectedDrawerCash = openingFloat + cashSales - cashExpensesTotal;

  const countedCashNum = parseFloat(countedCash) || 0;
  const cashVariance = countedCash ? countedCashNum - expectedDrawerCash : 0;

  const handleExecuteCloseShift = () => {
    if (!activeShift) return;
    setIsClosing(true);

    closeShift(activeShift.id, countedCashNum || expectedDrawerCash, closingNotes);

    setSuccessMessage('Shift closed successfully! Daily Z-Report generated.');
    setTimeout(() => {
      setIsClosing(false);
      if (onShiftClosed) onShiftClosed();
      onClose();
    }, 1500);
  };

  const handlePrintZReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Day-End Summary & Z-Report</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  REGISTER ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Petpooja & RoyalPOS daily shift reconciliation & cash drawer closing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Cashier and Shift Time Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Cashier</span>
              <span className="font-black text-white">{activeShift?.userName || currentUser?.name || 'Counter Cashier'}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Shift Started</span>
              <span className="font-mono text-slate-300">
                {activeShift ? formatDateTime(activeShift.startTime) : 'Active Today'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Bills</span>
              <span className="font-mono font-bold text-amber-400">{shiftOrders.length} Invoices</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Gross Revenue</span>
              <span className="font-mono font-black text-emerald-400">
                {formatCurrency(totalSales, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Core Drawer Cash Reconciliation (Petpooja / RoyalPOS Formula) */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
              <span>Cash Register Reconciliation (Cash in Drawer)</span>
              <span className="text-amber-400 font-mono">Formula: Opening + Cash Sales - Expenses</span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-800/60">
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-400">Opening Cash Float</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatCurrency(openingFloat, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-400">(+) Cash Collected from Orders</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatCurrency(cashSales, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-slate-400">(-) Petty Expenses / Cash Out</span>
                <span className="font-mono font-bold text-rose-400">
                  -{formatCurrency(cashExpensesTotal, settings.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 font-black text-sm">
                <span className="text-white">Expected Cash in Drawer:</span>
                <span className="font-mono text-amber-400 text-base">
                  {formatCurrency(expectedDrawerCash, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Actual Physical Cash Counted Input */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Enter Physical Counted Cash (₹) *</span>
                {countedCash && (
                  <span
                    className={`text-xs font-mono font-black ${
                      cashVariance === 0
                        ? 'text-emerald-400'
                        : cashVariance > 0
                        ? 'text-sky-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Variance: {cashVariance > 0 ? `+₹${cashVariance}` : `₹${cashVariance}`} (
                    {cashVariance === 0 ? 'Exact Match' : cashVariance > 0 ? 'Excess' : 'Shortage'})
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-amber-400 font-black">₹</span>
                  <input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    placeholder={expectedDrawerCash.toString()}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-white font-mono font-black outline-hidden text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCountedCash(expectedDrawerCash.toString())}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  Auto-Fill Expected
                </button>
              </div>
            </div>
          </div>

          {/* Digital Payment Breakdown (UPI, Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">UPI / QR Sales</span>
              <span className="font-mono font-black text-sky-400 text-sm">
                {formatCurrency(upiSales, settings.currencySymbol)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Card / POS Terminal</span>
              <span className="font-mono font-black text-indigo-400 text-sm">
                {formatCurrency(cardSales, settings.currencySymbol)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Discounts Given</span>
              <span className="font-mono font-black text-rose-400 text-sm">
                {formatCurrency(totalDiscount, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Closing Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Shift Closing Remarks
            </label>
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. Evening rush handled smoothly, ₹50 excess change in register..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white text-xs outline-hidden"
            />
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrintZReport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Z-Report</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isClosing}
              onClick={handleExecuteCloseShift}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Close Shift & Lock Register</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
