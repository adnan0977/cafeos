import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Percent,
  Receipt,
  ShieldCheck,
  Tag,
  TrendingDown,
} from 'lucide-react';
import React from 'react';
import { RestaurantSettings } from '../../types';
import { exportToCSV } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';
import { TaxAuditMetrics } from '../../utils/reportUtils';

interface TaxDiscountReportProps {
  taxMetrics: TaxAuditMetrics;
  settings: RestaurantSettings;
  dateLabel: string;
}

export const TaxDiscountReport: React.FC<TaxDiscountReportProps> = ({
  taxMetrics,
  settings,
  dateLabel,
}) => {
  const handleExportCSV = () => {
    const data = [
      { Metric: 'Taxable Net Value', Amount: taxMetrics.taxableValue },
      { Metric: 'CGST (2.5%)', Amount: taxMetrics.cgstAmount },
      { Metric: 'SGST (2.5%)', Amount: taxMetrics.sgstAmount },
      { Metric: 'Total GST Collected', Amount: taxMetrics.totalTaxCollected },
      { Metric: 'Total Promotional Discounts Given', Amount: taxMetrics.totalDiscountsGiven },
      { Metric: 'Bills with Discounts Applied', Amount: taxMetrics.promotionsCount },
    ];
    exportToCSV(`Tax_and_Discount_Audit_${dateLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, data);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span>Taxation Compliance (GST) & Discount Audit</span>
          </h2>
          <p className="text-xs text-slate-500">
            CGST, SGST tax liabilities and promotional discounts audit for {dateLabel}.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Tax Audit CSV</span>
        </button>
      </div>

      {/* Tax Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taxable Turnover */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Taxable Net Turnover</span>
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatCurrency(taxMetrics.taxableValue, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Base revenue subject to GST</div>
        </div>

        {/* CGST (2.5%) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">CGST (2.5%)</span>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(taxMetrics.cgstAmount, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Central GST share</div>
        </div>

        {/* SGST (2.5%) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">SGST (2.5%)</span>
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {formatCurrency(taxMetrics.sgstAmount, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">State GST share</div>
        </div>

        {/* Total Taxes */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total GST Liability</span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(taxMetrics.totalTaxCollected, settings.currencySymbol)}
          </div>
          <div className="text-xs text-slate-500 mt-1">5.0% composite rate</div>
        </div>
      </div>

      {/* Tax & Discount Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Filing Summary Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>GST Compliance Statement</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">GSTIN: {settings.gstNumber || '27AAAPL1234C1ZV'}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Total Taxable Value (Food & Drinks):</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(taxMetrics.taxableValue, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Central Tax - CGST @ 2.5%:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(taxMetrics.cgstAmount, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">State Tax - SGST @ 2.5%:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(taxMetrics.sgstAmount, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-2.5 font-black text-sm border-t-2 border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
              <span>TOTAL GST COLLECTED & PAYABLE:</span>
              <span>{formatCurrency(taxMetrics.totalTaxCollected, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {/* Discounts Audit Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-500" />
              <span>Promotions & Discounts Audit</span>
            </h3>
            <span className="text-xs font-bold text-rose-600">
              {taxMetrics.promotionsCount} Bills Discounted
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Total Promotional Discounts:</span>
              <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                -{formatCurrency(taxMetrics.totalDiscountsGiven, settings.currencySymbol)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Coupon Discount Transactions:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {taxMetrics.promotionsCount} orders
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Discount Absorption Impact:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {taxMetrics.taxableValue > 0
                  ? `${((taxMetrics.totalDiscountsGiven / taxMetrics.taxableValue) * 100).toFixed(1)}% of net sales`
                  : '0%'}
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
              Manager Note: Ensure all manual discounts above 10% require supervisor authorization to prevent cashier leakages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
