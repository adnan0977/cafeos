import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Layers,
  PieChart as PieChartIcon,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { CategorySalesItem } from '../../utils/reportUtils';

interface CategoryReportProps {
  categorySales: CategorySalesItem[];
  settings: RestaurantSettings;
  dateLabel: string;
}

const CATEGORY_PALETTE = [
  '#d97706',
  '#2563eb',
  '#059669',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#0891b2',
  '#4f46e5',
  '#ca8a04',
];

export const CategoryReport: React.FC<CategoryReportProps> = ({
  categorySales,
  settings,
  dateLabel,
}) => {
  const totalRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0);
  const totalItemsSold = categorySales.reduce((sum, c) => sum + c.itemsSold, 0);

  const handleExportCSV = () => {
    const data = categorySales.map((c, index) => ({
      Rank: index + 1,
      Category: c.categoryName,
      'Units Sold': c.itemsSold,
      Revenue: c.revenue,
      '% Share of Sales': `${c.percentage}%`,
      'Avg Revenue per Unit': c.itemsSold > 0 ? Math.round(c.revenue / c.itemsSold) : 0,
    }));
    exportToCSV(`Category_Sales_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <span>Category Sales & Product Family Contribution</span>
          </h2>
          <p className="text-xs text-slate-500">
            Revenue breakdown and volume across menu departments for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Category CSV</span>
        </button>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-amber-500" />
            <span>Category Revenue Share (%)</span>
          </h3>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {categorySales.map((_, index) => (
                    <Cell key={`cat-cell-${index}`} fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), settings.currencySymbol), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>Revenue by Category (₹)</span>
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="categoryName"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#d97706" radius={[6, 6, 0, 0]}>
                  {categorySales.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Category Breakdown Table
          </h3>
          <span className="text-xs text-slate-400">Total: {formatCurrency(totalRevenue, settings.currencySymbol)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-3 text-right">Units Sold</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">Avg Realization / Item</th>
                <th className="py-3 px-4 text-center">Share of Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {categorySales.map((cat, index) => {
                const avg = cat.itemsSold > 0 ? cat.revenue / cat.itemsSold : 0;
                return (
                  <tr key={cat.categoryId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length] }}
                      />
                      <span>{cat.categoryName}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {cat.itemsSold}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                      {formatCurrency(cat.revenue, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                      {formatCurrency(avg, settings.currencySymbol)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full max-w-[120px] mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                          <span>{cat.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(4, cat.percentage))}%`,
                              backgroundColor: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categorySales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No category sales data recorded.
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
