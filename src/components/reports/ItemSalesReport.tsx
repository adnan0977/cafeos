import {
  AlertTriangle,
  ArrowUpDown,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Filter,
  Flame,
  Layers,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
import { Category, RestaurantSettings } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import { ItemSalesRow } from '../../utils/reportUtils';

interface ItemSalesReportProps {
  itemSales: ItemSalesRow[];
  categories: Category[];
  settings: RestaurantSettings;
  dateLabel: string;
}

type SortField = 'revenue' | 'quantity' | 'price' | 'name';
type SortOrder = 'desc' | 'asc';

export const ItemSalesReport: React.FC<ItemSalesReportProps> = ({
  itemSales,
  categories,
  settings,
  dateLabel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return itemSales
      .filter((item) => {
        if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
          return false;
        }
        if (
          searchQuery.trim() &&
          !item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
          !item.categoryName.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'revenue') diff = a.totalRevenue - b.totalRevenue;
        else if (sortField === 'quantity') diff = a.quantitySold - b.quantitySold;
        else if (sortField === 'price') diff = a.avgUnitPrice - b.avgUnitPrice;
        else if (sortField === 'name') diff = a.name.localeCompare(b.name);

        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [itemSales, selectedCategory, searchQuery, sortField, sortOrder]);

  // Star Performers (Top 5 items by revenue)
  const starPerformers = useMemo(() => {
    return [...itemSales].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [itemSales]);

  // Slow Movers (Items with lowest quantity sold but > 0, or bottom 5)
  const slowMovers = useMemo(() => {
    return [...itemSales]
      .filter((i) => i.quantitySold > 0)
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 5);
  }, [itemSales]);

  // Top 10 for bar chart
  const top10ForChart = useMemo(() => {
    return [...itemSales]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 8)
      .map((item) => ({
        name: item.name.length > 16 ? item.name.substring(0, 14) + '...' : item.name,
        fullName: item.name,
        revenue: item.totalRevenue,
        quantity: item.quantitySold,
      }));
  }, [itemSales]);

  const handleExportCSV = () => {
    const exportData = filteredItems.map((item, index) => ({
      Rank: index + 1,
      'Item Name': item.name,
      Category: item.categoryName,
      'Food Type': item.foodType,
      'Units Sold': item.quantitySold,
      'Average Price': item.avgUnitPrice,
      'Total Revenue': item.totalRevenue,
      'Order Count': item.orderCount,
      '% Share of Revenue': `${item.percentOfRevenue}%`,
      '% Share of Volume': `${item.percentOfVolume}%`,
    }));
    exportToCSV(`Item_Sales_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, exportData);
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const totalFilteredRevenue = filteredItems.reduce((sum, i) => sum + i.totalRevenue, 0);
  const totalFilteredQuantity = filteredItems.reduce((sum, i) => sum + i.quantitySold, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            <span>Item Sales & Product Mix (Menu Engineering)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Dish-level sales volume, gross revenue contribution, average realization, and product velocity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Item Sales CSV</span>
          </button>
        </div>
      </div>

      {/* Highlights: Star Sellers vs Slow Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Star Sellers Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Top Star Sellers (Highest Revenue)</span>
            </h3>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
              High Velocity
            </span>
          </div>
          <div className="space-y-2">
            {starPerformers.map((item, idx) => (
              <div
                key={item.menuItemId}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-amber-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                    <div className="text-[10px] text-slate-400">
                      {item.categoryName} • {item.quantitySold} units
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.totalRevenue, settings.currencySymbol)}
                  </span>
                  <div className="text-[10px] text-emerald-600 font-semibold">{item.percentOfRevenue}% of sales</div>
                </div>
              </div>
            ))}
            {starPerformers.length === 0 && (
              <div className="text-xs text-slate-400 py-4 text-center">No sales recorded yet.</div>
            )}
          </div>
        </div>

        {/* Slow Movers Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              <span>Low-Velocity Items (Opportunity / Deadstock)</span>
            </h3>
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
              Review Menu
            </span>
          </div>
          <div className="space-y-2">
            {slowMovers.map((item, idx) => (
              <div
                key={item.menuItemId}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <div className="text-[10px] text-slate-400">
                      {item.categoryName} • {item.quantitySold} units
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.totalRevenue, settings.currencySymbol)}
                  </span>
                  <div className="text-[10px] text-rose-500 font-semibold">{item.percentOfRevenue}% of sales</div>
                </div>
              </div>
            ))}
            {slowMovers.length === 0 && (
              <div className="text-xs text-slate-400 py-4 text-center">No slow movers recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Top 8 Items Bar Chart */}
      {top10ForChart.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              <span>Top Revenue Generating Dishes (₹)</span>
            </h3>
            <span className="text-xs text-slate-400">Top 8 Stars</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10ForChart} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `₹${Number(value).toLocaleString()} (${props.payload.quantity} units)`,
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
                <Bar dataKey="revenue" fill="#d97706" radius={[6, 6, 0, 0]}>
                  {top10ForChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#b45309' : '#d97706'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dish or beverage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Quick Stats on Filtered view */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredItems.length}</span> items
            </div>
            <div className="text-slate-500">
              Units: <span className="font-bold text-amber-600">{totalFilteredQuantity}</span>
            </div>
            <div className="text-slate-500">
              Rev: <span className="font-bold text-emerald-600">{formatCurrency(totalFilteredRevenue, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Categories ({itemSales.length})
          </button>
          {categories.map((cat) => {
            const count = itemSales.filter((i) => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Item Sales Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4 cursor-pointer hover:text-amber-600" onClick={() => handleToggleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Menu Item</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Category</th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-amber-600"
                  onClick={() => handleToggleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Units Sold</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-3 text-right cursor-pointer hover:text-amber-600"
                  onClick={() => handleToggleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-amber-600"
                  onClick={() => handleToggleSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Revenue</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Sales Contribution</th>
                <th className="py-3 px-3 text-right">Bills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredItems.map((item, index) => (
                <tr
                  key={item.menuItemId}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3 text-center font-bold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Veg" />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                      {item.categoryName}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                    {item.quantitySold}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                    {formatCurrency(item.avgUnitPrice, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                    {formatCurrency(item.totalRevenue, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-full max-w-[130px] mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>{item.percentOfRevenue}% rev</span>
                        <span>{item.percentOfVolume}% vol</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(4, item.percentOfRevenue))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500 font-medium">
                    {item.orderCount}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No items match the current search or category filter.
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
