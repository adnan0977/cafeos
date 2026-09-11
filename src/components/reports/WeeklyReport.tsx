import {
  Award,
  Calendar,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  TrendingUp,
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
import { DayOfWeekItem } from '../../utils/reportUtils';

interface WeeklyReportProps {
  weeklyData: DayOfWeekItem[];
  settings: RestaurantSettings;
  dateLabel: string;
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({
  weeklyData,
  settings,
  dateLabel,
}) => {
  const totalWeeklySales = useMemo(() => {
    return weeklyData.reduce((sum, d) => sum + d.totalSales, 0);
  }, [weeklyData]);

  const totalWeeklyOrders = useMemo(() => {
    return weeklyData.reduce((sum, d) => sum + d.orderCount, 0);
  }, [weeklyData]);

  // Best day of the week
  const bestDay = useMemo(() => {
    return [...weeklyData].sort((a, b) => b.totalSales - a.totalSales)[0];
  }, [weeklyData]);

  // Weekdays (Mon-Fri) vs Weekend (Sat-Sun)
  const weekendStats = useMemo(() => {
    const weekend = weeklyData.filter((d) => d.dayIndex === 0 || d.dayIndex === 6);
    const sales = weekend.reduce((sum, d) => sum + d.totalSales, 0);
    const orders = weekend.reduce((sum, d) => sum + d.orderCount, 0);
    return { sales, orders };
  }, [weeklyData]);

  const weekdayStats = useMemo(() => {
    const weekdays = weeklyData.filter((d) => d.dayIndex >= 1 && d.dayIndex <= 5);
    const sales = weekdays.reduce((sum, d) => sum + d.totalSales, 0);
    const orders = weekdays.reduce((sum, d) => sum + d.orderCount, 0);
    return { sales, orders };
  }, [weeklyData]);

  const handleExportCSV = () => {
    const data = weeklyData.map((d) => ({
      Day: d.dayName,
      'Orders Placed': d.orderCount,
      'Total Sales': d.totalSales,
      'Average Ticket Size': d.avgTicket,
      '% of Week Sales': totalWeeklySales > 0 ? `${((d.totalSales / totalWeeklySales) * 100).toFixed(1)}%` : '0%',
    }));
    exportToCSV(`Weekly_Performance_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Weekly Sales & Day-of-Week Trend Analysis</span>
          </h2>
          <p className="text-xs text-slate-500">
            Day-wise velocity, weekend vs. weekday sales volume, and best performing operational days for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Weekly CSV</span>
        </button>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Day Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md shadow-amber-500/10 space-y-2">
          <div className="flex items-center justify-between text-amber-100 text-xs font-bold uppercase tracking-wider">
            <span>Highest Revenue Day</span>
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-black text-white">
            {bestDay && bestDay.totalSales > 0 ? bestDay.dayName : 'Normal Flow'}
          </div>
          <div className="text-xs text-amber-100">
            {bestDay && bestDay.totalSales > 0 ? (
              <span>
                Generated <strong>{formatCurrency(bestDay.totalSales, settings.currencySymbol)}</strong> across{' '}
                <strong>{bestDay.orderCount}</strong> customer orders
              </span>
            ) : (
              'Awaiting weekly transactions'
            )}
          </div>
        </div>

        {/* Weekday Performance (Mon - Fri) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Weekdays (Mon - Fri)
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
              5 Days
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(weekdayStats.sales, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500">
            {weekdayStats.orders} orders (
            {totalWeeklySales > 0 ? `${Math.round((weekdayStats.sales / totalWeeklySales) * 100)}% of total` : '0%'}
            )
          </div>
        </div>

        {/* Weekend Performance (Sat - Sun) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Weekend Rush (Sat - Sun)
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              2 Peak Days
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(weekendStats.sales, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500">
            {weekendStats.orders} orders (
            {totalWeeklySales > 0 ? `${Math.round((weekendStats.sales / totalWeeklySales) * 100)}% of total` : '0%'}
            )
          </div>
        </div>
      </div>

      {/* Day of Week Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Day-of-Week Revenue Distribution
            </h3>
            <p className="text-xs text-slate-500">Sales comparison across all 7 days</p>
          </div>
          <div className="text-xs font-bold text-slate-500">
            Weekly Total: {formatCurrency(totalWeeklySales, settings.currencySymbol)}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="shortName" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `₹${Number(value).toLocaleString()} (${props.payload.orderCount} orders)`,
                  'Revenue',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="totalSales" fill="#d97706" radius={[6, 6, 0, 0]}>
                {weeklyData.map((d, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={d.dayName === bestDay?.dayName && d.totalSales > 0 ? '#b45309' : '#d97706'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Day-by-Day Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Day-wise Performance Matrix
          </h3>
          <span className="text-xs text-slate-400">Monday to Sunday</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Day of Week</th>
                <th className="py-3 px-3 text-right">Orders Placed</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">Avg Ticket Size</th>
                <th className="py-3 px-4 text-center">Share of Weekly Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {weeklyData.map((d) => {
                const pct = totalWeeklySales > 0 ? (d.totalSales / totalWeeklySales) * 100 : 0;
                const isBest = d.dayName === bestDay?.dayName && d.totalSales > 0;
                return (
                  <tr
                    key={d.dayIndex}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isBest ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>{d.dayName}</span>
                      {isBest && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase">
                          Best Day
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {d.orderCount}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(d.totalSales, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                      {d.avgTicket > 0 ? formatCurrency(d.avgTicket, settings.currencySymbol) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full max-w-[120px] mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isBest ? 'bg-amber-600' : 'bg-amber-400'}`}
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
