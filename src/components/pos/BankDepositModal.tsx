import { AlertCircle, Building2, Check, DollarSign, Landmark, Plus, TrendingDown, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

interface BankDepositModalProps {
  onClose: () => void;
}

interface DepositRecord {
  id: string;
  amount: number;
  bankName: string;
  referenceNumber: string;
  depositedBy: string;
  timestamp: string;
  notes?: string;
}

export const BankDepositModal: React.FC<BankDepositModalProps> = ({ onClose }) => {
  const { settings, shifts, addExpense } = useRestaurant();

  const [deposits, setDeposits] = useState<DepositRecord[]>([
    {
      id: 'bd-1',
      amount: 15000,
      bankName: 'HDFC Bank - Main Operating A/C',
      referenceNumber: 'HDFC-DEP-994821',
      depositedBy: 'Manager John',
      timestamp: new Date(Date.now() - 86400000).toLocaleString(),
      notes: 'End of yesterday cash drop',
    },
  ]);

  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank - Operating A/C (..4821)');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const activeShift = shifts.find((s) => s.status === 'open');
  const currentDrawerCash = activeShift ? activeShift.openingCash + activeShift.cashSales : 24500;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    const newRecord: DepositRecord = {
      id: `bd-${Date.now()}`,
      amount: val,
      bankName,
      referenceNumber: referenceNumber.trim() || `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
      depositedBy: activeShift?.cashierName || 'Cashier / POS Staff',
      timestamp: new Date().toLocaleString(),
      notes,
    };

    setDeposits([newRecord, ...deposits]);

    // Also record as petty cash / bank transfer expense
    addExpense({
      title: `Bank Deposit: ${bankName}`,
      amount: val,
      category: 'bank_transfer',
      paymentMethod: 'cash',
      paidTo: bankName,
      receiptNumber: newRecord.referenceNumber,
      notes: `Cash drawer drop to bank. ${notes}`,
      date: new Date().toISOString().split('T')[0],
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setAmount('');
      setReferenceNumber('');
      setNotes('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Bank Deposit & Safe Cash Drop</h3>
              <p className="text-xs text-slate-400">Transfer excess register cash to bank vault or operating account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Estimated Cash in Register:</span>
              <div className="text-lg font-black text-blue-700 dark:text-blue-400">
                {formatCurrency(currentDrawerCash, settings.currencySymbol)}
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded-xl shadow-2xs">
              Shift Active
            </span>
          </div>

          {isSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Deposit voucher generated and drawer cash deducted successfully!</span>
            </div>
          )}

          <form onSubmit={handleDeposit} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">New Deposit Voucher</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Deposit Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Deposit Bank Account</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold"
                >
                  <option value="HDFC Bank - Operating A/C (..4821)">HDFC Bank - Operating A/C (..4821)</option>
                  <option value="ICICI Bank - Current A/C (..9102)">ICICI Bank - Current A/C (..9102)</option>
                  <option value="SBI Restaurant A/C (..3391)">SBI Restaurant A/C (..3391)</option>
                  <option value="In-Store Safe Deposit Vault">In-Store Safe Deposit Vault</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Slip / Ref # (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Mid-day cash drop"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Record Deposit & Deduct Cash</span>
            </button>
          </form>

          {/* Deposit History */}
          <div>
            <h4 className="font-bold text-xs text-slate-500 mb-2">Recent Deposits & Vault Drops</h4>
            <div className="space-y-2">
              {deposits.map((dep) => (
                <div key={dep.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold text-slate-900 dark:text-white">{dep.bankName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{dep.referenceNumber} • {dep.timestamp}</div>
                    {dep.notes && <div className="text-[11px] text-slate-400 italic mt-0.5">{dep.notes}</div>}
                  </div>
                  <div className="text-right font-black text-blue-600 dark:text-blue-400 text-sm">
                    {formatCurrency(dep.amount, settings.currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 font-bold text-xs rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
