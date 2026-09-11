import React, { useState } from 'react';
import {
  Calculator,
  Printer,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  Download,
  Banknote,
  Receipt,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';

interface Denomination {
  value: number;
  count: number;
}

export const DayEndAuditClosing: React.FC = () => {
  const { settings, orders = [], expenses = [] } = useRestaurant();

  const [openingFloat, setOpeningFloat] = useState<number>(2000);
  const [managerNotes, setManagerNotes] = useState<string>('All registers reconciled, inventory locked.');
  const [managerName, setManagerName] = useState<string>('Rajesh Kumar (Shift Lead)');
  const [showZReportModal, setShowZReportModal] = useState<boolean>(false);
  const [closingBanner, setClosingBanner] = useState<string>('');

  // Physical currency note counts
  const [denominations, setDenominations] = useState<Denomination[]>([
    { value: 500, count: 18 },
    { value: 200, count: 12 },
    { value: 100, count: 25 },
    { value: 50, count: 20 },
    { value: 20, count: 15 },
    { value: 10, count: 20 },
  ]);

  // Calculations from actual orders
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const grossSales = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const cashSales = paidOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const upiSales = paidOrders
    .filter((o) => o.paymentMethod === 'upi')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const cardSales = paidOrders
    .filter((o) => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const aggregatorSales = paidOrders
    .filter((o) => o.paymentMethod === 'aggregator')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  // Cash expenses / petty cash
  const cashExpensesTotal = expenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPhysicalCounted = denominations.reduce(
    (sum, d) => sum + d.value * (d.count || 0),
    0
  );

  const expectedCashInDrawer = openingFloat + cashSales - cashExpensesTotal;
  const cashVariance = totalPhysicalCounted - expectedCashInDrawer;

  const handleUpdateDenomination = (value: number, count: number) => {
    setDenominations((prev) =>
      prev.map((d) => (d.value === value ? { ...d, count: Math.max(0, count) } : d))
    );
  };

  const handlePrintZReport = () => {
    window.print();
  };

  const handleFinalizeClosing = () => {
    setShowZReportModal(true);
    setClosingBanner(
      `Day-End Z-Report successfully audited! Cash variance: ${
        cashVariance === 0 ? 'Exact Match (₹0.00)' : formatCurrency(cashVariance)
      }`
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Day-End Closing &amp; Z-Report Audit Reconciler
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                RoyalPOS Z-Audit
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reconcile physical cash drawer notes against POS billing records, calculate cash shortages or overages, and generate official daily financial closing Z-Reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleFinalizeClosing}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Generate &amp; Print Z-Report</span>
          </button>
        </div>
      </div>

      {closingBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{closingBanner}</span>
        </div>
      )}

      {/* Financial Summary Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Day Sales</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(grossSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{paidOrders.length} settled orders today</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cash Billed in POS</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(cashSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Direct cash payments received</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">UPI, QR &amp; Cards</div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">
            {formatCurrency(upiSales + cardSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            UPI: {formatCurrency(upiSales)} | Card: {formatCurrency(cardSales)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Drawer Cash Variance</div>
          <div
            className={`text-2xl font-black mt-1 ${
              cashVariance === 0
                ? 'text-emerald-600'
                : cashVariance > 0
                ? 'text-sky-600'
                : 'text-rose-600'
            }`}
          >
            {cashVariance === 0
              ? 'Balanced (₹0)'
              : cashVariance > 0
              ? `+${formatCurrency(cashVariance)} (Over)`
              : `${formatCurrency(cashVariance)} (Short)`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Counted vs Expected in drawer</div>
        </div>
      </div>

      {/* Main Form: Drawer Opening + Denominations + Petty Cash */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Opening Float & Denominations Counter */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote className="w-4 h-4 text-purple-600" />
              <span>Physical Currency Denomination Counter</span>
            </h4>
            <div className="text-xs font-bold text-purple-600">
              Total Counted: {formatCurrency(totalPhysicalCounted)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Opening Cash Float (₹)
              </label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-black text-sm text-purple-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Cash kept in drawer at shift start for change
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Shift In-charge Manager
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          {/* Denominations Grid */}
          <div className="pt-2 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Count of Currency Notes in Drawer:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {denominations.map((denom) => {
                const subtotal = denom.value * (denom.count || 0);

                return (
                  <div
                    key={denom.value}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black text-xs text-slate-900 dark:text-white block">
                        ₹{denom.value}
                      </span>
                      <span className="text-[10px] font-bold text-purple-600">
                        = {formatCurrency(subtotal)}
                      </span>
                    </div>

                    <div className="w-16">
                      <input
                        type="number"
                        min="0"
                        value={denom.count}
                        onChange={(e) =>
                          handleUpdateDenomination(denom.value, parseInt(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-black text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Closing Audit Observations &amp; Notes
            </label>
            <textarea
              rows={2}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Right Column: Reconciled Cash Equation & Thermal Preview */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cash Drawer Balancing Audit</span>
            </h4>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">(+) Opening Cash Float</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(openingFloat)}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">(+) Cash Orders Billed</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(cashSales)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">(-) Petty Cash Expenses Paid</span>
                <span className="font-bold text-rose-600">-{formatCurrency(cashExpensesTotal)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 px-2 rounded-lg">
                <span>(=) Expected Cash In Drawer</span>
                <span className="font-black text-amber-600">
                  {formatCurrency(expectedCashInDrawer)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold text-slate-900 dark:text-white bg-purple-50 dark:bg-purple-950/30 px-2 rounded-lg">
                <span>Total Physical Cash Counted</span>
                <span className="font-black text-purple-600">
                  {formatCurrency(totalPhysicalCounted)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Cash Variance (Over / Short)</span>
                <span
                  className={`font-black ${
                    cashVariance === 0
                      ? 'text-emerald-600'
                      : cashVariance > 0
                      ? 'text-sky-600'
                      : 'text-rose-600'
                  }`}
                >
                  {cashVariance === 0 ? '₹0.00 (Balanced)' : formatCurrency(cashVariance)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinalizeClosing}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Generate &amp; Print Official Z-Report</span>
          </button>
        </div>
      </div>

      {/* Z-Report Thermal Slip Modal */}
      {showZReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden my-8">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                Thermal 80mm Z-Report Slip
              </span>
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Thermal Receipt Body */}
            <div className="p-5 font-mono text-[11px] space-y-3 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950">
              <div className="text-center border-b border-dashed border-slate-400 pb-2 space-y-0.5">
                <div className="font-black text-sm">{settings.name.toUpperCase()}</div>
                <div className="text-[10px]">{settings.address}</div>
                <div className="text-[10px]">GSTIN: {settings.gstNumber}</div>
                <div className="font-black mt-1 text-xs">*** DAILY CLOSING Z-REPORT ***</div>
                <div className="text-[9px] text-slate-500">
                  {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>Gross Sales:</span>
                  <span className="font-bold">{formatCurrency(grossSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settled Invoices:</span>
                  <span>{paidOrders.length} Bills</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Collections:</span>
                  <span>{formatCurrency(cashSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>UPI &amp; QR:</span>
                  <span>{formatCurrency(upiSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cards / POS Terminal:</span>
                  <span>{formatCurrency(cardSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aggregator Online:</span>
                  <span>{formatCurrency(aggregatorSales)}</span>
                </div>
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>{formatCurrency(openingFloat)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Petty Cash Paid:</span>
                  <span>-{formatCurrency(cashExpensesTotal)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Expected Cash:</span>
                  <span>{formatCurrency(expectedCashInDrawer)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Counted Cash:</span>
                  <span>{formatCurrency(totalPhysicalCounted)}</span>
                </div>
                <div className="flex justify-between font-black text-xs">
                  <span>Cash Variance:</span>
                  <span>{formatCurrency(cashVariance)}</span>
                </div>
              </div>

              <div className="text-[10px] space-y-1 border-b border-dashed border-slate-400 pb-2">
                <div>Audited By: {managerName}</div>
                <div>Notes: {managerNotes}</div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-1">
                *** END OF Z-REPORT AUDIT ***
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <button
                type="button"
                onClick={handlePrintZReport}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print to Thermal ESC/POS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
