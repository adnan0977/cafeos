import {
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  Percent,
  Printer,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { exportToCSV } from '../../utils/exportUtils';
import { generateDemoOrders } from '../../utils/reportDemoData';
import {
  computeCategorySales,
  computeDailyTrend,
  computeHourlySalesReport,
  computeItemSalesReport,
  computeOrderTypeBreakdown,
  computePaymentBreakdown,
  computeSalesSummary,
  computeStaffSalesReport,
  computeTaxDiscountMetrics,
  computeWeeklySalesReport,
  DATE_PRESETS,
  DateRangePreset,
  filterOrdersByRange,
  generateZReportHTML,
  getDateRange,
} from '../../utils/reportUtils';
import { CategoryReport } from './CategoryReport';
import { DailyReport } from './DailyReport';
import { ItemSalesReport } from './ItemSalesReport';
import { MonthlyReport } from './MonthlyReport';
import { SalesSummaryReport } from './SalesSummaryReport';
import { StaffReport } from './StaffReport';
import { TaxDiscountReport } from './TaxDiscountReport';
import { WeeklyReport } from './WeeklyReport';

type ReportTab =
  | 'summary'
  | 'item_sales'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'categories'
  | 'taxes'
  | 'staff';

interface TabDefinition {
  id: ReportTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const REPORT_TABS: TabDefinition[] = [
  { id: 'summary', label: 'Sales Summary', icon: TrendingUp },
  { id: 'item_sales', label: 'Item Sales & Mix', icon: Utensils, badge: 'Popular' },
  { id: 'daily', label: 'Daily & Hourly Rush', icon: Clock },
  { id: 'weekly', label: 'Weekly Trends', icon: Calendar },
  { id: 'monthly', label: 'Monthly & P&L', icon: DollarSign },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'taxes', label: 'Tax & Discounts', icon: Receipt },
  { id: 'staff', label: 'Staff Performance', icon: Users },
];

export const ReportsPortal: React.FC = () => {
  const {
    orders,
    menuItems,
    categories,
    expenses,
    settings,
    setOrders,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  // Compute Active Date Range
  const dateRange = useMemo(() => {
    return getDateRange(datePreset, customStart, customEnd);
  }, [datePreset, customStart, customEnd]);

  // Filter orders according to selected date range and fulfillment channel
  const filteredOrders = useMemo(() => {
    return filterOrdersByRange(orders, dateRange, orderTypeFilter);
  }, [orders, dateRange, orderTypeFilter]);

  // Precompute metrics
  const summaryMetrics = useMemo(() => computeSalesSummary(filteredOrders), [filteredOrders]);
  const paymentBreakdown = useMemo(() => computePaymentBreakdown(filteredOrders), [filteredOrders]);
  const orderTypeBreakdown = useMemo(() => computeOrderTypeBreakdown(filteredOrders), [filteredOrders]);
  const itemSales = useMemo(() => computeItemSalesReport(filteredOrders, menuItems, categories), [
    filteredOrders,
    menuItems,
    categories,
  ]);
  const hourlySales = useMemo(() => computeHourlySalesReport(filteredOrders), [filteredOrders]);
  const weeklyData = useMemo(() => computeWeeklySalesReport(filteredOrders), [filteredOrders]);
  const dailyTrend = useMemo(() => computeDailyTrend(filteredOrders), [filteredOrders]);
  const categorySales = useMemo(() => computeCategorySales(filteredOrders, menuItems, categories), [
    filteredOrders,
    menuItems,
    categories,
  ]);
  const staffPerformance = useMemo(() => computeStaffSalesReport(filteredOrders), [filteredOrders]);
  const taxMetrics = useMemo(() => computeTaxDiscountMetrics(filteredOrders), [filteredOrders]);

  // Print Official Z-Report / Daily Settlement
  const handlePrintZReport = () => {
    const htmlContent = generateZReportHTML(
      summaryMetrics,
      paymentBreakdown,
      orderTypeBreakdown,
      taxMetrics,
      settings,
      dateRange.label
    );
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // One-click Enrich with realistic demo data
  const handleLoadDemoData = () => {
    setIsSeedingDemo(true);
    const demo = generateDemoOrders();
    // Merge existing orders with demo orders avoiding duplicate IDs
    const existingIds = new Set(orders.map((o) => o.id));
    const newBatch = demo.filter((d) => !existingIds.has(d.id));
    setOrders([...orders, ...newBatch]);
    setTimeout(() => {
      setIsSeedingDemo(false);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Top Header Controls Panel */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <BarChart3 className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Restaurant Analytics & Reports Center
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time sales auditing, item velocity, hourly rush patterns, weekly day-of-week trends, and store P&L.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print Z-Report */}
            <button
              onClick={handlePrintZReport}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span>Print Z-Report / Audit</span>
            </button>

            {/* If very few orders, offer sample sales population */}
            {orders.length <= 5 && (
              <button
                onClick={handleLoadDemoData}
                disabled={isSeedingDemo}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl transition-all border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5"
                title="Populates realistic multi-day orders for complete demo charts"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeedingDemo ? 'Populating...' : 'Enrich with Demo Sales'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filter & Channel Controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setDatePreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  datePreset === preset.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Channel Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold shrink-0">Channel:</span>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Channels</option>
              <option value="dine_in">Dine-In Only</option>
              <option value="takeaway">Takeaway / Counter</option>
              <option value="delivery">Home Delivery</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (Shown if 'custom' is active) */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">From Date:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 dark:text-slate-400">To Date:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>
            <span className="text-slate-500 text-[11px]">
              Active Window: <strong>{dateRange.label}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase font-black ${
                    isActive ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Area */}
      <div>
        {activeTab === 'summary' && (
          <SalesSummaryReport
            summary={summaryMetrics}
            paymentBreakdown={paymentBreakdown}
            orderTypeBreakdown={orderTypeBreakdown}
            dailyTrend={dailyTrend}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'item_sales' && (
          <ItemSalesReport
            itemSales={itemSales}
            categories={categories}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'daily' && (
          <DailyReport
            hourlySales={hourlySales}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyReport
            weeklyData={weeklyData}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyReport
            summary={summaryMetrics}
            dailyTrend={dailyTrend}
            expenses={expenses}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryReport
            categorySales={categorySales}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'taxes' && (
          <TaxDiscountReport
            taxMetrics={taxMetrics}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}

        {activeTab === 'staff' && (
          <StaffReport
            staffPerformance={staffPerformance}
            settings={settings}
            dateLabel={dateRange.label}
          />
        )}
      </div>
    </div>
  );
};
