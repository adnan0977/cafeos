import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Search, Download, DollarSign, Calendar, Tag, UserCheck, Receipt } from 'lucide-react';
import { Expense } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface ExpenseManagementProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  currencySymbol: string;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
  expenses = [],
  onAddExpense,
  currencySymbol = '₹',
}) => {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState<'supplies' | 'utilities' | 'salaries' | 'maintenance' | 'marketing' | 'rent' | 'petty_cash' | 'other'>('petty_cash');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [paidTo, setPaidTo] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const categories = ['all', 'petty_cash', 'supplies', 'utilities', 'maintenance', 'salaries', 'marketing', 'other'];

  const filteredExpenses = safeExpenses.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
        (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAddExpense({
      date: new Date().toISOString(),
      category,
      description,
      amount: parsedAmount,
      paymentMethod,
      paidTo: paidTo || 'Store Vendor / Staff',
      invoiceNumber: invoiceNumber || undefined,
      recordedBy: 'Store Cashier / Manager',
    });

    setIsModalOpen(false);
    setDescription('');
    setAmount('');
    setPaidTo('');
    setInvoiceNumber('');
  };

  const handleExportCSV = () => {
    const rows = filteredExpenses.map((e) => ({
      ID: e.id,
      Date: formatDateTime(e.date),
      Category: e.category.toUpperCase(),
      Description: e.description,
      Amount: e.amount,
      PaymentMethod: e.paymentMethod,
      PaidTo: e.paidTo || 'N/A',
      InvoiceNumber: e.invoiceNumber || 'N/A',
      RecordedBy: e.recordedBy,
    }));
    exportToCSV('Expense_Petty_Cash_Report', rows);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Metrics */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Petty Cash & Store Expense Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Daily cashier drawer cash drops, emergency supplies, fuel allowance & operational payouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <span className="text-[10px] font-bold text-rose-600 uppercase">Filtered Total: </span>
            <span className="text-sm font-black text-rose-700 dark:text-rose-300">
              {formatCurrency(totalExpenseAmount, currencySymbol)}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap capitalize transition-all ${
                categoryFilter === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search description or payee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-48 sm:w-64"
          />
        </div>
      </div>

      {/* Expense List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-slate-500">{formatDateTime(exp.date)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {exp.description}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {exp.paidTo || 'N/A'}
                  </td>
                  <td className="py-3 px-4 uppercase font-semibold text-[10px] text-slate-500">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-3 px-4 font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(exp.amount, currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{exp.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Record Store Petty Cash / Operational Expense
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="petty_cash">Petty Cash Drawer Drop</option>
                    <option value="supplies">Raw Supplies & Ice</option>
                    <option value="utilities">LPG Gas & Utilities</option>
                    <option value="maintenance">Equipment Repair</option>
                    <option value="salaries">Staff Advance / Wage</option>
                    <option value="marketing">Local Promotion</option>
                    <option value="other">Other Operational</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Amount ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-rose-600"
                    placeholder="500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Purpose</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  placeholder="e.g. Emergency 5L Amul milk pouch purchase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="cash">Cash Drawer</option>
                    <option value="upi">UPI / Scanner</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Paid To / Payee</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                    placeholder="Local Dairy Shop"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Invoice / Voucher Ref # (Optional)</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                  placeholder="VOUCH-8821"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
