import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  History,
  Lock,
  Unlock,
  Wallet,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const ShiftModal: React.FC = () => {
  const { isShiftModalOpen, setIsShiftModalOpen, shifts, openShift, closeShift, settings } = useRestaurant();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [openingCashInput, setOpeningCashInput] = useState<string>('5000');
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isShiftModalOpen) return null;

  const currentShift = shifts.find((s) => s.status === 'open');

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const floatAmount = parseFloat(openingCashInput) || 0;
    openShift(floatAmount);
    setSuccessMessage(`New Shift opened with opening cash float of ${formatCurrency(floatAmount, settings.currencySymbol)}`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    const actual = parseFloat(actualCashInput) || 0;
    closeShift(currentShift.id, actual, closingNotes);
    setSuccessMessage('Shift successfully balanced and closed!');
    setTimeout(() => {
      setSuccessMessage('');
      setIsShiftModalOpen(false);
    }, 1500);
  };

  const expectedCash = currentShift
    ? currentShift.openingCash + currentShift.cashSales - currentShift.cashRefunds
    : 0;
  const actualCash = parseFloat(actualCashInput) || 0;
  const variance = actualCash - expectedCash;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Cash Drawer & Register Shift
              </h3>
              <p className="text-xs text-slate-500">
                Opening float, cash sales reconciliation & variance audit
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsShiftModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('current')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'current'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Shift Session</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Shift History ({shifts.length})</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'current' ? (
            currentShift ? (
              <div className="space-y-4">
                {/* Active Shift Stats Card */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-500">Cashier on Duty</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentShift.userName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Shift Started At</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatDateTime(currentShift.startTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Opening Cash Float</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(currentShift.openingCash, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Cash Sales (Shift)</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatCurrency(currentShift.cashSales, settings.currencySymbol)}
                    </span>
                  </div>
                  {currentShift.cashRefunds > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Cash Refunds Processed</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(currentShift.cashRefunds, settings.currencySymbol)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Expected Drawer Cash
                    </span>
                    <span className="text-sm font-extrabold text-amber-600">
                      {formatCurrency(expectedCash, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Close Shift Form */}
                <form onSubmit={handleCloseShift} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enter Counted Physical Cash in Drawer (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 5221"
                      value={actualCashInput}
                      onChange={(e) => setActualCashInput(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  {actualCashInput !== '' && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        Math.abs(variance) < 0.01
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700'
                          : variance > 0
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 text-blue-700'
                          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {Math.abs(variance) < 0.01 ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {Math.abs(variance) < 0.01
                            ? 'Drawer Perfectly Balanced (₹0.00)'
                            : variance > 0
                            ? `Cash Overage (+${formatCurrency(variance)})`
                            : `Cash Shortage (-${formatCurrency(Math.abs(variance))})`}
                        </span>
                      </div>
                      <span className="font-bold text-xs">
                        {variance >= 0 ? `+₹${variance.toFixed(2)}` : `-₹${Math.abs(variance).toFixed(2)}`}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Closing Shift Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Verified by manager Rohit. Petty cash bills enclosed."
                      value={closingNotes}
                      onChange={(e) => setClosingNotes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Reconcile & Close Shift Session</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Open Shift Form */
              <form onSubmit={handleOpenShift} className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Unlock className="w-4 h-4 text-amber-600" />
                    No Active Shift Running
                  </p>
                  Count opening petty cash float before taking orders on the POS.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Petty Cash Float (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Start New Shift Session</span>
                </button>
              </form>
            )
          ) : (
            /* Shift History */
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {shifts.map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">{s.userName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'open'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatDateTime(s.startTime)} {s.endTime ? `to ${formatDateTime(s.endTime)}` : ''}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <div>
                      <div className="text-slate-400 text-[10px]">Opening Float</div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatCurrency(s.openingCash)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Cash Sales</div>
                      <div className="font-semibold text-emerald-600">+{formatCurrency(s.cashSales)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Variance</div>
                      <div
                        className={`font-semibold ${
                          (s.variance || 0) >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600'
                        }`}
                      >
                        {s.variance !== undefined ? formatCurrency(s.variance) : 'Active'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
