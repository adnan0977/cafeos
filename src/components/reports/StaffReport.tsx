import {
  Award,
  Download,
  FileSpreadsheet,
  Percent,
  Receipt,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import React from 'react';
import { RestaurantSettings } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import { StaffPerformanceItem } from '../../utils/reportUtils';

interface StaffReportProps {
  staffPerformance: StaffPerformanceItem[];
  settings: RestaurantSettings;
  dateLabel: string;
}

export const StaffReport: React.FC<StaffReportProps> = ({
  staffPerformance,
  settings,
  dateLabel,
}) => {
  const totalSales = staffPerformance.reduce((sum, s) => sum + s.totalSales, 0);

  const handleExportCSV = () => {
    const data = staffPerformance.map((s, index) => ({
      Rank: index + 1,
      'Staff Name': s.userName,
      Role: s.role,
      'Orders Billed': s.ordersCount,
      'Total Sales Generated': s.totalSales,
      'Average Ticket Size': s.avgTicket,
      'Discounts Authorized': s.totalDiscounts,
    }));
    exportToCSV(`Staff_Performance_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Staff & Cashier Sales Performance</span>
          </h2>
          <p className="text-xs text-slate-500">
            Order volume, revenue generated, and ticket sizes per staff member for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Staff CSV</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Orders Handled</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-3 text-right">Avg Ticket Size</th>
                <th className="py-3 px-3 text-right">Discounts Authorized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {staffPerformance.map((staff, index) => (
                <tr key={staff.userId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 text-center font-bold text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <span>{staff.userName}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                      {staff.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {staff.ordersCount}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                    {formatCurrency(staff.totalSales, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400 font-medium">
                    {formatCurrency(staff.avgTicket, settings.currencySymbol)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-500 font-medium">
                    {staff.totalDiscounts > 0 ? formatCurrency(staff.totalDiscounts, settings.currencySymbol) : '—'}
                  </td>
                </tr>
              ))}
              {staffPerformance.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No staff sales transactions recorded for this period.
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
