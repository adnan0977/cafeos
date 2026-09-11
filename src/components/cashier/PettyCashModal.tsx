import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Check,
  Coins,
  DollarSign,
  FileText,
  Lock,
  Receipt,
  Tag,
  User,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

interface PettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CASH_OUT_CATEGORIES = [
  'Milk & Dairy Purchase',
  'Fresh Vegetables & Produce',
  'Ice & Water Cans',
  'Gas Cylinder Refill',
  'Packaging Material / Foil',
  'Cleaning & Sanitization Supplies',
  'Daily Staff Meal / Tea',
  'Local Courier / Auto Fare',
  'Equipment Repair / Maintenance',
  'Cash Drop to Owner Safe',
  'Miscellaneous Petty Expense',
];

const CASH_IN_CATEGORIES = [
  'Opening Float Addition',
  'Bank Cash Withdrawal (Change)',
  'Customer Deposit / Advance',
  'Owner Cash Infusion',
  'Other Cash In',
];

export const PettyCashModal: React.FC<PettyCashModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addExpense, shifts, settings } = useRestaurant();
  const { currentUser } = useAuth();

  const [transactionType, setTransactionType] = useState<'cash_out' | 'cash_in'>('cash_out');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(CASH_OUT_CATEGORIES[0]);
  const [recipient, setRecipient] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const activeShift = shifts.find((s) => s.status === 'open');

  const handleTypeSwitch = (type: 'cash_out' | 'cash_in') => {
    setTransactionType(type);
    setCategory(type === 'cash_out' ? CASH_OUT_CATEGORIES[0] : CASH_IN_CATEGORIES[0]);
    setErrorMessage('');
  };

  const handlePresetAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid cash amount greater than zero.');
      return;
    }

    if (!recipient.trim()) {
      setErrorMessage('Please specify vendor or recipient name.');
      return;
    }

    // Record expense via context
    addExpense({
      title: `${transactionType === 'cash_out' ? 'Petty Expense' : 'Cash Float In'}: ${category}`,
      category: transactionType === 'cash_out' ? 'operations' : 'inventory',
      amount: numericAmount,
      date: new Date().toISOString(),
      paidTo: recipient.trim(),
      paymentMethod: 'cash',
      description: `${notes.trim()} (Recorded by ${currentUser?.name || 'Cashier'} at Register)`,
      recordedBy: currentUser?.name || 'POS Cashier',
      shiftId: activeShift?.id,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('');
      setRecipient('');
      setNotes('');
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Register Petty Cash (In / Out)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  [F10]
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Petpooja & RoyalPOS cash drawer float & expense management
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Switcher Tabs */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeSwitch('cash_out')}
              className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                transactionType === 'cash_out'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>Cash Out / Expense (Drop)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('cash_in')}
              className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                transactionType === 'cash_in'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[3]" />
              <span>Cash In / Float Added</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">Transaction successfully recorded in register cash drawer!</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Amount (₹) *</span>
              <span className="text-[10px] text-slate-500">Quick tender shortcuts:</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-amber-400 font-black text-sm">₹</span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-lg font-black text-white outline-hidden font-mono"
              />
            </div>

            {/* Quick Denomination Chips */}
            <div className="flex items-center gap-2 mt-2">
              {[50, 100, 200, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Reason / Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs font-bold text-white outline-hidden"
            >
              {(transactionType === 'cash_out' ? CASH_OUT_CATEGORIES : CASH_IN_CATEGORIES).map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient / Vendor Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {transactionType === 'cash_out' ? 'Paid To / Vendor Name *' : 'Received From *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={
                  transactionType === 'cash_out'
                    ? 'e.g. Amul Milk Vendor, Ice Depot, Rajesh'
                    : 'e.g. Bank Withdrawal, Owner Float'
                }
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs font-bold text-white placeholder-slate-600 outline-hidden"
              />
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Notes / Voucher Reference
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bill #849, 10 Litres full cream milk..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs font-medium text-white placeholder-slate-600 outline-hidden"
            />
          </div>

          {/* Shift Drawer Impact Notice */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span>Active Cashier on Duty:</span>
              <span className="font-bold text-white">{currentUser?.name || 'Counter Cashier'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span>Shift Register Balance Impact:</span>
              <span
                className={`font-black ${
                  transactionType === 'cash_out' ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {transactionType === 'cash_out' ? '-' : '+'}
                {formatCurrency(parseFloat(amount) || 0, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSuccess || !amount || parseFloat(amount) <= 0}
              className={`px-5 py-2.5 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                transactionType === 'cash_out'
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                Record {transactionType === 'cash_out' ? 'Expense' : 'Float Entry'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
