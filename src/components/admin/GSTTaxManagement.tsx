import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Percent,
  Receipt,
  Download,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Building,
  Hash,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { GSTTaxSlab } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportToCSV } from '../../utils/exportUtils';

const DEFAULT_GST_SLABS: GSTTaxSlab[] = [
  {
    id: 'gst-0',
    name: '0% Exempt / Nil Rated',
    totalRate: 0,
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    hsnCode: '0401',
    description: 'Fresh milk, raw dairy, bread, and non-packaged grains',
    isDefault: false,
  },
  {
    id: 'gst-5',
    name: '5% Standard Restaurant GST',
    totalRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    igstRate: 5,
    hsnCode: '996331',
    description: 'Restaurant dining, café beverages, takeaway and food delivery',
    isDefault: true,
  },
  {
    id: 'gst-12',
    name: '12% Processed & Confectionery',
    totalRate: 12,
    cgstRate: 6,
    sgstRate: 6,
    igstRate: 12,
    hsnCode: '2106',
    description: 'Packaged bakery items, roasted nuts, canned and bottled beverages',
    isDefault: false,
  },
  {
    id: 'gst-18',
    name: '18% Catering & Luxury Hotel Dining',
    totalRate: 18,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    hsnCode: '996332',
    description: 'Outdoor corporate catering, events, and hotel dining room services',
    isDefault: false,
  },
  {
    id: 'gst-28',
    name: '28% Aerated & Caffeinated Beverages',
    totalRate: 28,
    cgstRate: 14,
    sgstRate: 14,
    igstRate: 28,
    hsnCode: '2202',
    description: 'Carbonated cold drinks, energy drinks, and premium syrups',
    isDefault: false,
  },
];

export const GSTTaxManagement: React.FC = () => {
  const { settings, updateSettings, orders = [] } = useRestaurant();

  const [slabs, setSlabs] = useState<GSTTaxSlab[]>(() => {
    const saved = localStorage.getItem('royalpos_gst_slabs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_GST_SLABS;
  });

  const [isInclusive, setIsInclusive] = useState<boolean>(() => {
    return settings.taxRates?.[0]?.isInclusive ?? false;
  });

  const [enableIgst, setEnableIgst] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<GSTTaxSlab | null>(null);
  const [saveBanner, setSaveBanner] = useState('');

  // Form State
  const [slabName, setSlabName] = useState('');
  const [totalRate, setTotalRate] = useState('5');
  const [hsnCode, setHsnCode] = useState('996331');
  const [description, setDescription] = useState('');

  // Financial calculations from live settled orders
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const grossInvoicedSales = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalTaxesCollected = paidOrders.reduce((sum, o) => sum + o.taxTotal, 0);
  const totalTaxableValue = Math.max(0, grossInvoicedSales - totalTaxesCollected);

  const totalCGST = totalTaxesCollected / 2;
  const totalSGST = totalTaxesCollected / 2;
  const totalIGST = enableIgst ? totalTaxesCollected : 0;

  const handleToggleInclusive = (inclusive: boolean) => {
    setIsInclusive(inclusive);
    const updatedRates = (settings.taxRates || []).map((t) => ({
      ...t,
      isInclusive: inclusive,
    }));
    updateSettings({
      taxRates: updatedRates.length > 0 ? updatedRates : [{ name: 'GST', percent: 5, isInclusive: inclusive }],
    });
    setSaveBanner(
      inclusive
        ? 'Switched to Tax-Inclusive Pricing (Menu prices displayed to customers already include GST).'
        : 'Switched to Tax-Exclusive Pricing (5% GST will be calculated on top of base dish prices).'
    );
    setTimeout(() => setSaveBanner(''), 4000);
  };

  const handleOpenAdd = () => {
    setEditingSlab(null);
    setSlabName('');
    setTotalRate('5');
    setHsnCode('996331');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slab: GSTTaxSlab) => {
    setEditingSlab(slab);
    setSlabName(slab.name);
    setTotalRate(String(slab.totalRate));
    setHsnCode(slab.hsnCode);
    setDescription(slab.description);
    setIsModalOpen(true);
  };

  const handleSaveSlab = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(totalRate) || 0;
    const halfRate = rateNum / 2;

    if (editingSlab) {
      setSlabs((prev) =>
        prev.map((s) =>
          s.id === editingSlab.id
            ? {
                ...s,
                name: slabName,
                totalRate: rateNum,
                cgstRate: halfRate,
                sgstRate: halfRate,
                igstRate: rateNum,
                hsnCode,
                description,
              }
            : s
        )
      );
      setSaveBanner(`GST Slab "${slabName}" updated successfully!`);
    } else {
      const newSlab: GSTTaxSlab = {
        id: `gst-${Date.now()}`,
        name: slabName,
        totalRate: rateNum,
        cgstRate: halfRate,
        sgstRate: halfRate,
        igstRate: rateNum,
        hsnCode,
        description,
        isDefault: false,
      };
      setSlabs((prev) => [...prev, newSlab]);
      setSaveBanner(`New GST Tax Slab "${slabName}" registered!`);
    }
    setIsModalOpen(false);
    setTimeout(() => setSaveBanner(''), 3500);
  };

  const handleExportGSTR3B = () => {
    const csvRows = [
      {
        'GSTR-3B Section': '3.1 (a) Outward Taxable Supplies',
        'Tax Slab': '5% Restaurant GST',
        'HSN / SAC': '996331',
        'Total Invoiced Value (INR)': grossInvoicedSales.toFixed(2),
        'Net Taxable Value (INR)': totalTaxableValue.toFixed(2),
        'CGST Amount (INR)': totalCGST.toFixed(2),
        'SGST Amount (INR)': totalSGST.toFixed(2),
        'IGST Amount (INR)': (enableIgst ? totalTaxesCollected : 0).toFixed(2),
        'Cess (INR)': '0.00',
      },
      {
        'GSTR-3B Section': '3.1 (b) Zero Rated / Exempt Supplies',
        'Tax Slab': '0% Nil Rated',
        'HSN / SAC': '0401',
        'Total Invoiced Value (INR)': '0.00',
        'Net Taxable Value (INR)': '0.00',
        'CGST Amount (INR)': '0.00',
        'SGST Amount (INR)': '0.00',
        'IGST Amount (INR)': '0.00',
        'Cess (INR)': '0.00',
      },
      {
        'GSTR-3B Section': 'Total Tax Liability',
        'Tax Slab': 'Consolidated Period',
        'HSN / SAC': 'All Slabs',
        'Total Invoiced Value (INR)': grossInvoicedSales.toFixed(2),
        'Net Taxable Value (INR)': totalTaxableValue.toFixed(2),
        'CGST Amount (INR)': totalCGST.toFixed(2),
        'SGST Amount (INR)': totalSGST.toFixed(2),
        'IGST Amount (INR)': (enableIgst ? totalTaxesCollected : 0).toFixed(2),
        'Cess (INR)': '0.00',
      },
    ];
    exportToCSV(`RoyalPOS_GSTR3B_Tax_Report_${new Date().toISOString().split('T')[0]}`, csvRows);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Indian GST &amp; Tax Configuration Center
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                100% GST Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure CGST, SGST, and IGST tax slabs, HSN/SAC codes, tax-inclusive billing, and export automated GSTR-3B tax return reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportGSTR3B}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export GSTR-3B (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Tax Slab</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveBanner}</span>
        </div>
      )}

      {/* Key GST Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Invoiced Revenue</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(grossInvoicedSales)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">From {paidOrders.length} settled tax invoices</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Taxable Turnover</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(totalTaxableValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Base value excluding taxes</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CGST + SGST Collected</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalTaxesCollected)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            CGST: {formatCurrency(totalCGST)} | SGST: {formatCurrency(totalSGST)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active GSTIN License</div>
          <div className="text-sm font-mono font-black text-slate-900 dark:text-white mt-1.5 truncate">
            {settings.gstNumber || '07AAAAA0000A1Z5'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            FSSAI: {settings.fssaiLicense || '10722001000123'}
          </div>
        </div>
      </div>

      {/* Tax Calculation Mode & Interstate Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Mode Toggle */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Bill Pricing Calculation Logic</span>
            </h4>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                isInclusive ? 'bg-indigo-500/15 text-indigo-600' : 'bg-amber-500/15 text-amber-600'
              }`}
            >
              {isInclusive ? 'Inclusive (MRP)' : 'Exclusive (+GST on Bill)'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Choose whether food and beverage menu prices shown to guests already contain the GST tax or if tax is calculated and added as extra line items at final settlement.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleToggleInclusive(false)}
              className={`p-3 rounded-xl border text-left transition-all ${
                !isInclusive
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-black">Tax-Exclusive Pricing</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dish ₹200 + 5% GST (₹10) = Total ₹210</div>
            </button>

            <button
              type="button"
              onClick={() => handleToggleInclusive(true)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isInclusive
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-black">Tax-Inclusive Pricing (MRP)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dish ₹210 (includes ₹10 GST breakdown)</div>
            </button>
          </div>
        </div>

        {/* GSTIN & Interstate IGST Setup */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Interstate IGST &amp; Legal Compliance</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              For catering orders or delivery orders across state lines, calculate Integrated Goods and Services Tax (IGST) in place of local CGST+SGST.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Interstate IGST Billing</span>
              <input
                type="checkbox"
                checked={enableIgst}
                onChange={(e) => setEnableIgst(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              When enabled, customers from different state GST codes receive IGST calculation on tax invoices.
            </div>
          </div>
        </div>
      </div>

      {/* GST Slabs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Standard GST Tax Slabs &amp; HSN Mapping
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Slabs mapped to menu items and categories for automatic billing invoice breakdown.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl">
            {slabs.length} Slabs Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Tax Slab Name</th>
                <th className="py-3 px-4">Total GST Rate</th>
                <th className="py-3 px-4">CGST Rate</th>
                <th className="py-3 px-4">SGST Rate</th>
                <th className="py-3 px-4">IGST Rate</th>
                <th className="py-3 px-4">HSN / SAC Code</th>
                <th className="py-3 px-4">Description &amp; Goods Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{slab.name}</span>
                      {slab.isDefault && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-600 text-sm">{slab.totalRate}%</td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{slab.cgstRate}%</td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{slab.sgstRate}%</td>
                  <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">{slab.igstRate}%</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {slab.hsnCode}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{slab.description}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(slab)}
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GSTR-3B Tax Return Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>GSTR-3B Ready Return Ledger (Outward Supplies)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consolidated summary prepared according to the GST Council Table 3.1 specifications.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportGSTR3B}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV for CA / Tax Filing</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Net Taxable Value</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(totalTaxableValue)}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Central GST (CGST)</span>
            <span className="text-base font-black text-emerald-600">{formatCurrency(totalCGST)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">State GST (SGST)</span>
            <span className="text-base font-black text-emerald-600">{formatCurrency(totalSGST)}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Integrated GST (IGST)</span>
            <span className="text-base font-black text-sky-600">{formatCurrency(totalIGST)}</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Tax Slab Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {editingSlab ? 'Edit Tax Slab' : 'Create Custom GST Slab'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlab} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slab Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5% Bakery Special"
                  value={slabName}
                  onChange={(e) => setSlabName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total GST Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={totalRate}
                    onChange={(e) => setTotalRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-600"
                  />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Auto-splits: {(parseFloat(totalRate) || 0) / 2}% CGST + {(parseFloat(totalRate) || 0) / 2}% SGST
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HSN / SAC Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="996331"
                    value={hsnCode}
                    onChange={(e) => setHsnCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Applicable Products
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Applicable on all freshly prepared hot beverages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md"
                >
                  Save Tax Slab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
