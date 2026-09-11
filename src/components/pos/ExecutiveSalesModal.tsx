import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  PieChart,
  ShoppingBag,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatCurrency } from '../../utils/formatters';

interface ExecutiveSalesModalProps {
  onClose: () => void;
}

export const ExecutiveSalesModal: React.FC<ExecutiveSalesModalProps> = ({ onClose }) => {
  const { orders, expenses, settings } = useRestaurant();

  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const completedOrders = orders.filter((o) => o.paymentStatus === 'paid');

    const totalGrossSales = completedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalTaxes = completedOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
    const totalNetSales = Math.max(0, totalGrossSales - totalTaxes);

    const dineInSales = completedOrders
      .filter((o) => o.orderType === 'dine_in')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const takeawaySales = completedOrders
      .filter((o) => o.orderType === 'takeaway')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const deliverySales = completedOrders
      .filter((o) => o.orderType === 'delivery' || o.orderType === 'online')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const cashPayments = completedOrders
      .flatMap((o) => o.payments || [])
      .filter((p) => p.method === 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    const digitalPayments = completedOrders
      .flatMap((o) => o.payments || [])
      .filter((p) => p.method !== 'cash')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenseToday = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingProfit = totalGrossSales - totalExpenseToday;

    return {
      orderCount: completedOrders.length,
      totalGrossSales,
      totalDiscounts,
      totalTaxes,
      totalNetSales,
      dineInSales,
      takeawaySales,
      deliverySales,
      cashPayments,
      digitalPayments,
      totalExpenseToday,
      netOperatingProfit,
      averageOrderValue: completedOrders.length > 0 ? totalGrossSales / completedOrders.length : 0,
    };
  }, [orders, expenses]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Executive Sales Summary & Financial KPIs</h3>
              <p className="text-xs text-slate-400">Real-time consolidated revenue, channels, and profit overview</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 block">Gross Revenue</span>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(metrics.totalGrossSales, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">{metrics.orderCount} Paid Orders</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 block">Avg Order Value</span>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {formatCurrency(metrics.averageOrderValue, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-400">per ticket</span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 block">Total Expenses</span>
              <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(metrics.totalExpenseToday, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-rose-500 font-semibold">{expenses.length} Records</span>
            </div>

            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/60">
              <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 block">Operating Margin</span>
              <div className="text-base font-black text-purple-700 dark:text-purple-400 mt-0.5">
                {formatCurrency(metrics.netOperatingProfit, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-purple-600 font-semibold">Net P&L</span>
            </div>
          </div>

          {/* Sales Channels Breakdown */}
          <div className="p-4 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Revenue Breakdown By Order Channel
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <UtensilsCrossed className="w-3.5 h-3.5" /> Dine-In Sales
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(metrics.dineInSales, settings.currencySymbol)}
                </div>
              </div>

              <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-900/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                  <ShoppingBag className="w-3.5 h-3.5" /> Takeaway Sales
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(metrics.takeawaySales, settings.currencySymbol)}
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" /> Delivery / Online
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white mt-1">
                  {formatCurrency(metrics.deliverySales, settings.currencySymbol)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Split */}
          <div className="p-4 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Tender & Settlement Split
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">Cash in Hand</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatCurrency(metrics.cashPayments, settings.currencySymbol)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span className="font-bold">Digital / UPI / Cards</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">
                  {formatCurrency(metrics.digitalPayments, settings.currencySymbol)}
                </span>
              </div>
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
