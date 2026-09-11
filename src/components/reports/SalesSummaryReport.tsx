import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  Layers,
  Package,
  Percent,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RestaurantSettings } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import {
  DailyTrendItem,
  OrderTypeBreakdownItem,
  PaymentBreakdownItem,
  SalesSummaryMetrics,
} from '../../utils/reportUtils';

interface SalesSummaryReportProps {
  summary: SalesSummaryMetrics;
  paymentBreakdown: PaymentBreakdownItem[];
  orderTypeBreakdown: OrderTypeBreakdownItem[];
  dailyTrend: DailyTrendItem[];
  settings: RestaurantSettings;
  dateLabel: string;
}

const PAYMENT_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899'];
const ORDER_TYPE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#14b8a6'];

export const SalesSummaryReport: React.FC<SalesSummaryReportProps> = ({
  summary,
  paymentBreakdown,
  orderTypeBreakdown,
  dailyTrend,
  settings,
  dateLabel,
}) => {
  const handleExportCSV = () => {
    const data = [
      { Metric: 'Reporting Period', Value: dateLabel },
      { Metric: 'Total Orders Placed', Value: summary.totalOrdersCount },
      { Metric: 'Paid / Completed Orders', Value: summary.paidOrdersCount },
      { Metric: 'Cancelled Orders', Value: summary.cancelledOrdersCount },
      { Metric: 'Gross Subtotal', Value: summary.grossSubtotal },
      { Metric: 'Discounts Given', Value: summary.totalDiscounts },
      { Metric: 'Taxes Collected (GST)', Value: summary.totalTaxes },
      { Metric: 'Delivery Charges', Value: summary.totalDeliveryCharges },
      { Metric: 'Round Off', Value: summary.totalRoundOff },
      { Metric: 'Net Revenue', Value: summary.netRevenue },
      { Metric: 'Average Order Value (AOV)', Value: Math.round(summary.avgOrderValue) },
      { Metric: 'Total Items Sold', Value: summary.totalItemsSold },
      { Metric: 'Average Items per Order', Value: summary.avgItemsPerOrder.toFixed(1) },
    ];
    exportToCSV(`Sales_Summary_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>Executive Sales & Financial Summary</span>
          </h2>
          <p className="text-xs text-slate-500">
            Comprehensive revenue totals, payment settlement mix, order channels, and operational margins for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Summary CSV</span>
        </button>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Sales Revenue</span>
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary.netRevenue, settings.currencySymbol)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {summary.paidOrdersCount} Paid Orders
            </span>
            <span>• {summary.cancelledOrdersCount} voids</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Order Value (AOV)</span>
            <span className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Receipt className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(summary.avgOrderValue, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Average ticket size across completed bills
          </div>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Items Sold</span>
            <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Utensils className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {summary.totalItemsSold}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            ~{summary.avgItemsPerOrder.toFixed(1)} items per customer ticket
          </div>
        </div>

        {/* Total Discounts & Promotions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discounts & Offers</span>
            <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Percent className="w-5 h-5" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(summary.totalDiscounts, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {summary.grossSubtotal > 0
              ? `${((summary.totalDiscounts / summary.grossSubtotal) * 100).toFixed(1)}% of gross sales`
              : '0% promo rate'}
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="border-r border-slate-100 dark:border-slate-800 pr-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Food Subtotal</span>
          <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {formatCurrency(summary.grossSubtotal, settings.currencySymbol)}
          </div>
        </div>
        <div className="border-r border-slate-100 dark:border-slate-800 pr-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase">GST Tax Collected</span>
          <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {formatCurrency(summary.totalTaxes, settings.currencySymbol)}
          </div>
        </div>
        <div className="border-r border-slate-100 dark:border-slate-800 pr-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Delivery Revenue</span>
          <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {formatCurrency(summary.totalDeliveryCharges, settings.currencySymbol)}
          </div>
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase">Guest Footfall Seated</span>
          <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
            {summary.guestCountTotal} guests
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart (if multiple days available) */}
      {dailyTrend.length > 1 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Revenue Trend Over Time
              </h3>
              <p className="text-xs text-slate-500">Day-by-day sales progression across this period</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Net Sales']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="netSales" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Payment & Channels Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Payment Settlements Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">{summary.paidOrdersCount} Transactions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    dataKey="totalAmount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {paymentBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), settings.currencySymbol), 'Collected']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {paymentBreakdown.map((item, idx) => (
                <div key={item.method} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PAYMENT_COLORS[idx % PAYMENT_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.totalAmount, settings.currencySymbol)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.percentage}% ({item.count} orders)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Types / Channels Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span>Fulfillment Channels Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-bold">Volume Share</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeBreakdown}
                    dataKey="totalSales"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {orderTypeBreakdown.map((_, index) => (
                      <Cell key={`type-cell-${index}`} fill={ORDER_TYPE_COLORS[index % ORDER_TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), settings.currencySymbol), 'Sales']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {orderTypeBreakdown.map((item, idx) => (
                <div key={item.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: ORDER_TYPE_COLORS[idx % ORDER_TYPE_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.totalSales, settings.currencySymbol)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {item.percentage}% ({item.orderCount} bills)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Reconciliation Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <span>Financial Statement Reconciliation</span>
          </h3>
          <span className="text-xs text-slate-400">Accrual Basis</span>
        </div>
        <div className="p-4">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr className="py-2.5">
                <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">Gross Food & Beverage Subtotal</td>
                <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(summary.grossSubtotal, settings.currencySymbol)}
                </td>
              </tr>
              <tr className="py-2.5">
                <td className="py-2.5 font-medium text-rose-600 dark:text-rose-400">Less: Promotional Discounts & Coupons</td>
                <td className="py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                  -{formatCurrency(summary.totalDiscounts, settings.currencySymbol)}
                </td>
              </tr>
              <tr className="py-2.5">
                <td className="py-2.5 font-bold text-slate-700 dark:text-slate-300">Net Taxable Revenue</td>
                <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.grossSubtotal - summary.totalDiscounts, settings.currencySymbol)}
                </td>
              </tr>
              <tr className="py-2.5">
                <td className="py-2.5 font-medium text-slate-600 dark:text-slate-400">Plus: GST Taxes Collected (CGST 2.5% + SGST 2.5%)</td>
                <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  +{formatCurrency(summary.totalTaxes, settings.currencySymbol)}
                </td>
              </tr>
              <tr className="py-2.5">
                <td className="py-2.5 font-medium text-slate-600 dark:text-slate-400">Plus: Home Delivery Convenience Charges</td>
                <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  +{formatCurrency(summary.totalDeliveryCharges, settings.currencySymbol)}
                </td>
              </tr>
              <tr className="py-2.5">
                <td className="py-2.5 font-medium text-slate-600 dark:text-slate-400">Round Off Adjustments</td>
                <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(summary.totalRoundOff, settings.currencySymbol)}
                </td>
              </tr>
              <tr className="py-3 bg-amber-50/50 dark:bg-amber-950/20 font-black text-sm">
                <td className="py-3 px-2 text-amber-900 dark:text-amber-200">TOTAL NET REALIZED COLLECTION</td>
                <td className="py-3 px-2 text-right text-amber-600 dark:text-amber-400 text-base">
                  {formatCurrency(summary.netRevenue, settings.currencySymbol)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
