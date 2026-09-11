import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  FileSpreadsheet,
  Layers,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Expense, RestaurantSettings } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import { DailyTrendItem, SalesSummaryMetrics } from '../../utils/reportUtils';

interface MonthlyReportProps {
  summary: SalesSummaryMetrics;
  dailyTrend: DailyTrendItem[];
  expenses: Expense[];
  settings: RestaurantSettings;
  dateLabel: string;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  summary,
  dailyTrend,
  expenses,
  settings,
  dateLabel,
}) => {
  // Compute total expenses in the period
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  // Expenses grouped by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.keys(map).map((cat) => ({
      category: cat.toUpperCase(),
      amount: map[cat],
      percentage: totalExpenses > 0 ? Math.round((map[cat] / totalExpenses) * 100) : 0,
    }));
  }, [expenses, totalExpenses]);

  // Estimated Food Cost (Cost of Goods Sold - COGS) @ standard 28% of Gross Sales
  const estimatedCOGS = Math.round(summary.grossSubtotal * 0.28);
  const grossProfit = summary.netRevenue - estimatedCOGS;
  const netOperatingProfit = grossProfit - totalExpenses;
  const profitMargin = summary.netRevenue > 0 ? (netOperatingProfit / summary.netRevenue) * 100 : 0;

  const handleExportCSV = () => {
    const data = dailyTrend.map((d) => ({
      Date: d.date,
      'Orders Placed': d.orderCount,
      'Gross Subtotal': d.grossSales,
      'Discounts Given': d.discounts,
      'GST Taxes': d.taxes,
      'Net Revenue': d.netSales,
      'Items Sold': d.itemsCount,
    }));
    exportToCSV(`Monthly_Report_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Monthly P&L, Revenue Progression & Financial Statements</span>
          </h2>
          <p className="text-xs text-slate-500">
            Day-by-day trajectory, operating expenditures, estimated COGS, and store profitability for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Monthly Data CSV</span>
        </button>
      </div>

      {/* P&L Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Sales Collection</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary.netRevenue, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{summary.paidOrdersCount} completed orders</div>
        </div>

        {/* Estimated COGS (Food Cost) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Est. Food Cost (COGS)</span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {formatCurrency(estimatedCOGS, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">~28% raw ingredients ratio</div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Expenses</span>
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatCurrency(totalExpenses, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{expenses.length} expense ledger entries</div>
        </div>

        {/* Net Operating Profit / EBITDA */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operating Net Profit</span>
            <span
              className={`p-2 rounded-xl ${
                netOperatingProfit >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div
            className={`text-2xl font-black mt-2 ${
              netOperatingProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(netOperatingProfit, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-bold">
            {profitMargin.toFixed(1)}% operating margin
          </div>
        </div>
      </div>

      {/* Day-by-Day Sales Progression Area Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Daily Revenue Progression
            </h3>
            <p className="text-xs text-slate-500">Day-by-day sales volume across the monthly timeline</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Net Sales']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="netSales"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#monthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* P&L Statement Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condensed P&L Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span>Store Profit & Loss (P&L) Statement</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200">1. Gross Revenue</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary.grossSubtotal, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
              <span>Less: Discounts & Offers Given</span>
              <span>-{formatCurrency(summary.totalDiscounts, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
              <span>2. Net Operational Sales</span>
              <span>{formatCurrency(summary.netRevenue, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-1 text-amber-600 dark:text-amber-400">
              <span>Less: Cost of Goods Sold (COGS raw materials ~28%)</span>
              <span>-{formatCurrency(estimatedCOGS, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-1.5 font-bold border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white">
              <span>3. Gross Food Margin</span>
              <span>{formatCurrency(grossProfit, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
              <span>Less: Total Operating Store Expenses</span>
              <span>-{formatCurrency(totalExpenses, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between py-2.5 font-black text-sm border-t-2 border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
              <span>NET OPERATING PROFIT / EBITDA</span>
              <span>{formatCurrency(netOperatingProfit, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Operating Expenses Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-rose-500" />
              <span>Store Operating Expenses Breakdown</span>
            </h3>
            <span className="text-xs font-bold text-rose-600">{formatCurrency(totalExpenses, settings.currencySymbol)}</span>
          </div>

          <div className="space-y-3">
            {expenseByCategory.map((item) => (
              <div key={item.category} className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrency(item.amount, settings.currencySymbol)} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${Math.max(4, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
            {expenseByCategory.length === 0 && (
              <div className="text-xs text-slate-400 py-6 text-center">
                No expense entries logged for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day-by-Day Historical Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Daily Financial Records Ledger
          </h3>
          <span className="text-xs text-slate-400">{dailyTrend.length} days recorded</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3 text-right">Orders</th>
                <th className="py-3 px-4 text-right">Gross Sales</th>
                <th className="py-3 px-3 text-right">Discounts</th>
                <th className="py-3 px-3 text-right">Taxes</th>
                <th className="py-3 px-4 text-right">Net Revenue</th>
                <th className="py-3 px-3 text-right">Items Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {dailyTrend.map((d) => (
                <tr key={d.date} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {d.date}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {d.orderCount}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(d.grossSales, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-500 font-medium">
                    {d.discounts > 0 ? `-${formatCurrency(d.discounts, settings.currencySymbol)}` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(d.taxes, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(d.netSales, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                    {d.itemsCount}
                  </td>
                </tr>
              ))}
              {dailyTrend.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No transactions recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
