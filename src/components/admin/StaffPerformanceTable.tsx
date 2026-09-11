import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Eye,
  Filter,
  Flame,
  HelpCircle,
  Percent,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, User, UserRole } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency, formatDate, formatDateTime, getRoleDetails } from '../../utils/formatters';

export interface StaffPerformanceMetric {
  user: User;
  totalOrdersHandled: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  completionRate: number; // percentage
  totalGrossRevenue: number;
  avgOrderValue: number;
  totalItemsCount: number;
  totalDiscountAmount: number;
  avgDiscountPercent: number;
  avgTurnaroundMinutes: number;
  orders: Order[];
  topSellingCategory: string;
  efficiencyScore: number; // 0 - 100
  performanceTier: 'Elite Star' | 'High Performer' | 'Steady' | 'Needs Training';
}

type SortField =
  | 'name'
  | 'completedOrders'
  | 'revenue'
  | 'aov'
  | 'items'
  | 'completionRate'
  | 'avgTurnaround'
  | 'efficiencyScore';

export const StaffPerformanceTable: React.FC = () => {
  const { orders, categories, menuItems, settings } = useRestaurant();
  const { allUsers } = useAuth();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortField, setSortField] = useState<SortField>('completedOrders');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // Quick Order Drill-down Modal
  const [selectedStaffForDrilldown, setSelectedStaffForDrilldown] = useState<StaffPerformanceMetric | null>(null);

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((order) => {
      if (selectedTimeRange === 'all') return true;
      const orderDate = new Date(order.createdAt);
      if (isNaN(orderDate.getTime())) return true;

      const diffMs = now.getTime() - orderDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (selectedTimeRange === 'today') return diffDays <= 1;
      if (selectedTimeRange === 'week') return diffDays <= 7;
      if (selectedTimeRange === 'month') return diffDays <= 30;
      return true;
    });
  }, [orders, selectedTimeRange]);

  // Compute staff performance metrics dynamically
  const staffMetrics: StaffPerformanceMetric[] = useMemo(() => {
    return allUsers.map((user) => {
      // Find orders attributed to this user as cashier, waiter, rider, or by matching name/id
      const userOrders = filteredOrders.filter((order) => {
        const isCashier = order.cashierId === user.id || order.cashierName === user.name;
        const isWaiter = order.waiterId === user.id || order.waiterName === user.name;
        const isRider = order.riderId === user.id || order.riderName === user.name;

        // If kitchen staff, match all food orders if no specific cashier, or their station
        if (user.role === 'kitchen_staff') {
          return order.status === 'completed' || order.status === 'served' || order.status === 'ready';
        }

        return isCashier || isWaiter || isRider;
      });

      const totalOrdersHandled = userOrders.length;
      
      // Completed orders
      const completedOrders = userOrders.filter(
        (o) =>
          o.status === 'completed' ||
          o.status === 'served' ||
          o.status === 'delivered' ||
          (o.paymentStatus === 'paid' && o.status !== 'cancelled')
      );
      const completedOrdersCount = completedOrders.length;

      // Cancelled orders
      const cancelledOrders = userOrders.filter((o) => o.status === 'cancelled');
      const cancelledOrdersCount = cancelledOrders.length;

      const completionRate =
        totalOrdersHandled > 0 ? (completedOrdersCount / totalOrdersHandled) * 100 : 0;

      // Gross revenue from completed orders
      const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

      // Average Order Value (AOV)
      const avgOrderValue = completedOrdersCount > 0 ? totalGrossRevenue / completedOrdersCount : 0;

      // Total items count
      const totalItemsCount = completedOrders.reduce(
        (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + item.quantity, 0),
        0
      );

      // Discounts granted
      const totalDiscountAmount = completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
      const totalSubtotal = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      const avgDiscountPercent =
        totalSubtotal > 0 ? (totalDiscountAmount / totalSubtotal) * 100 : 0;

      // Turnaround time calculation (in minutes)
      let totalTurnaroundMins = 0;
      let validTurnaroundCount = 0;

      completedOrders.forEach((o) => {
        const start = new Date(o.createdAt).getTime();
        const end = new Date(o.updatedAt || o.createdAt).getTime();
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          const diffMins = (end - start) / (1000 * 60);
          // Bound between 1 and 60 minutes for realistic floor operations
          const normalizedMins = Math.max(1, Math.min(diffMins || o.estimatedPrepTimeMinutes || 12, 60));
          totalTurnaroundMins += normalizedMins;
          validTurnaroundCount++;
        }
      });

      const avgTurnaroundMinutes =
        validTurnaroundCount > 0 ? totalTurnaroundMins / validTurnaroundCount : 12;

      // Category breakdown to find top selling category for this staff
      const categorySales: { [catId: string]: number } = {};
      completedOrders.forEach((o) => {
        (o.items || []).forEach((item) => {
          const mItem = menuItems.find((m) => m.id === item.menuItemId);
          if (mItem) {
            categorySales[mItem.categoryId] =
              (categorySales[mItem.categoryId] || 0) + item.quantity;
          }
        });
      });

      let topCategoryName = 'General';
      let maxCatQty = 0;
      Object.entries(categorySales).forEach(([catId, qty]) => {
        if (qty > maxCatQty) {
          maxCatQty = qty;
          const cat = categories.find((c) => c.id === catId);
          if (cat) topCategoryName = cat.name;
        }
      });

      // Composite Efficiency Score (0 - 100)
      // Factors: Order volume (40%), Completion Rate (30%), Speed (20%), Discount discipline (10%)
      const volumeScore = Math.min(100, (completedOrdersCount / 10) * 100);
      const rateScore = Math.min(100, completionRate);
      const speedScore = Math.max(0, 100 - (avgTurnaroundMinutes - 5) * 3);
      const discountDisciplineScore = Math.max(0, 100 - avgDiscountPercent * 5);

      const efficiencyScore = Math.round(
        volumeScore * 0.4 +
          rateScore * 0.3 +
          speedScore * 0.2 +
          discountDisciplineScore * 0.1
      );

      let performanceTier: StaffPerformanceMetric['performanceTier'] = 'Steady';
      if (efficiencyScore >= 85 && completedOrdersCount >= 3) {
        performanceTier = 'Elite Star';
      } else if (efficiencyScore >= 70) {
        performanceTier = 'High Performer';
      } else if (efficiencyScore >= 45) {
        performanceTier = 'Steady';
      } else {
        performanceTier = 'Needs Training';
      }

      return {
        user,
        totalOrdersHandled,
        completedOrdersCount,
        cancelledOrdersCount,
        completionRate,
        totalGrossRevenue,
        avgOrderValue,
        totalItemsCount,
        totalDiscountAmount,
        avgDiscountPercent,
        avgTurnaroundMinutes,
        orders: completedOrders,
        topSellingCategory: topCategoryName,
        efficiencyScore,
        performanceTier,
      };
    });
  }, [allUsers, filteredOrders, menuItems, categories]);

  // Filter & Sort Staff Metrics
  const filteredAndSortedMetrics = useMemo(() => {
    return staffMetrics
      .filter((metric) => {
        const matchesSearch =
          metric.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          metric.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (metric.user.department &&
            metric.user.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
          metric.user.role.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = selectedRole === 'all' || metric.user.role === selectedRole;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        let diff = 0;
        switch (sortField) {
          case 'name':
            diff = a.user.name.localeCompare(b.user.name);
            break;
          case 'completedOrders':
            diff = a.completedOrdersCount - b.completedOrdersCount;
            break;
          case 'revenue':
            diff = a.totalGrossRevenue - b.totalGrossRevenue;
            break;
          case 'aov':
            diff = a.avgOrderValue - b.avgOrderValue;
            break;
          case 'items':
            diff = a.totalItemsCount - b.totalItemsCount;
            break;
          case 'completionRate':
            diff = a.completionRate - b.completionRate;
            break;
          case 'avgTurnaround':
            diff = a.avgTurnaroundMinutes - b.avgTurnaroundMinutes;
            break;
          case 'efficiencyScore':
            diff = a.efficiencyScore - b.efficiencyScore;
            break;
          default:
            diff = b.completedOrdersCount - a.completedOrdersCount;
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [staffMetrics, searchQuery, selectedRole, sortField, sortOrder]);

  // Overall Team Aggregates
  const totalCompletedOrders = staffMetrics.reduce((s, m) => s + m.completedOrdersCount, 0);
  const totalStaffRevenue = staffMetrics.reduce((s, m) => s + m.totalGrossRevenue, 0);
  const avgTeamTurnaround =
    staffMetrics.length > 0
      ? staffMetrics.reduce((s, m) => s + m.avgTurnaroundMinutes, 0) / staffMetrics.length
      : 0;
  const topPerformer = [...staffMetrics].sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export Staff Performance CSV
  const handleExportCSV = () => {
    const dataToExport = filteredAndSortedMetrics.map((m) => ({
      'Staff Name': m.user.name,
      'Email': m.user.email,
      'Role': m.user.role,
      'Department': m.user.department || 'General',
      'Completed Orders': m.completedOrdersCount,
      'Cancelled Orders': m.cancelledOrdersCount,
      'Completion Rate %': `${m.completionRate.toFixed(1)}%`,
      'Gross Sales Revenue': m.totalGrossRevenue,
      'Average Order Value (AOV)': Math.round(m.avgOrderValue),
      'Items Handled': m.totalItemsCount,
      'Discounts Granted': m.totalDiscountAmount,
      'Avg Discount %': `${m.avgDiscountPercent.toFixed(1)}%`,
      'Avg Turnaround Time': `${m.avgTurnaroundMinutes.toFixed(1)} mins`,
      'Efficiency Score': `${m.efficiencyScore}/100`,
      'Performance Tier': m.performanceTier,
    }));

    exportToCSV(`CafeOS_Staff_Performance_Report_${new Date().toISOString().split('T')[0]}`, dataToExport);
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header & KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Orders Fulfilled
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalCompletedOrders}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Across active staff roster
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Staff Attributed Sales
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalStaffRevenue, settings.currencySymbol)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              Completed ticket totals
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Avg Order Turnaround
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {avgTeamTurnaround.toFixed(1)}m
            </div>
            <div className="text-[10px] text-blue-600 font-bold mt-0.5">
              Order creation to fulfillment
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Top Floor Performer
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate max-w-[140px]">
              {topPerformer ? topPerformer.user.name : 'N/A'}
            </div>
            <div className="text-[10px] text-amber-500 font-bold mt-0.5 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>Score: {topPerformer ? topPerformer.efficiencyScore : 0}/100</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Role Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff metrics by name, role or department..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:border-amber-500 outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Roles ({allUsers.length})</option>
            <option value="cashier">POS Cashiers</option>
            <option value="biller">Billers</option>
            <option value="admin">Store Managers</option>
            <option value="super_admin">Super Admins</option>
            <option value="kitchen_staff">Kitchen Staff / Chefs</option>
            <option value="delivery_rider">Delivery Riders</option>
            <option value="employee">Floor Staff</option>
          </select>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: '7 Days' },
                { id: 'month', label: '30 Days' },
              ] as { id: typeof selectedTimeRange; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTimeRange(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedTimeRange === t.id
                    ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Export Button */}
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Metrics CSV</span>
        </button>
      </div>

      {/* Main Staff Performance Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 uppercase font-black text-slate-500 text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Staff Member & Role</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-center cursor-pointer select-none"
                  onClick={() => handleSort('completedOrders')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Completed Orders</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer select-none"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Gross Sales</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer select-none"
                  onClick={() => handleSort('aov')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>AOV</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-center cursor-pointer select-none"
                  onClick={() => handleSort('items')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Items Sold</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-center cursor-pointer select-none"
                  onClick={() => handleSort('completionRate')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Completion Rate</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-center cursor-pointer select-none"
                  onClick={() => handleSort('avgTurnaround')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Avg Turnaround</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-center cursor-pointer select-none"
                  onClick={() => handleSort('efficiencyScore')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Efficiency Rating</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedMetrics.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-medium">
                    No staff members match the current search filter.
                  </td>
                </tr>
              ) : (
                filteredAndSortedMetrics.map((metric) => {
                  const roleDetails = getRoleDetails(metric.user.role);
                  const isExpanded = expandedStaffId === metric.user.id;

                  return (
                    <React.Fragment key={metric.user.id}>
                      <tr
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isExpanded ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        {/* Staff Profile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                metric.user.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={metric.user.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{metric.user.name}</span>
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase ${roleDetails.bg} ${roleDetails.text}`}
                                >
                                  {roleDetails.label}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {metric.user.email} • {metric.user.department || 'Floor Ops'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Completed Orders Count */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{metric.completedOrdersCount}</span>
                          </div>
                          {metric.cancelledOrdersCount > 0 && (
                            <div className="text-[10px] text-rose-500 font-semibold mt-0.5">
                              {metric.cancelledOrdersCount} cancelled
                            </div>
                          )}
                        </td>

                        {/* Gross Sales */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-black text-slate-900 dark:text-white">
                            {formatCurrency(metric.totalGrossRevenue, settings.currencySymbol)}
                          </div>
                          {metric.totalDiscountAmount > 0 && (
                            <div className="text-[10px] text-amber-600 font-medium">
                              -₹{metric.totalDiscountAmount.toFixed(0)} disc ({metric.avgDiscountPercent.toFixed(0)}%)
                            </div>
                          )}
                        </td>

                        {/* Average Order Value (AOV) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-black text-amber-600 dark:text-amber-400">
                            {formatCurrency(metric.avgOrderValue, settings.currencySymbol)}
                          </div>
                          <div className="text-[10px] text-slate-400">per ticket</div>
                        </td>

                        {/* Items Sold */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {metric.totalItemsCount} pcs
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[100px] mx-auto">
                            Top: {metric.topSellingCategory}
                          </div>
                        </td>

                        {/* Completion Rate */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-slate-900 dark:text-white">
                              {metric.completionRate.toFixed(0)}%
                            </span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  metric.completionRate >= 90
                                    ? 'bg-emerald-500'
                                    : metric.completionRate >= 70
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, metric.completionRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Turnaround Time */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 font-mono font-bold text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{metric.avgTurnaroundMinutes.toFixed(1)}m</span>
                          </span>
                        </td>

                        {/* Efficiency Rating & Tier */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                metric.performanceTier === 'Elite Star'
                                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                                  : metric.performanceTier === 'High Performer'
                                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                  : metric.performanceTier === 'Steady'
                                  ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                  : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              }`}
                            >
                              {metric.performanceTier}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Score {metric.efficiencyScore}/100
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setExpandedStaffId(isExpanded ? null : metric.user.id)
                              }
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
                              title="Toggle Order Breakdown"
                            >
                              <span>{isExpanded ? 'Hide' : 'Breakdown'}</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            <button
                              onClick={() => setSelectedStaffForDrilldown(metric)}
                              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                              title="View Completed Order Tickets"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Order Breakdown Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/60">
                          <td colSpan={9} className="p-4">
                            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-amber-500" />
                                  <span>
                                    Detailed Order Performance History for {metric.user.name} ({metric.orders.length} Completed Tickets)
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  Total Value: {formatCurrency(metric.totalGrossRevenue)}
                                </span>
                              </div>

                              {metric.orders.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-xs">
                                  No completed orders recorded for this staff member in the selected period.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                                  {metric.orders.map((ord) => (
                                    <div
                                      key={ord.id}
                                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center"
                                    >
                                      <div>
                                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                          <span>#{ord.orderNumber}</span>
                                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold uppercase">
                                            {ord.orderType}
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                          {ord.items.length} items • {ord.paymentMethod?.toUpperCase() || 'PAID'}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-black text-emerald-600 dark:text-emerald-400">
                                          {formatCurrency(ord.grandTotal)}
                                        </div>
                                        <div className="text-[9px] text-slate-400">
                                          {formatDateTime(ord.createdAt).split(',')[1]}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Full Staff Completed Orders Drilldown */}
      {selectedStaffForDrilldown && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedStaffForDrilldown.user.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                  }
                  alt={selectedStaffForDrilldown.user.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {selectedStaffForDrilldown.user.name} — Fulfilled Orders
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStaffForDrilldown.completedOrdersCount} Completed Tickets • Total Gross Sales:{' '}
                    <strong className="text-emerald-600">
                      {formatCurrency(selectedStaffForDrilldown.totalGrossRevenue)}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaffForDrilldown(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedStaffForDrilldown.orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  No completed orders logged for this staff member in this timeframe.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedStaffForDrilldown.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            Order #{ord.orderNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase">
                            {ord.orderType}
                          </span>
                          {ord.tableName && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-500 text-[10px] font-bold">
                              {ord.tableName}
                            </span>
                          )}
                        </div>

                        <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {(ord.items || []).map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono">
                          Placed: {formatDateTime(ord.createdAt)}
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-4">
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(ord.grandTotal)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          {ord.paymentMethod} • {ord.paymentStatus}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStaffForDrilldown(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
