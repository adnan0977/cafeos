import {
  Clock,
  Download,
  FileSpreadsheet,
  Flame,
  Moon,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RestaurantSettings } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import { HourlySalesItem } from '../../utils/reportUtils';

interface DailyReportProps {
  hourlySales: HourlySalesItem[];
  settings: RestaurantSettings;
  dateLabel: string;
}

export const DailyReport: React.FC<DailyReportProps> = ({
  hourlySales,
  settings,
  dateLabel,
}) => {
  // Find peak hour
  const peakHour = useMemo(() => {
    return [...hourlySales].sort((a, b) => b.totalSales - a.totalSales)[0];
  }, [hourlySales]);

  // Lunch Rush: 12 PM - 3 PM (hours 12, 13, 14)
  const lunchStats = useMemo(() => {
    const hours = hourlySales.filter((h) => h.hour >= 12 && h.hour <= 14);
    const sales = hours.reduce((s, h) => s + h.totalSales, 0);
    const orders = hours.reduce((s, h) => s + h.orderCount, 0);
    return { sales, orders };
  }, [hourlySales]);

  // Dinner Rush: 7 PM - 10 PM (hours 19, 20, 21)
  const dinnerStats = useMemo(() => {
    const hours = hourlySales.filter((h) => h.hour >= 19 && h.hour <= 21);
    const sales = hours.reduce((s, h) => s + h.totalSales, 0);
    const orders = hours.reduce((s, h) => s + h.orderCount, 0);
    return { sales, orders };
  }, [hourlySales]);

  const totalDaySales = hourlySales.reduce((s, h) => s + h.totalSales, 0);
  const totalDayOrders = hourlySales.reduce((s, h) => s + h.orderCount, 0);

  const handleExportCSV = () => {
    const data = hourlySales.map((item) => ({
      'Time Slot': item.hourLabel,
      'Orders Placed': item.orderCount,
      'Total Sales': item.totalSales,
      'Items Sold': item.itemsSold,
      'Average Ticket Size': item.avgTicket,
    }));
    exportToCSV(`Hourly_Rush_Report_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Daily Rush & Hourly Peak Performance Report</span>
          </h2>
          <p className="text-xs text-slate-500">
            Intra-day sales distribution, customer flow velocity, and peak rush periods for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Hourly CSV</span>
        </button>
      </div>

      {/* Rush Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Peak Rush Hour Badge */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md shadow-amber-500/10 space-y-2">
          <div className="flex items-center justify-between text-amber-100 text-xs font-bold uppercase tracking-wider">
            <span>Peak Rush Period</span>
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {peakHour && peakHour.totalSales > 0 ? peakHour.hourLabel : 'Normal Flow'}
          </div>
          <div className="text-xs text-amber-100 pt-1">
            {peakHour && peakHour.totalSales > 0 ? (
              <span>
                Generated <strong>{formatCurrency(peakHour.totalSales, settings.currencySymbol)}</strong> across{' '}
                <strong>{peakHour.orderCount}</strong> customer orders
              </span>
            ) : (
              'Awaiting order velocity'
            )}
          </div>
        </div>

        {/* Lunch Rush Card (12 PM - 3 PM) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Lunch Rush (12 PM - 3 PM)</span>
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
              {totalDaySales > 0 ? `${Math.round((lunchStats.sales / totalDaySales) * 100)}% of Day` : '0%'}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(lunchStats.sales, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500">
            {lunchStats.orders} tickets served during daytime rush
          </div>
        </div>

        {/* Dinner Rush Card (7 PM - 10 PM) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Dinner Rush (7 PM - 10 PM)</span>
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
              {totalDaySales > 0 ? `${Math.round((dinnerStats.sales / totalDaySales) * 100)}% of Day` : '0%'}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(dinnerStats.sales, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500">
            {dinnerStats.orders} tickets served during evening service
          </div>
        </div>
      </div>

      {/* Hourly Sales Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Hourly Revenue Distribution
            </h3>
            <p className="text-xs text-slate-500">Sales volume per operating hour</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-slate-500">Day Total: {formatCurrency(totalDaySales, settings.currencySymbol)}</span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlySales} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="hour"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                tickFormatter={(h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'a' : 'p'}`}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `₹${Number(value).toLocaleString()} (${props.payload.orderCount} orders)`,
                  'Sales',
                ]}
                labelFormatter={(h) => {
                  const item = hourlySales.find((x) => x.hour === Number(h));
                  return item ? item.hourLabel : `${h}:00`;
                }}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="totalSales" fill="#d97706" radius={[6, 6, 0, 0]}>
                {hourlySales.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hour === peakHour?.hour && entry.totalSales > 0 ? '#b45309' : '#d97706'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Detail Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Hour-by-Hour Operational Audit
          </h3>
          <span className="text-xs text-slate-400">8:00 AM to 11:59 PM</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Time Slot</th>
                <th className="py-3 px-3 text-right">Orders Count</th>
                <th className="py-3 px-3 text-right">Items Sold</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">Avg Ticket Size</th>
                <th className="py-3 px-4 text-center">Hourly Rush Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {hourlySales.map((item) => {
                const pct = totalDaySales > 0 ? (item.totalSales / totalDaySales) * 100 : 0;
                const isPeak = item.hour === peakHour?.hour && item.totalSales > 0;
                return (
                  <tr
                    key={item.hour}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isPeak ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>{item.hourLabel}</span>
                      {isPeak && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase">
                          Peak
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {item.orderCount}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {item.itemsSold}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(item.totalSales, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                      {item.avgTicket > 0 ? formatCurrency(item.avgTicket, settings.currencySymbol) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full max-w-[120px] mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPeak ? 'bg-amber-600' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
